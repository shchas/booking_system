// Логика модуля Симулятора

function generateVirtualCalendar() {
    const calendar = document.getElementById('virtualCalendar');
    if (!calendar) return;
    
    const today = new Date();
    const currentMonth = currentCalendarDate.getMonth();
    const currentYear = currentCalendarDate.getFullYear();
    
    const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
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
    
    const bookings = getBookings('virtual');
    const todayStr = today.toISOString().split('T')[0];
    const settings = getSettings().virtual;
    
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
            const totalCapacity = totalSlots * settings.maxSimulators;
            const daySimulators = dayBookings.reduce((sum, b) => sum + (parseInt(b.simulatorsCount) || 1), 0);
            
            if (daySimulators >= totalCapacity) {
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

function loadVirtualSchedule() {
    const settings = getSettings().virtual;
    const date = selectedDate;
    const bookings = getBookings('virtual');
    
    const timeSlotsContainer = document.getElementById('virtualTimeSlots');
    if (!timeSlotsContainer) return;
    
    timeSlotsContainer.innerHTML = '';
    
    const [openHour, openMinute] = settings.openTime.split(':').map(Number);
    const [closeHour, closeMinute] = settings.closeTime.split(':').map(Number);
    
    let currentTime = new Date();
    currentTime.setHours(openHour, openMinute, 0, 0);
    
    const endTime = new Date();
    endTime.setHours(closeHour, closeMinute, 0, 0);
    
    // Создаем временные слоты с учетом базовой длительности
    const baseDuration = settings.baseDuration || 15;
    
    while (currentTime < endTime) {
        const timeString = currentTime.toTimeString().substring(0, 5);
        
        // Проверяем, не пересекается ли этот слот с существующими бронированиями
        const slotBookings = bookings.filter(b => {
            if (b.date !== date) return false;
            
            const bookingStart = new Date(`${date}T${b.time}`);
            const bookingEnd = new Date(bookingStart.getTime() + (b.duration || baseDuration) * 60000);
            const slotStart = new Date(`${date}T${timeString}`);
            const slotEnd = new Date(slotStart.getTime() + baseDuration * 60000);
            
            // Проверяем пересечение временных интервалов
            return (slotStart < bookingEnd && slotEnd > bookingStart);
        });
        
        const bookedSimulators = slotBookings.reduce((sum, booking) => sum + (parseInt(booking.simulatorsCount) || 1), 0);
        const capacity = settings.maxSimulators;
        const isFull = bookedSimulators >= capacity;
        const hasBookings = bookedSimulators > 0;
        
        // Проверяем, не заблокирован ли слот бронированием зала
        const isBlockedByParty = isTimeSlotBlockedByParty(date, timeString, baseDuration);
        
        const slot = document.createElement('button');
        let slotClass = 'time-slot free';
        if (isBlockedByParty) {
            slotClass = 'time-slot blocked-by-party';
        } else if (isFull) {
            slotClass = 'time-slot booked';
        } else if (hasBookings) {
            slotClass = 'time-slot partial';
        }
        
        slot.className = slotClass;
        let slotText = `${timeString}<div style="font-size:12px; margin-top:6px;">${bookedSimulators}/${capacity}</div>`;
        if (isBlockedByParty) {
            slotText = `${timeString}<div style="font-size:12px; margin-top:6px;">ЗАНЯТО ЗАЛОМ</div>`;
        }
        slot.innerHTML = slotText;
        
        if (!isBlockedByParty) {
            slot.onclick = () => handleSlotClick(date, timeString, slotBookings, capacity, 'virtual');
        } else {
            slot.onclick = () => {
                alert('Это время заблокировано бронированием зала. Выберите другое время.');
            };
        }
        
        timeSlotsContainer.appendChild(slot);
        
        currentTime.setMinutes(currentTime.getMinutes() + baseDuration);
    }
}

// Выбор длительности симулятора
function selectVirtualDuration(duration) {
    currentVirtualDuration = duration;
    
    // Обновляем визуальное выделение
    document.querySelectorAll('#virtualBookingForm .duration-option').forEach(option => {
        option.classList.remove('selected');
    });
    document.querySelector(`#virtualBookingForm .duration-option[data-duration="${duration}"]`).classList.add('selected');
    
    calculateVirtualAmount();
}

// Изменение количества симуляторов
function changeVirtualSimulatorCount(delta) {
    const simulatorsElement = document.getElementById('virtualSimulatorsCount');
    let count = parseInt(simulatorsElement.textContent);
    const settings = getSettings().virtual;
    
    let otherBookedSimulators = currentBookedCount;
    if (currentBooking) {
        otherBookedSimulators = currentBookedCount - (parseInt(currentBooking.simulatorsCount) || 0);
    }
    
    const maxAvailable = settings.maxSimulators - otherBookedSimulators;
    
    count += delta;
    if (count < 1) count = 1;
    if (count > maxAvailable) count = maxAvailable;
    
    simulatorsElement.textContent = count;
    calculateVirtualAmount(); 
}

// Расчет стоимости (Симулятор)
function calculateVirtualAmount() {
    const settings = getSettings().virtual;
    const simulatorsCount = parseInt(document.getElementById('virtualSimulatorsCount').textContent) || 1;
    
    // Используем выбранную длительность сеанса
    const sessionDuration = currentVirtualDuration;
    
    // Выбираем цену в зависимости от дня недели/времени
    const useWeekendPrices = isWeekendPricing(selectedDate, currentVirtualTime);
    const priceData = settings.durationPrices[sessionDuration] || { weekday: 0, weekend: 0 };
    const basePrice = (useWeekendPrices ? priceData.weekend : priceData.weekday) * simulatorsCount;
    
    let discountAmount = parseInt(document.getElementById('virtualManualDiscount').value) || 0;
    
    const totalAmount = basePrice - discountAmount;
    
    document.getElementById('virtualBaseAmount').textContent = Math.round(basePrice);
    document.getElementById('virtualDiscountAmount').textContent = Math.round(discountAmount);
    document.getElementById('virtualTotalAmount').textContent = Math.round(totalAmount);
    
    if (!currentBooking) {
        document.getElementById('virtualPaymentAmount').value = Math.round(totalAmount);
    }
}