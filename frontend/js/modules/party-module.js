// Логика модуля Аренды зала

function generatePartyCalendar() {
    const calendar = document.getElementById('partyCalendar');
    if (!calendar) return;
    
    const today = new Date();
    const currentMonth = currentCalendarDate.getMonth();
    const currentYear = currentCalendarDate.getFullYear();
    
    const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Март', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    const header = document.createElement('div');
    header.className = 'calendar-header';
    header.innerHTML = `
        <button class="calendar-nav-btn" onclick="changeMonth(-1)">‹</button>
        <div class="calendar-title">${monthNames[currentMonth]} ${currentYear}</div>
        <button class="calendar-nav-btn" onclick="changeMonth(1)">›</button>
    `;
    calendar.innerHTML = '';
    calendar.appendChild(header);
    
    const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const weekdaysRow = document.createElement('div');
    weekdaysRow.className = 'calendar-grid';
    weekdays.forEach(day => {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day-header';
        dayElement.textContent = day;
        weekdaysRow.appendChild(dayElement);
    });
    calendar.appendChild(weekdaysRow);
    
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = (firstDay.getDay() + 6) % 7;
    
    const daysGrid = document.createElement('div');
    daysGrid.className = 'calendar-grid';
    
    for (let i = 0; i < startingDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        daysGrid.appendChild(emptyDay);
    }
    
    const bookings = getBookings('party');
    const todayStr = today.toISOString().split('T')[0];
    const settings = getSettings().party;
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;
        
        if (dateStr === todayStr) dayElement.classList.add('today');
        if (dateStr === selectedDate) dayElement.classList.add('selected');
        
        const dayBookings = bookings.filter(b => b.date === dateStr);
        if (dayBookings.length > 0) {
            const totalSlots = calculateTotalSlots(settings);
            const dayBookingsCount = dayBookings.length;
            
            if (dayBookingsCount >= totalSlots) {
                dayElement.classList.add('full-bookings');
            } else {
                dayElement.classList.add('has-bookings');
            }
        }
        
        dayElement.onclick = () => selectDate(dateStr);
        daysGrid.appendChild(dayElement);
    }
    
    calendar.appendChild(daysGrid);
}

// Получить все бронирования, которые влияют на указанный слот
function getPartyBookingsForSlot(date, time) {
    const partyBookings = getBookings('party');
    const partySettings = getSettings().party;
    const relevantBookings = [];
    
    for (const booking of partyBookings) {
        if (booking.date !== date) continue;
        
        const bookingStart = new Date(`${date}T${booking.time}`);
        const bookingDuration = booking.duration || partySettings.sessionDuration;
        const bookingEnd = new Date(bookingStart.getTime() + bookingDuration * 60000);
        
        const slotStart = new Date(`${date}T${time}`);
        const slotEnd = new Date(slotStart.getTime() + partySettings.sessionDuration * 60000);
        
        // Если бронирование пересекается со слотом, добавляем его в список
        if (slotStart < bookingEnd && slotEnd > bookingStart) {
            relevantBookings.push(booking);
        }
    }
    
    return relevantBookings;
}

function loadPartySchedule() {
    const settings = getSettings().party;
    const date = selectedDate;
    
    const timeSlotsContainer = document.getElementById('partyTimeSlots');
    if (!timeSlotsContainer) return;
    
    timeSlotsContainer.innerHTML = '';
    
    const [openHour, openMinute] = settings.openTime.split(':').map(Number);
    const [closeHour, closeMinute] = settings.closeTime.split(':').map(Number);
    
    let currentTime = new Date();
    currentTime.setHours(openHour, openMinute, 0, 0);
    
    const endTime = new Date();
    endTime.setHours(closeHour, closeMinute, 0, 0);
    
    while (currentTime < endTime) {
        const timeString = currentTime.toTimeString().substring(0, 5);
        
        // Получаем ВСЕ бронирования, которые влияют на этот слот
        const slotBookings = getPartyBookingsForSlot(date, timeString);
        const bookedCount = slotBookings.length;
        const capacity = 1; // Всегда 1 зал
        const isFull = bookedCount >= capacity;
        const hasBookings = bookedCount > 0;
        
        // Проверяем, не заблокирован ли слот бронированиями других модулей
        const isBlockedByOtherModules = isPartyTimeSlotBlocked(date, timeString, settings.sessionDuration);
        
        // Проверяем, заблокирован ли слот бронированием на 120 минут
        const isBlockedByLongBooking = slotBookings.some(booking => 
            booking.duration === 120 && booking.time !== timeString
        );
        
        const slot = document.createElement('button');
        let slotClass = 'time-slot free';
        let slotText = `${timeString}<div style="font-size:12px; margin-top:6px;">${bookedCount}/${capacity}</div>`;
        
        if (isBlockedByOtherModules) {
            slotClass = 'time-slot blocked-by-party';
            slotText = `${timeString}<div style="font-size:12px; margin-top:6px;">ЗАНЯТО ДРУГИМИ</div>`;
        } else if (isBlockedByLongBooking) {
            slotClass = 'time-slot blocked-by-party';
            slotText = `${timeString}<div style="font-size:12px; margin-top:6px;">ЗАНЯТО ЗАЛОМ</div>`;
        } else if (isFull) {
            slotClass = 'time-slot booked';
        } else if (hasBookings) {
            slotClass = 'time-slot partial';
        }
        
        slot.className = slotClass;
        slot.innerHTML = slotText;
        
        // ВАЖНОЕ ИЗМЕНЕНИЕ: Разрешаем клик на ЛЮБОЙ слот, где есть бронирования
        // Это позволяет редактировать/удалять брони даже в заблокированных слотах
        if (hasBookings) {
            slot.onclick = () => handleSlotClick(date, timeString, slotBookings, capacity, 'party');
        } else if (!isBlockedByOtherModules && !isBlockedByLongBooking) {
            // Свободный слот - можно создавать новое бронирование
            slot.onclick = () => handleSlotClick(date, timeString, [], capacity, 'party');
        } else {
            // Заблокированный слот без бронирований - показываем сообщение
            slot.onclick = () => {
                if (isBlockedByOtherModules) {
                    alert('Это время заблокировано бронированиями в других модулях. Выберите другое время.');
                } else if (isBlockedByLongBooking) {
                    alert('Это время заблокировано бронированием зала на 120 минут. Выберите другое время.');
                }
            };
        }
        
        timeSlotsContainer.appendChild(slot);
        
        currentTime.setMinutes(currentTime.getMinutes() + settings.sessionDuration);
    }
}

// Выбор длительности аренды зала
function selectPartyDuration(duration) {
    currentPartyDuration = duration;
    
    // Обновляем визуальное выделение
    document.querySelectorAll('#partyBookingForm .duration-option').forEach(option => {
        option.classList.remove('selected');
    });
    document.querySelector(`#partyBookingForm .duration-option[data-duration="${duration}"]`).classList.add('selected');
    
    calculatePartyAmount();
}

// Изменение количества человек для аренды зала
function changePartyPeopleCount(delta) {
    const peopleElement = document.getElementById('partyPeopleCount');
    let count = parseInt(peopleElement.textContent);
    
    count += delta;
    if (count < 1) count = 1;
    
    peopleElement.textContent = count;
    calculatePartyAmount(); 
}

// Расчет стоимости (Аренда зала)
function calculatePartyAmount() {
    const settings = getSettings().party;
    const peopleCount = parseInt(document.getElementById('partyPeopleCount').textContent) || 1;
    
    // Выбираем цену в зависимости от длительности и дня недели/времени
    const useWeekendPrices = isWeekendPricing(selectedDate, currentPartyTime);
    let pricePerPerson;
    
    if (currentPartyDuration === 60) {
        pricePerPerson = useWeekendPrices ? settings.price1HourWeekend : settings.price1Hour;
    } else {
        pricePerPerson = useWeekendPrices ? settings.price2HoursWeekend : settings.price2Hours;
    }
    
    const basePrice = pricePerPerson * peopleCount;
    
    let discountAmount = parseInt(document.getElementById('partyManualDiscount').value) || 0;
    
    const totalAmount = basePrice - discountAmount;
    
    document.getElementById('partyBaseAmount').textContent = Math.round(basePrice);
    document.getElementById('partyDiscountAmount').textContent = Math.round(discountAmount);
    document.getElementById('partyTotalAmount').textContent = Math.round(totalAmount);
    
    if (!currentBooking) {
        document.getElementById('partyPaymentAmount').value = Math.round(totalAmount);
    }
}