// Утилитарные функции

// Получение текста с правильным склонением для количества броней
function getRidesText(count) {
    count = parseInt(count) || 0;
    if (count % 10 === 1 && count % 100 !== 11) {
        return count + ' бронь';
    } else if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) {
        return count + ' брони';
    } else {
        return count + ' броней';
    }
}

// Получение времени окончания
function getEndTime(startTime, duration) {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    const endDate = new Date(startDate.getTime() + duration * 60000);
    return endDate.toTimeString().substring(0, 5);
}

// Получение названия модуля
function getModuleName(type) {
    const names = {
        karting: 'Картинг',
        party: 'Аренда зала',
        lounge: 'Лаундж зона',
        virtual: 'Симулятор'
    };
    return names[type] || type;
}

// Расчет общего количества слотов
function calculateTotalSlots(settings) {
    const [openHour, openMinute] = settings.openTime.split(':').map(Number);
    const [closeHour, closeMinute] = settings.closeTime.split(':').map(Number);
    const openMinutes = openHour * 60 + openMinute;
    const closeMinutes = closeHour * 60 + closeMinute;
    const totalMinutes = closeMinutes - openMinutes;
    return Math.floor(totalMinutes / settings.sessionDuration);
}

// Проверка, является ли день выходным
function isWeekend(dateStr) {
    const settings = getSettings();
    if (!settings.weekendCalendar) return false;
    
    // Если день явно отмечен как выходной
    if (settings.weekendCalendar[dateStr]) return true;
    
    // Проверяем стандартные выходные (суббота и воскресенье)
    const date = new Date(dateStr);
    return date.getDay() === 0 || date.getDay() === 6;
}

// Проверка применения цен выходного дня с учетом вечернего режима
function isWeekendPricing(dateStr, timeStr) {
    const settings = getSettings();
    
    // Если день выходной - всегда применяем цены выходного дня
    if (isWeekend(dateStr)) {
        return true;
    }
    
    // Если день будний, проверяем вечерний режим
    if (settings.eveningWeekendPricing && settings.eveningWeekendPricing.enabled) {
        const eveningTime = settings.eveningWeekendPricing.time;
        if (eveningTime && timeStr) {
            // Сравниваем время: если время бронирования >= вечернего времени, применяем цены выходного дня
            return timeStr >= eveningTime;
        }
    }
    
    // В остальных случаях применяем будничные цены
    return false;
}

// Функция проверки конфликтов бронирования зала с другими модулями
function checkPartyBookingConflicts(date, time, duration) {
    const conflictModules = [];
    
    // Проверяем картинг
    const kartingBookings = getBookings('karting');
    const kartingSettings = getSettings().karting;
    
    for (const booking of kartingBookings) {
        if (booking.date !== date) continue;
        
        const bookingStart = new Date(`${date}T${booking.time}`);
        const bookingEnd = new Date(bookingStart.getTime() + kartingSettings.sessionDuration * 60000);
        
        const partyStart = new Date(`${date}T${time}`);
        const partyEnd = new Date(partyStart.getTime() + duration * 60000);
        
        if (partyStart < bookingEnd && partyEnd > bookingStart) {
            conflictModules.push('картинг');
            break;
        }
    }
    
    // Проверяем лаундж зону
    const loungeBookings = getBookings('lounge');
    const loungeSettings = getSettings().lounge;
    
    for (const booking of loungeBookings) {
        if (booking.date !== date) continue;
        
        const bookingStart = new Date(`${date}T${booking.time}`);
        const bookingDuration = booking.duration || loungeSettings.sessionDuration;
        const bookingEnd = new Date(bookingStart.getTime() + bookingDuration * 60000);
        
        const partyStart = new Date(`${date}T${time}`);
        const partyEnd = new Date(partyStart.getTime() + duration * 60000);
        
        if (partyStart < bookingEnd && partyEnd > bookingStart) {
            conflictModules.push('лаундж зону');
            break;
        }
    }
    
    // Проверяем симуляторы
    const virtualBookings = getBookings('virtual');
    const virtualSettings = getSettings().virtual;
    
    for (const booking of virtualBookings) {
        if (booking.date !== date) continue;
        
        const bookingStart = new Date(`${date}T${booking.time}`);
        const bookingDuration = booking.duration || virtualSettings.baseDuration;
        const bookingEnd = new Date(bookingStart.getTime() + bookingDuration * 60000);
        
        const partyStart = new Date(`${date}T${time}`);
        const partyEnd = new Date(partyStart.getTime() + duration * 60000);
        
        if (partyStart < bookingEnd && partyEnd > bookingStart) {
            conflictModules.push('симуляторы');
            break;
        }
    }
    
    return conflictModules;
}

// Функция проверки блокировки времени бронированием зала
function isTimeSlotBlockedByParty(date, time, duration) {
    const partyBookings = getBookings('party');
    
    // Получаем настройки зала для определения длительности сеанса
    const partySettings = getSettings().party;
    
    for (const booking of partyBookings) {
        if (booking.date !== date) continue;
        
        // Получаем длительность брони зала
        const partyDuration = booking.duration || partySettings.sessionDuration;
        
        // Вычисляем время начала и окончания брони зала
        const partyStartTime = new Date(`${date}T${booking.time}`);
        const partyEndTime = new Date(partyStartTime.getTime() + partyDuration * 60000);
        
        // Вычисляем время начала и окончания проверяемого слота
        const slotStartTime = new Date(`${date}T${time}`);
        const slotEndTime = new Date(slotStartTime.getTime() + duration * 60000);
        
        // Проверяем пересечение интервалов
        if (slotStartTime < partyEndTime && slotEndTime > partyStartTime) {
            return true;
        }
    }
    
    return false;
}

// Функция проверки, заблокирован ли слот зала бронированиями других модулей
function isPartyTimeSlotBlocked(date, time, duration) {
    const otherModules = ['karting', 'lounge', 'virtual'];
    
    for (const moduleType of otherModules) {
        const bookings = getBookings(moduleType);
        const settings = getSettings()[moduleType];
        
        for (const booking of bookings) {
            if (booking.date !== date) continue;
            
            // Вычисляем время начала и окончания брони в другом модуле
            let bookingStart = new Date(`${date}T${booking.time}`);
            let bookingEnd;
            
            if (moduleType === 'karting') {
                bookingEnd = new Date(bookingStart.getTime() + settings.sessionDuration * 60000);
            } else if (moduleType === 'lounge') {
                const bookingDuration = booking.duration || settings.sessionDuration;
                bookingEnd = new Date(bookingStart.getTime() + bookingDuration * 60000);
            } else if (moduleType === 'virtual') {
                const bookingDuration = booking.duration || settings.baseDuration;
                bookingEnd = new Date(bookingStart.getTime() + bookingDuration * 60000);
            }
            
            // Вычисляем время начала и окончания брони зала
            const partyStart = new Date(`${date}T${time}`);
            const partyEnd = new Date(partyStart.getTime() + duration * 60000);
            
            // Проверяем пересечение интервалов
            if (partyStart < bookingEnd && partyEnd > bookingStart) {
                return true; // Найден конфликт
            }
        }
    }
    
    return false; // Конфликтов нет
}