// Логика модуля Лаундж зоны

function generateLoungeCalendar() {
    const calendar = document.getElementById('loungeCalendar');
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
    
    const bookings = getBookings('lounge');
    const todayStr = today.toISOString().split('T')[0];
    const settings = getSettings().lounge;
    
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

function loadLoungeSchedule() {
    const settings = getSettings().lounge;
    const date = selectedDate;
    const bookings = getBookings('lounge');
    
    const timeSlotsContainer = document.getElementById('loungeTimeSlots');
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
        const slotBookings = bookings.filter(b => b.date === date && b.time === timeString);
        const bookedCount = slotBookings.length;
        const capacity = 1; // Всегда 1 лаундж зона
        const isFull = bookedCount >= capacity;
        const hasBookings = bookedCount > 0;
        
        // Проверяем, не заблокирован ли слот бронированием зала
        const isBlockedByParty = isTimeSlotBlockedByParty(date, timeString, settings.sessionDuration);
        
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
        let slotText = `${timeString}<div style="font-size:12px; margin-top:6px;">${bookedCount}/${capacity}</div>`;
        if (isBlockedByParty) {
            slotText = `${timeString}<div style="font-size:12px; margin-top:6px;">ЗАНЯТО ЗАЛОМ</div>`;
        }
        slot.innerHTML = slotText;
        
        if (!isBlockedByParty) {
            slot.onclick = () => handleSlotClick(date, timeString, slotBookings, capacity, 'lounge');
        } else {
            slot.onclick = () => {
                alert('Это время заблокировано бронированием зала. Выберите другое время.');
            };
        }
        
        timeSlotsContainer.appendChild(slot);
        
        currentTime.setMinutes(currentTime.getMinutes() + settings.sessionDuration);
    }
}

// Выбор длительности лаундж зоны
function selectLoungeDuration(duration) {
    currentLoungeDuration = duration;
    
    // Обновляем визуальное выделение
    document.querySelectorAll('#loungeBookingForm .duration-option').forEach(option => {
        option.classList.remove('selected');
    });
    document.querySelector(`#loungeBookingForm .duration-option[data-duration="${duration}"]`).classList.add('selected');
    
    calculateLoungeAmount();
}

// Изменение количества человек для лаундж зоны
function changeLoungePeopleCount(delta) {
    const peopleElement = document.getElementById('loungePeopleCount');
    let count = parseInt(peopleElement.textContent);
    
    count += delta;
    if (count < 1) count = 1;
    
    peopleElement.textContent = count;
    calculateLoungeAmount(); 
}

// Расчет стоимости (Лаундж зона)
function calculateLoungeAmount() {
    const settings = getSettings().lounge;
    const peopleCount = parseInt(document.getElementById('loungePeopleCount').textContent) || 1;
    
    // Выбираем цену в зависимости от длительности и дня недели/времени
    const useWeekendPrices = isWeekendPricing(selectedDate, currentLoungeTime);
    let pricePerPerson;
    
    if (currentLoungeDuration === 60) {
        pricePerPerson = useWeekendPrices ? settings.price1HourWeekend : settings.price1Hour;
    } else {
        pricePerPerson = useWeekendPrices ? settings.price2HoursWeekend : settings.price2Hours;
    }
    
    const basePrice = pricePerPerson * peopleCount;
    
    let discountAmount = parseInt(document.getElementById('loungeManualDiscount').value) || 0;
    
    const totalAmount = basePrice - discountAmount;
    
    document.getElementById('loungeBaseAmount').textContent = Math.round(basePrice);
    document.getElementById('loungeDiscountAmount').textContent = Math.round(discountAmount);
    document.getElementById('loungeTotalAmount').textContent = Math.round(totalAmount);
    
    if (!currentBooking) {
        document.getElementById('loungePaymentAmount').value = Math.round(totalAmount);
    }
}