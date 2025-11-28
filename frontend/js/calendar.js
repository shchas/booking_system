// Общая логика календаря

let currentCalendarDate = new Date();
let selectedDate = new Date().toISOString().split('T')[0];
let currentWeekendCalendarDate = new Date(); // Для календаря выходных

function changeMonth(direction) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + direction);
    if (currentModule === 'karting') generateCalendar();
    else if (currentModule === 'party') generatePartyCalendar();
    else if (currentModule === 'lounge') generateLoungeCalendar();
    else if (currentModule === 'virtual') generateVirtualCalendar();
}

function selectDate(dateStr) {
    selectedDate = dateStr;
    if (currentModule === 'karting') {
        loadSchedule();
        generateCalendar();
    } else if (currentModule === 'party') {
        loadPartySchedule();
        generatePartyCalendar();
    } else if (currentModule === 'lounge') {
        loadLoungeSchedule();
        generateLoungeCalendar();
    } else if (currentModule === 'virtual') {
        loadVirtualSchedule();
        generateVirtualCalendar();
    }
}

// Трудовой календарь (выходные дни)
function generateWeekendCalendar() {
    const calendar = document.getElementById('weekendCalendar');
    if (!calendar) return;
    
    const currentMonth = currentWeekendCalendarDate.getMonth();
    const currentYear = currentWeekendCalendarDate.getFullYear();
    
    const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    const header = document.createElement('div');
    header.className = 'calendar-header';
    header.innerHTML = `
        <button class="calendar-nav-btn" onclick="changeWeekendMonth(-1)">‹</button>
        <div class="calendar-title">${monthNames[currentMonth]} ${currentYear}</div>
        <button class="calendar-nav-btn" onclick="changeWeekendMonth(1)">›</button>
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
    
    const weekendCalendar = getSettings().weekendCalendar || {};
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        dayElement.className = 'weekend-day';
        dayElement.textContent = day;
        
        // Проверяем, является ли день выходным
        if (weekendCalendar[dateStr]) {
            dayElement.classList.add('weekend');
        } else {
            dayElement.classList.add('weekday');
        }
        
        dayElement.onclick = () => toggleWeekendDay(dateStr, dayElement);
        daysGrid.appendChild(dayElement);
    }
    
    calendar.appendChild(daysGrid);
}

function changeWeekendMonth(direction) {
    currentWeekendCalendarDate.setMonth(currentWeekendCalendarDate.getMonth() + direction);
    generateWeekendCalendar();
}

function toggleWeekendDay(dateStr, element) {
    const settings = getSettings();
    if (!settings.weekendCalendar) {
        settings.weekendCalendar = {};
    }
    
    if (settings.weekendCalendar[dateStr]) {
        delete settings.weekendCalendar[dateStr];
        element.classList.remove('weekend');
        element.classList.add('weekday');
    } else {
        settings.weekendCalendar[dateStr] = true;
        element.classList.remove('weekday');
        element.classList.add('weekend');
    }
    
    saveSettings(settings);
}

function clearWeekendCalendar() {
    const settings = getSettings();
    settings.weekendCalendar = {};
    saveSettings(settings);
    generateWeekendCalendar();
}

function markWeekends() {
    const settings = getSettings();
    if (!settings.weekendCalendar) {
        settings.weekendCalendar = {};
    }
    
    const currentMonth = currentWeekendCalendarDate.getMonth();
    const currentYear = currentWeekendCalendarDate.getFullYear();
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth, day);
        // Суббота (6) и воскресенье (0) - выходные
        if (date.getDay() === 0 || date.getDay() === 6) {
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            settings.weekendCalendar[dateStr] = true;
        }
    }
    
    saveSettings(settings);
    generateWeekendCalendar();
}