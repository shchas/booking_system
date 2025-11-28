// Логика модуля Картинга

function generateCalendar() {
    const calendar = document.getElementById('calendar');
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
    
    const bookings = getBookings('karting');
    const todayStr = today.toISOString().split('T')[0];
    const settings = getSettings().karting;
    
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
            const totalCapacity = totalSlots * settings.maxKartsPerSlot;
            const dayKarts = dayBookings.reduce((sum, b) => sum + (parseInt(b.kartsCount) || 1), 0);
            
            if (dayKarts >= totalCapacity) {
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

function loadSchedule() {
    const settings = getSettings().karting;
    const date = selectedDate;
    const bookings = getBookings('karting');
    
    const timeSlotsContainer = document.getElementById('timeSlots');
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
        const bookedKarts = slotBookings.reduce((sum, booking) => sum + (parseInt(booking.kartsCount) || 1), 0);
        const capacity = settings.maxKartsPerSlot;
        const isFull = bookedKarts >= capacity;
        const hasBookings = bookedKarts > 0;
        
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
        let slotText = `${timeString}<div style="font-size:12px; margin-top:6px;">${bookedKarts}/${capacity}</div>`;
        if (isBlockedByParty) {
            slotText = `${timeString}<div style="font-size:12px; margin-top:6px;">ЗАНЯТО ЗАЛОМ</div>`;
        }
        slot.innerHTML = slotText;
        
        if (!isBlockedByParty) {
            slot.onclick = () => handleSlotClick(date, timeString, slotBookings, capacity, 'karting');
        } else {
            slot.onclick = () => {
                alert('Это время заблокировано бронированием зала. Выберите другое время.');
            };
        }
        
        timeSlotsContainer.appendChild(slot);
        
        currentTime.setMinutes(currentTime.getMinutes() + settings.sessionDuration);
    }
}

// Выбор режима картинга
function selectKartingMode(mode) {
    currentKartingMode = mode;
    
    // Обновляем визуальное выделение
    document.querySelectorAll('#bookingForm .mode-option').forEach(option => {
        option.classList.remove('selected');
    });
    document.querySelector(`#bookingForm .mode-option[data-mode="${mode}"]`).classList.add('selected');
    
    calculateAmount();
}

// Изменение количества картингов
function changeKartCount(delta) {
    const kartsElement = document.getElementById('kartsCount');
    let count = parseInt(kartsElement.textContent);
    const settings = getSettings().karting;
    
    let otherBookedKarts = currentBookedCount;
    if (currentBooking) {
        otherBookedKarts = currentBookedCount - (parseInt(currentBooking.kartsCount) || 0);
    }
    
    const maxAvailable = settings.maxKartsPerSlot - otherBookedKarts;
    
    count += delta;
    if (count < 1) count = 1;
    if (count > maxAvailable) count = maxAvailable;
    
    kartsElement.textContent = count;
    calculateAmount(); 
}

// Расчет стоимости (Картинг)
function calculateAmount() {
    const settings = getSettings().karting;
    const kartsCount = parseInt(document.getElementById('kartsCount').textContent) || 1;
    
    // Выбираем цену в зависимости от режима и дня недели/времени
    const useWeekendPrices = isWeekendPricing(selectedDate, currentKartingTime);
    let pricePerSession;
    
    if (currentKartingMode === 'race') {
        pricePerSession = useWeekendPrices ? settings.priceRaceWeekend : settings.priceRace;
    } else {
        pricePerSession = useWeekendPrices ? settings.priceRegularWeekend : settings.priceRegular;
    }
    
    const basePrice = pricePerSession * kartsCount;
    
    let discountAmount = parseInt(document.getElementById('manualDiscount').value) || 0;
    
    const totalAmount = basePrice - discountAmount;
    
    document.getElementById('baseAmount').textContent = Math.round(basePrice);
    document.getElementById('discountAmount').textContent = Math.round(discountAmount);
    document.getElementById('totalAmount').textContent = Math.round(totalAmount);
    
    if (!currentBooking) {
        document.getElementById('paymentAmount').value = Math.round(totalAmount);
    }
}