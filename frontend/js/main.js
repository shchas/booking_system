// Главный файл, объединяющий всю логику

let currentModule = 'karting'; // 'karting', 'party', 'lounge', 'virtual'
let currentBooking = null;
let currentBookedCount = 0;
let currentKartingMode = 'regular'; // 'regular', 'race'
let currentVirtualDuration = 15; // 15, 30, 45, 60, 75, 90 минут
let currentPartyDuration = 60; // 60, 120 минут
let currentLoungeDuration = 60; // 60, 120 минут
let currentPartyPeopleCount = 1;
let currentLoungePeopleCount = 1;
let currentKartingTime = '';
let currentPartyTime = '';
let currentLoungeTime = '';
let currentVirtualTime = '';

// Инициализация при загрузке
window.onload = function() {
    initDatabase();
    
    // Настройка обработчиков событий
    setupEventListeners();
    
    // Инициализация интерфейса
    if (getSettings().adminPassword === "admin") {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('mainInterface').style.display = 'block';
        showModule(currentModule);
        loadAllSettingsToForm();
        generateWeekendCalendar();
    }
};

function setupEventListeners() {
    // Обработка нажатия Enter при вводе пароля
    document.getElementById('passwordInput').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            login();
        }
    });
    
    // Обработка форм бронирования
    document.getElementById('bookingForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveBooking('karting');
    });
    
    document.getElementById('partyBookingForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveBooking('party');
    });
    
    document.getElementById('loungeBookingForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveBooking('lounge');
    });
    
    document.getElementById('virtualBookingForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveBooking('virtual');
    });
    
    // Обработка формы редактирования клиента
    document.getElementById('editClientForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveClientChanges();
    });
    
    // Обработка импорта базы данных
    document.getElementById('importFile').addEventListener('change', function(event) {
        importDatabase(event);
    });
    
    // Обработка автодополнения для клиентов
    document.getElementById('clientName').addEventListener('input', function(event) {
        suggestClients(event, 'karting');
    });
    document.getElementById('clientPhone').addEventListener('input', function(event) {
        suggestClients(event, 'karting');
    });
    
    document.getElementById('partyClientName').addEventListener('input', function(event) {
        suggestClients(event, 'party');
    });
    document.getElementById('partyClientPhone').addEventListener('input', function(event) {
        suggestClients(event, 'party');
    });
    
    document.getElementById('loungeClientName').addEventListener('input', function(event) {
        suggestClients(event, 'lounge');
    });
    document.getElementById('loungeClientPhone').addEventListener('input', function(event) {
        suggestClients(event, 'lounge');
    });
    
    document.getElementById('virtualClientName').addEventListener('input', function(event) {
        suggestClients(event, 'virtual');
    });
    document.getElementById('virtualClientPhone').addEventListener('input', function(event) {
        suggestClients(event, 'virtual');
    });
    
    // Обработка кнопок в модальных окнах
    setupModalButtons();
}

function setupModalButtons() {
    // Кнопки выбора режима картинга
    document.querySelectorAll('#bookingForm .mode-option').forEach(option => {
        option.addEventListener('click', function() {
            selectKartingMode(this.getAttribute('data-mode'));
        });
    });
    
    // Кнопки изменения количества картингов
    document.querySelectorAll('#bookingForm .kart-count button').forEach((button, index) => {
        button.addEventListener('click', function() {
            changeKartCount(index === 0 ? -1 : 1);
        });
    });
    
    // Кнопки выбора длительности для зала
    document.querySelectorAll('#partyBookingForm .duration-option').forEach(option => {
        option.addEventListener('click', function() {
            selectPartyDuration(parseInt(this.getAttribute('data-duration')));
        });
    });
    
    // Кнопки изменения количества человек для зала
    document.querySelectorAll('#partyBookingForm .people-count button').forEach((button, index) => {
        button.addEventListener('click', function() {
            changePartyPeopleCount(index === 0 ? -1 : 1);
        });
    });
    
    // Кнопки выбора длительности для лаундж зоны
    document.querySelectorAll('#loungeBookingForm .duration-option').forEach(option => {
        option.addEventListener('click', function() {
            selectLoungeDuration(parseInt(this.getAttribute('data-duration')));
        });
    });
    
    // Кнопки изменения количества человек для лаундж зоны
    document.querySelectorAll('#loungeBookingForm .people-count button').forEach((button, index) => {
        button.addEventListener('click', function() {
            changeLoungePeopleCount(index === 0 ? -1 : 1);
        });
    });
    
    // Кнопки выбора длительности для симулятора
    document.querySelectorAll('#virtualBookingForm .duration-option').forEach(option => {
        option.addEventListener('click', function() {
            selectVirtualDuration(parseInt(this.getAttribute('data-duration')));
        });
    });
    
    // Кнопки изменения количества симуляторов
    document.querySelectorAll('#virtualBookingForm .kart-count button').forEach((button, index) => {
        button.addEventListener('click', function() {
            changeVirtualSimulatorCount(index === 0 ? -1 : 1);
        });
    });
    
    // Обработчики для модальных окон
    document.querySelectorAll('.modal .btn-secondary').forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            closeModal(modal.id);
        });
    });
    
    // Обработчик для закрытия модального окна пароля
    document.querySelector('#passwordModal .close').addEventListener('click', function() {
        closePasswordModal();
    });
    
    // Обработчик для смены пароля
    document.querySelector('#passwordModal .btn-primary').addEventListener('click', function() {
        changePassword();
    });
    
    // Обработчик для отмены смены пароля
    document.querySelector('#passwordModal .btn-secondary').addEventListener('click', function() {
        closePasswordModal();
    });
    
    // Обработчики для модального окна просмотра бронирования
    document.querySelector('#viewBookingModal .btn-primary').addEventListener('click', function() {
        editBooking();
    });
    
    document.querySelector('#viewBookingModal .btn[style*="e74c3c"]').addEventListener('click', function() {
        deleteBooking();
    });
    
    // Обработчик для добавления брони в занятый слот
    document.getElementById('addBookingToSlotBtn').addEventListener('click', function() {
        const time = document.getElementById('slotModalTime').textContent.split(' ')[1];
        const type = document.getElementById('slotModalType').textContent;
        const moduleType = getModuleTypeFromName(type);
        
        closeModal('slotBookingsModal');
        openBookingModal(selectedDate, time, null, currentBookedCount, moduleType);
    });
}

function getModuleTypeFromName(name) {
    const types = {
        'Картинг': 'karting',
        'Аренда зала': 'party',
        'Лаундж зона': 'lounge',
        'Симулятор': 'virtual'
    };
    return types[name] || 'karting';
}

// --- Логика переключения модулей ---
function showModule(moduleName) {
    currentModule = moduleName;
    
    const headers = {
        karting: 'Расписание проката картинга',
        party: 'Аренда зала',
        lounge: 'Лаундж зона',
        virtual: 'Бронирование симулятора'
    };
    document.getElementById('mainHeader').textContent = headers[moduleName];
    
    document.querySelectorAll('.view-container').forEach(view => view.classList.remove('active'));
    document.getElementById(moduleName + 'View').classList.add('active');
    
    document.querySelectorAll('.module-nav button').forEach(btn => btn.classList.remove('active'));
    document.getElementById('nav' + moduleName.charAt(0).toUpperCase() + moduleName.slice(1)).classList.add('active');
    
    if (moduleName === 'karting') {
        loadSchedule();
        generateCalendar();
    } else if (moduleName === 'party') {
        loadPartySchedule();
        generatePartyCalendar();
    } else if (moduleName === 'lounge') {
        loadLoungeSchedule();
        generateLoungeCalendar();
    } else if (moduleName === 'virtual') {
        loadVirtualSchedule();
        generateVirtualCalendar();
    }
    
    updateStats(currentModule);
    const moduleNames = { karting: 'картинга', party: 'зала', lounge: 'лаундж зоны', virtual: 'симуляторов' };
    document.getElementById('statsModuleType').textContent = moduleNames[currentModule];
}

function openTab(event, tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.getElementById(tabName).classList.add('active');
    event.currentTarget.classList.add('active');
    
    if (tabName === 'stats') {
        updateStats(currentModule);
    }
    if (tabName === 'clients') {
        filterClients();
    }
    if (tabName === 'settings') {
        generateWeekendCalendar();
    }
}

// --- Управление настройками ---
function loadAllSettingsToForm() {
    const settings = getSettings();
    
    // Вечерний режим
    document.getElementById('eveningWeekendPricingEnabled').checked = settings.eveningWeekendPricing ? settings.eveningWeekendPricing.enabled : false;
    document.getElementById('eveningWeekendPricingTime').value = settings.eveningWeekendPricing ? settings.eveningWeekendPricing.time : '18:00';
    
    // Karting
    document.getElementById('kartingOpenTime').value = settings.karting.openTime;
    document.getElementById('kartingCloseTime').value = settings.karting.closeTime;
    document.getElementById('kartingSessionDuration').value = settings.karting.sessionDuration;
    document.getElementById('kartingPriceRegular').value = settings.karting.priceRegular;
    document.getElementById('kartingPriceRace').value = settings.karting.priceRace;
    document.getElementById('kartingPriceRegularWeekend').value = settings.karting.priceRegularWeekend;
    document.getElementById('kartingPriceRaceWeekend').value = settings.karting.priceRaceWeekend;
    document.getElementById('kartingMaxKartsPerSlot').value = settings.karting.maxKartsPerSlot;
    
    // Party (Аренда зала)
    document.getElementById('partyOpenTime').value = settings.party.openTime;
    document.getElementById('partyCloseTime').value = settings.party.closeTime;
    document.getElementById('partySessionDuration').value = settings.party.sessionDuration;
    document.getElementById('partyPrice1Hour').value = settings.party.price1Hour;
    document.getElementById('partyPrice2Hours').value = settings.party.price2Hours;
    document.getElementById('partyPrice1HourWeekend').value = settings.party.price1HourWeekend;
    document.getElementById('partyPrice2HoursWeekend').value = settings.party.price2HoursWeekend;
    
    // Lounge (Лаундж зона)
    document.getElementById('loungeOpenTime').value = settings.lounge.openTime;
    document.getElementById('loungeCloseTime').value = settings.lounge.closeTime;
    document.getElementById('loungeSessionDuration').value = settings.lounge.sessionDuration;
    document.getElementById('loungePrice1Hour').value = settings.lounge.price1Hour;
    document.getElementById('loungePrice2Hours').value = settings.lounge.price2Hours;
    document.getElementById('loungePrice1HourWeekend').value = settings.lounge.price1HourWeekend;
    document.getElementById('loungePrice2HoursWeekend').value = settings.lounge.price2HoursWeekend;
    
    // Virtual
    document.getElementById('virtualOpenTime').value = settings.virtual.openTime;
    document.getElementById('virtualCloseTime').value = settings.virtual.closeTime;
    document.getElementById('virtualBaseDuration').value = settings.virtual.baseDuration;
    document.getElementById('virtualMaxSimulators').value = settings.virtual.maxSimulators;
    
    // Загрузка цен по длительностям для симулятора
    const durationPrices = settings.virtual.durationPrices || {};
    const container = document.getElementById('virtualDurationPrices');
    container.innerHTML = '';
    
    const durations = [15, 30, 45, 60, 75, 90];
    durations.forEach(duration => {
        const priceItem = document.createElement('div');
        priceItem.className = 'duration-price-item';
        
        const priceData = durationPrices[duration] || { weekday: 0, weekend: 0 };
        
        priceItem.innerHTML = `
            <label>${duration} минут:</label>
            <div class="price-comparison">
                <div class="weekday-price">
                    <input type="number" id="virtualPrice${duration}" value="${priceData.weekday}" placeholder="Будни">
                </div>
                <div class="weekend-price">
                    <input type="number" id="virtualPrice${duration}Weekend" value="${priceData.weekend}" placeholder="Выходные">
                </div>
            </div>
        `;
        container.appendChild(priceItem);
    });
}

function saveAllSettings() {
    const settings = getSettings();
    
    try {
        // Вечерний режим
        settings.eveningWeekendPricing = {
            enabled: document.getElementById('eveningWeekendPricingEnabled').checked,
            time: document.getElementById('eveningWeekendPricingTime').value
        };
        
        // Karting
        settings.karting = {
            openTime: document.getElementById('kartingOpenTime').value,
            closeTime: document.getElementById('kartingCloseTime').value,
            sessionDuration: parseInt(document.getElementById('kartingSessionDuration').value),
            priceRegular: parseInt(document.getElementById('kartingPriceRegular').value),
            priceRace: parseInt(document.getElementById('kartingPriceRace').value),
            priceRegularWeekend: parseInt(document.getElementById('kartingPriceRegularWeekend').value),
            priceRaceWeekend: parseInt(document.getElementById('kartingPriceRaceWeekend').value),
            maxKartsPerSlot: parseInt(document.getElementById('kartingMaxKartsPerSlot').value)
        };
        
        // Party (Аренда зала)
        settings.party = {
            openTime: document.getElementById('partyOpenTime').value,
            closeTime: document.getElementById('partyCloseTime').value,
            sessionDuration: parseInt(document.getElementById('partySessionDuration').value),
            price1Hour: parseInt(document.getElementById('partyPrice1Hour').value),
            price2Hours: parseInt(document.getElementById('partyPrice2Hours').value),
            price1HourWeekend: parseInt(document.getElementById('partyPrice1HourWeekend').value),
            price2HoursWeekend: parseInt(document.getElementById('partyPrice2HoursWeekend').value)
        };
        
        // Lounge (Лаундж зона)
        settings.lounge = {
            openTime: document.getElementById('loungeOpenTime').value,
            closeTime: document.getElementById('loungeCloseTime').value,
            sessionDuration: parseInt(document.getElementById('loungeSessionDuration').value),
            price1Hour: parseInt(document.getElementById('loungePrice1Hour').value),
            price2Hours: parseInt(document.getElementById('loungePrice2Hours').value),
            price1HourWeekend: parseInt(document.getElementById('loungePrice1HourWeekend').value),
            price2HoursWeekend: parseInt(document.getElementById('loungePrice2HoursWeekend').value)
        };
        
        // Virtual
        settings.virtual = {
            openTime: document.getElementById('virtualOpenTime').value,
            closeTime: document.getElementById('virtualCloseTime').value,
            baseDuration: parseInt(document.getElementById('virtualBaseDuration').value),
            maxSimulators: parseInt(document.getElementById('virtualMaxSimulators').value),
            durationPrices: {}
        };
        
        // Сохранение цен по длительностям для симулятора
        const durations = [15, 30, 45, 60, 75, 90];
        durations.forEach(duration => {
            settings.virtual.durationPrices[duration] = {
                weekday: parseInt(document.getElementById(`virtualPrice${duration}`).value) || 0,
                weekend: parseInt(document.getElementById(`virtualPrice${duration}Weekend`).value) || 0
            };
        });
        
        saveSettings(settings);
        alert('Настройки сохранены!');
        showModule(currentModule);
        
    } catch (error) {
        alert('Ошибка сохранения настроек! Проверьте правильность введенных данных.\n' + error.message);
    }
}

// --- Статистика ---
function updateStats(moduleType) {
    const clients = getClients();
    document.getElementById('totalClients').textContent = clients.length;
    
    const bookings = getBookings(moduleType);
    const today = new Date().toISOString().split('T')[0];
    
    const todayBookings = bookings.filter(b => b.date === today);
    const todayRevenue = todayBookings.reduce((sum, b) => sum + (parseInt(b.paymentAmount) || 0), 0);
    
    document.getElementById('todayBookings').textContent = todayBookings.length;
    document.getElementById('todayRevenue').textContent = todayRevenue + ' ₽';
    
    let occupancyRate = 0;
    const settings = getSettings();
    
    if (moduleType === 'karting') {
        const kartingSettings = settings.karting;
        const totalSlots = calculateTotalSlots(kartingSettings);
        const totalCapacity = totalSlots * kartingSettings.maxKartsPerSlot;
        const todayKarts = todayBookings.reduce((sum, b) => sum + (parseInt(b.kartsCount) || 1), 0);
        occupancyRate = totalCapacity > 0 ? Math.round((todayKarts / totalCapacity) * 100) : 0;
    } else if (moduleType === 'party') {
        const partySettings = settings.party;
        const totalSlots = calculateTotalSlots(partySettings);
        const todayBookingsCount = todayBookings.length;
        occupancyRate = totalSlots > 0 ? Math.round((todayBookingsCount / totalSlots) * 100) : 0;
    } else if (moduleType === 'lounge') {
        const loungeSettings = settings.lounge;
        const totalSlots = calculateTotalSlots(loungeSettings);
        const todayBookingsCount = todayBookings.length;
        occupancyRate = totalSlots > 0 ? Math.round((todayBookingsCount / totalSlots) * 100) : 0;
    } else if (moduleType === 'virtual') {
        const virtualSettings = settings.virtual;
        const totalSlots = calculateTotalSlots(virtualSettings);
        const totalCapacity = totalSlots * virtualSettings.maxSimulators;
        const todaySimulators = todayBookings.reduce((sum, b) => sum + (parseInt(b.simulatorsCount) || 1), 0);
        occupancyRate = totalCapacity > 0 ? Math.round((todaySimulators / totalCapacity) * 100) : 0;
    }
    
    document.getElementById('occupancyRate').textContent = occupancyRate + '%';
    
    const recentBookingsContainer = document.getElementById('recentBookings');
    recentBookingsContainer.innerHTML = '';
    
    const sortedBookings = [...bookings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const recentBookings = sortedBookings.slice(0, 5);
    
    if (recentBookings.length === 0) {
         recentBookingsContainer.innerHTML = '<div class="booking-item">Нет бронирований для этого модуля.</div>';
         return;
    }
    
    recentBookings.forEach(booking => {
        const item = document.createElement('div');
        item.className = 'booking-item';
        
        let countText = '';
        if (moduleType === 'karting') countText = `${booking.kartsCount || 1} карт.`;
        else if (moduleType === 'party') countText = `${booking.peopleCount || 1} чел.`;
        else if (moduleType === 'lounge') countText = `${booking.peopleCount || 1} чел.`;
        else if (moduleType === 'virtual') countText = `${booking.simulatorsCount || 1} сим.`;
        
        item.innerHTML = `
            <div>
                <strong>${booking.date} ${booking.time || ''}</strong>
                <div>${booking.clientName} (${countText})</div>
            </div>
            <div>${booking.paymentAmount || 0} ₽</div>
        `;
        recentBookingsContainer.appendChild(item);
    });
}

// --- Импорт/Экспорт ---
function exportDatabase() {
    const data = getDatabase();
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `modular_system_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}

function importDatabase(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (confirm('Вы уверены, что хотите импортировать базу данных? Текущие данные будут заменены.')) {
                if (data.bookings && data.clients && data.settings) {
                    saveDatabase(data);
                    alert('База данных успешно импортирована!');
                    loadAllSettingsToForm();
                    showModule(currentModule);
                } else {
                    alert('Ошибка: Файл импорта имеет неверную структуру.');
                }
            }
        } catch (error) {
            alert('Ошибка при импорте базы данных: ' + error.message);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// --- Общие функции для работы с UI ---
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function handleSlotClick(date, time, slotBookings, capacity, type) {
    let bookedCount = 0;
    let unitName = '';
    let modalId = '';
    
    if (type === 'karting') {
        bookedCount = slotBookings.reduce((sum, booking) => sum + (parseInt(booking.kartsCount) || 1), 0);
        unitName = 'картингов';
        modalId = 'bookingModal';
        currentKartingTime = time;
    } else if (type === 'party') {
        bookedCount = slotBookings.length;
        unitName = 'броней';
        modalId = 'partyBookingModal';
        currentPartyTime = time;
    } else if (type === 'lounge') {
        bookedCount = slotBookings.length;
        unitName = 'броней';
        modalId = 'loungeBookingModal';
        currentLoungeTime = time;
    } else if (type === 'virtual') {
        bookedCount = slotBookings.reduce((sum, booking) => sum + (parseInt(booking.simulatorsCount) || 1), 0);
        unitName = 'симуляторов';
        modalId = 'virtualBookingModal';
        currentVirtualTime = time;
    }
    
    if (bookedCount === 0) {
        openBookingModal(date, time, null, 0, type);
        return;
    }
    
    const listContainer = document.getElementById('slotBookingsList');
    document.getElementById('slotModalTime').textContent = `${date} ${time}`;
    document.getElementById('slotModalType').textContent = getModuleName(type);
    listContainer.innerHTML = '';
    
    slotBookings.forEach(booking => {
        const div = document.createElement('div');
        div.className = 'booking-item';
        
        let countText = '';
        if (type === 'karting') countText = `${booking.kartsCount || 1} карт.`;
        else if (type === 'party') countText = `${booking.peopleCount || 1} чел.`;
        else if (type === 'lounge') countText = `${booking.peopleCount || 1} чел.`;
        else if (type === 'virtual') countText = `${booking.simulatorsCount || 1} сим.`;
        
        div.innerHTML = `
            <div>
                <strong>${booking.clientName}</strong>
                <div>${booking.phone || ''} (${countText})</div>
                <div>${booking.time} - ${getEndTime(booking.time, booking.duration || getSettings()[type].sessionDuration)}</div>
            </div>
            <button class="btn btn-primary">Открыть</button>
        `;
        div.querySelector('button').addEventListener('click', () => {
            closeModal('slotBookingsModal');
            openBookingModal(date, time, booking, bookedCount, type);
        });
        listContainer.appendChild(div);
    });
    
    const addBtn = document.getElementById('addBookingToSlotBtn');
    if (bookedCount >= capacity) {
        addBtn.style.display = 'none';
    } else {
        addBtn.style.display = 'inline-block';
        addBtn.onclick = () => {
            closeModal('slotBookingsModal');
            openBookingModal(date, time, null, bookedCount, type);
        };
    }
    
    document.getElementById('slotBookingsModal').style.display = 'flex';
}

function openBookingModal(date, time, booking = null, bookedCount = 0, type = 'karting') {
    currentBooking = booking;
    currentBookedCount = bookedCount;
    
    let modalId = '';
    let timeElementId = '';
    
    if (type === 'karting') {
        modalId = 'bookingModal';
        timeElementId = 'selectedTime';
        currentKartingTime = time;
    } else if (type === 'party') {
        modalId = 'partyBookingModal';
        timeElementId = 'partySelectedTime';
        currentPartyTime = time;
    } else if (type === 'lounge') {
        modalId = 'loungeBookingModal';
        timeElementId = 'loungeSelectedTime';
        currentLoungeTime = time;
    } else if (type === 'virtual') {
        modalId = 'virtualBookingModal';
        timeElementId = 'virtualSelectedTime';
        currentVirtualTime = time;
    }
    
    document.getElementById(timeElementId).textContent = `${date} ${time}`;
    
    if (booking) {
        document.getElementById(modalId).style.display = 'none';
        showBookingDetails(booking, type);
    } else {
        if (type === 'karting') {
            document.getElementById('bookingForm').reset();
            document.getElementById('kartsCount').textContent = '1';
            document.getElementById('manualDiscount').value = '0';
            document.getElementById('clientAdminComment').value = '';
            
            // Сброс режима картинга
            selectKartingMode('regular');
            
            calculateAmount();
        } else if (type === 'party') {
            document.getElementById('partyBookingForm').reset();
            document.getElementById('partyPeopleCount').textContent = '1';
            document.getElementById('partyManualDiscount').value = '0';
            document.getElementById('partyClientAdminComment').value = '';
            
            // Сброс длительности
            selectPartyDuration(60);
            
            calculatePartyAmount();
        } else if (type === 'lounge') {
            document.getElementById('loungeBookingForm').reset();
            document.getElementById('loungePeopleCount').textContent = '1';
            document.getElementById('loungeManualDiscount').value = '0';
            document.getElementById('loungeClientAdminComment').value = '';
            
            // Сброс длительности
            selectLoungeDuration(60);
            
            calculateLoungeAmount();
        } else if (type === 'virtual') {
            document.getElementById('virtualBookingForm').reset();
            document.getElementById('virtualSimulatorsCount').textContent = '1';
            document.getElementById('virtualManualDiscount').value = '0';
            document.getElementById('virtualClientAdminComment').value = '';
            
            // Сброс длительности симулятора
            selectVirtualDuration(15);
            
            calculateVirtualAmount();
        }
        document.getElementById(modalId).style.display = 'flex';
    }
}

function showBookingDetails(booking, type) {
    const details = document.getElementById('bookingDetails');
    document.getElementById('viewBookingType').textContent = getModuleName(type);
    
    let countText = '';
    if (type === 'karting') countText = `Количество картингов: ${booking.kartsCount || 1}`;
    else if (type === 'party') countText = `Количество человек: ${booking.peopleCount || 1}`;
    else if (type === 'lounge') countText = `Количество человек: ${booking.peopleCount || 1}`;
    else if (type === 'virtual') countText = `Количество симуляторов: ${booking.simulatorsCount || 1}`;
    
    let modeText = '';
    if (type === 'karting' && booking.mode) {
        modeText = `<p><strong>Режим:</strong> ${booking.mode === 'race' ? 'Race' : 'Обычный'}</p>`;
    }
    
    let durationText = '';
    if ((type === 'party' || type === 'lounge' || type === 'virtual') && booking.duration) {
        durationText = `<p><strong>Длительность:</strong> ${booking.duration} минут</p>`;
    }
    
    details.innerHTML = `
        <p><strong>Время:</strong> ${booking.date} ${booking.time}</p>
        <p><strong>Клиент:</strong> ${booking.clientName}</p>
        <p><strong>Телефон:</strong> ${booking.phone || 'не указан'}</p>
        <p><strong>Дата рождения:</strong> ${booking.birthdate || 'не указана'}</p>
        ${modeText}
        ${durationText}
        <p><strong>${countText}</strong></p>
        <p><strong>Скидка:</strong> ${booking.discount || 0} ₽</p>
        <p><strong>Сумма:</strong> ${booking.paymentAmount} ₽</p>
        <p><strong>Статус:</strong> ${getChecklistStatus(booking, type)}</p>
    `;
    document.getElementById('viewBookingModal').style.display = 'flex';
}

function getChecklistStatus(booking, type) {
    const checks = [];
    if (booking.checkPayment) checks.push('Оплата');
    
    return checks.length > 0 ? checks.join(', ') : 'Не начат';
}

function editBooking() {
    closeModal('viewBookingModal');
    
    if (currentBooking.type === 'karting') {
        document.getElementById('bookingModal').style.display = 'flex';
        
        document.getElementById('clientName').value = currentBooking.clientName;
        document.getElementById('clientBirthdate').value = currentBooking.birthdate || '';
        document.getElementById('clientPhone').value = currentBooking.phone || '';
        document.getElementById('kartsCount').textContent = currentBooking.kartsCount || 1;
        document.getElementById('checkPayment').checked = currentBooking.checkPayment;
        document.getElementById('paymentAmount').value = currentBooking.paymentAmount;
        document.getElementById('manualDiscount').value = currentBooking.discount || 0;
        
        // Восстанавливаем режим
        if (currentBooking.mode) {
            selectKartingMode(currentBooking.mode);
        } else {
            selectKartingMode('regular');
        }
        
        const client = getClients().find(c => c.name.toLowerCase() === currentBooking.clientName.toLowerCase());
        document.getElementById('clientAdminComment').value = (client && client.adminComment) ? client.adminComment : '';
        
        calculateAmount();
    } else if (currentBooking.type === 'party') {
        document.getElementById('partyBookingModal').style.display = 'flex';
        
        document.getElementById('partyClientName').value = currentBooking.clientName;
        document.getElementById('partyClientBirthdate').value = currentBooking.birthdate || '';
        document.getElementById('partyClientPhone').value = currentBooking.phone || '';
        document.getElementById('partyPeopleCount').textContent = currentBooking.peopleCount || 1;
        document.getElementById('partyCheckPayment').checked = currentBooking.checkPayment;
        document.getElementById('partyPaymentAmount').value = currentBooking.paymentAmount;
        document.getElementById('partyManualDiscount').value = currentBooking.discount || 0;
        
        // Восстанавливаем длительность
        if (currentBooking.duration) {
            selectPartyDuration(currentBooking.duration);
        } else {
            selectPartyDuration(60);
        }
        
        const client = getClients().find(c => c.name.toLowerCase() === currentBooking.clientName.toLowerCase());
        document.getElementById('partyClientAdminComment').value = (client && client.adminComment) ? client.adminComment : '';
        
        calculatePartyAmount();
    } else if (currentBooking.type === 'lounge') {
        document.getElementById('loungeBookingModal').style.display = 'flex';
        
        document.getElementById('loungeClientName').value = currentBooking.clientName;
        document.getElementById('loungeClientBirthdate').value = currentBooking.birthdate || '';
        document.getElementById('loungeClientPhone').value = currentBooking.phone || '';
        document.getElementById('loungePeopleCount').textContent = currentBooking.peopleCount || 1;
        document.getElementById('loungeCheckPayment').checked = currentBooking.checkPayment;
        document.getElementById('loungePaymentAmount').value = currentBooking.paymentAmount;
        document.getElementById('loungeManualDiscount').value = currentBooking.discount || 0;
        
        // Восстанавливаем длительность
        if (currentBooking.duration) {
            selectLoungeDuration(currentBooking.duration);
        } else {
            selectLoungeDuration(60);
        }
        
        const client = getClients().find(c => c.name.toLowerCase() === currentBooking.clientName.toLowerCase());
        document.getElementById('loungeClientAdminComment').value = (client && client.adminComment) ? client.adminComment : '';
        
        calculateLoungeAmount();
    } else if (currentBooking.type === 'virtual') {
        document.getElementById('virtualBookingModal').style.display = 'flex';
        
        document.getElementById('virtualClientName').value = currentBooking.clientName;
        document.getElementById('virtualClientBirthdate').value = currentBooking.birthdate || '';
        document.getElementById('virtualClientPhone').value = currentBooking.phone || '';
        document.getElementById('virtualSimulatorsCount').textContent = currentBooking.simulatorsCount || 1;
        document.getElementById('virtualCheckPayment').checked = currentBooking.checkPayment;
        document.getElementById('virtualPaymentAmount').value = currentBooking.paymentAmount;
        document.getElementById('virtualManualDiscount').value = currentBooking.discount || 0;
        
        // Восстанавливаем длительность
        if (currentBooking.duration) {
            selectVirtualDuration(currentBooking.duration);
        } else {
            selectVirtualDuration(15);
        }
        
        const client = getClients().find(c => c.name.toLowerCase() === currentBooking.clientName.toLowerCase());
        document.getElementById('virtualClientAdminComment').value = (client && client.adminComment) ? client.adminComment : '';
        
        calculateVirtualAmount();
    }
}

function deleteBooking() {
    if (confirm('Вы уверены, что хотите удалить эту бронь?')) {
        const bookingToDelete = { ...currentBooking };
        
        const bookings = getAllBookings();
        const updatedBookings = bookings.filter(b => b.id !== currentBooking.id);
        saveAllBookings(updatedBookings);
        
        closeModal('viewBookingModal');
        
        // Обновляем расписание в зависимости от типа
        if (currentBooking.type === 'karting') {
            loadSchedule();
            generateCalendar();
        } else if (currentBooking.type === 'party') {
            loadPartySchedule();
            generatePartyCalendar();
            // При удалении брони зала обновляем все модули
            loadSchedule();
            loadLoungeSchedule();
            loadVirtualSchedule();
        } else if (currentBooking.type === 'lounge') {
            loadLoungeSchedule();
            generateLoungeCalendar();
        } else if (currentBooking.type === 'virtual') {
            loadVirtualSchedule();
            generateVirtualCalendar();
        }
        
        updateStats(currentBooking.type);
        
        updateClientBookingCount(bookingToDelete.clientName, bookingToDelete.phone, -1);
    }
}

function updateClientBookingCount(name, phone, delta) {
    const clients = getClients();
    let clientIndex = clients.findIndex(c => 
        (c.phone && phone && c.phone === phone) || 
        c.name.toLowerCase() === name.toLowerCase()
    );

    if (clientIndex !== -1) {
        clients[clientIndex].totalBookings = Math.max(0, (clients[clientIndex].totalBookings || 0) + delta);
        
        if (delta < 0) {
            if (clients[clientIndex].totalBookings === 0) {
                clients[clientIndex].lastBooking = null;
                clients[clientIndex].firstBooking = null;
            } else {
                const clientBookings = getAllBookings().filter(b => b.clientName === clients[clientIndex].name || (b.phone && b.phone === clients[clientIndex].phone))
                                                      .sort((a, b) => new Date(b.date) - new Date(a.date));
                clients[clientIndex].lastBooking = clientBookings.length > 0 ? clientBookings[0].date : null;
            }
        }
        
        saveClients(clients);
        
        if (document.getElementById('clients').classList.contains('active')) {
            filterClients();
        }
    }
}

function saveBooking(type) {
    let date, time, count, discount, paymentAmount, checkPayment;
    let modalId = '';
    let nameField, birthdateField, phoneField, commentField;
    let duration = 0;
    
    if (type === 'karting') {
        date = document.getElementById('selectedTime').textContent.split(' ')[0];
        time = document.getElementById('selectedTime').textContent.split(' ')[1];
        count = parseInt(document.getElementById('kartsCount').textContent);
        discount = parseInt(document.getElementById('manualDiscount').value) || 0;
        paymentAmount = document.getElementById('paymentAmount').value;
        checkPayment = document.getElementById('checkPayment').checked;
        modalId = 'bookingModal';
        nameField = 'clientName';
        birthdateField = 'clientBirthdate';
        phoneField = 'clientPhone';
        commentField = 'clientAdminComment';
        duration = getSettings().karting.sessionDuration;
    } else if (type === 'party') {
        date = document.getElementById('partySelectedTime').textContent.split(' ')[0];
        time = document.getElementById('partySelectedTime').textContent.split(' ')[1];
        count = parseInt(document.getElementById('partyPeopleCount').textContent);
        discount = parseInt(document.getElementById('partyManualDiscount').value) || 0;
        paymentAmount = document.getElementById('partyPaymentAmount').value;
        checkPayment = document.getElementById('partyCheckPayment').checked;
        modalId = 'partyBookingModal';
        nameField = 'partyClientName';
        birthdateField = 'partyClientBirthdate';
        phoneField = 'partyClientPhone';
        commentField = 'partyClientAdminComment';
        duration = currentPartyDuration;
        
        // Проверяем конфликты для бронирования зала
        if (!currentBooking) {
            const conflicts = checkPartyBookingConflicts(date, time, duration);
            if (conflicts.length > 0) {
                alert(`Невозможно забронировать зал на выбранное время. Обнаружены конфликты с: ${conflicts.join(', ')}.`);
                return;
            }
        }
    } else if (type === 'lounge') {
        date = document.getElementById('loungeSelectedTime').textContent.split(' ')[0];
        time = document.getElementById('loungeSelectedTime').textContent.split(' ')[1];
        count = parseInt(document.getElementById('loungePeopleCount').textContent);
        discount = parseInt(document.getElementById('loungeManualDiscount').value) || 0;
        paymentAmount = document.getElementById('loungePaymentAmount').value;
        checkPayment = document.getElementById('loungeCheckPayment').checked;
        modalId = 'loungeBookingModal';
        nameField = 'loungeClientName';
        birthdateField = 'loungeClientBirthdate';
        phoneField = 'loungeClientPhone';
        commentField = 'loungeClientAdminComment';
        duration = currentLoungeDuration;
    } else if (type === 'virtual') {
        date = document.getElementById('virtualSelectedTime').textContent.split(' ')[0];
        time = document.getElementById('virtualSelectedTime').textContent.split(' ')[1];
        count = parseInt(document.getElementById('virtualSimulatorsCount').textContent);
        discount = parseInt(document.getElementById('virtualManualDiscount').value) || 0;
        paymentAmount = document.getElementById('virtualPaymentAmount').value;
        checkPayment = document.getElementById('virtualCheckPayment').checked;
        modalId = 'virtualBookingModal';
        nameField = 'virtualClientName';
        birthdateField = 'virtualClientBirthdate';
        phoneField = 'virtualClientPhone';
        commentField = 'virtualClientAdminComment';
        duration = currentVirtualDuration;
    }
    
    const booking = {
        id: currentBooking ? currentBooking.id : Date.now(),
        type: type,
        date: date,
        time: time,
        clientName: document.getElementById(nameField).value,
        birthdate: document.getElementById(birthdateField).value,
        phone: document.getElementById(phoneField).value,
        discount: discount,
        checkPayment: checkPayment,
        paymentAmount: paymentAmount,
        createdAt: currentBooking ? currentBooking.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    // Добавляем специфичные поля для каждого типа
    if (type === 'karting') {
        booking.kartsCount = count;
        booking.mode = currentKartingMode;
    } else if (type === 'party') {
        booking.peopleCount = count;
        booking.duration = currentPartyDuration;
    } else if (type === 'lounge') {
        booking.peopleCount = count;
        booking.duration = currentLoungeDuration;
    } else if (type === 'virtual') {
        booking.simulatorsCount = count;
        booking.duration = currentVirtualDuration;
    }
    
    const bookings = getAllBookings();
    
    if (currentBooking) {
        const index = bookings.findIndex(b => b.id === currentBooking.id);
        if (index !== -1) {
            bookings[index] = booking;
        }
    } else {
        bookings.push(booking);
    }
    
    saveAllBookings(bookings);
    closeModal(modalId);
    
    // Обновляем расписание в зависимости от типа
    if (type === 'karting') {
        loadSchedule();
        generateCalendar();
    } else if (type === 'party') {
        loadPartySchedule();
        generatePartyCalendar();
        // При бронировании зала обновляем все модули
        loadSchedule();
        loadLoungeSchedule();
        loadVirtualSchedule();
    } else if (type === 'lounge') {
        loadLoungeSchedule();
        generateLoungeCalendar();
    } else if (type === 'virtual') {
        loadVirtualSchedule();
        generateVirtualCalendar();
    }
    
    updateStats(type);
    
    // Сохраняем клиента
    saveClient(booking, currentBooking ? true : false, type);
}

function saveClient(booking, isEdit = false, moduleType = 'karting') {
    const clients = getClients();
    let commentFromModal = '';
    
    // Получаем комментарий из соответствующего модуля
    if (moduleType === 'karting') {
        commentFromModal = document.getElementById('clientAdminComment').value;
    } else if (moduleType === 'party') {
        commentFromModal = document.getElementById('partyClientAdminComment').value;
    } else if (moduleType === 'lounge') {
        commentFromModal = document.getElementById('loungeClientAdminComment').value;
    } else if (moduleType === 'virtual') {
        commentFromModal = document.getElementById('virtualClientAdminComment').value;
    }
    
    let client = clients.find(c => 
        (c.phone && booking.phone && c.phone === booking.phone) || 
        c.name.toLowerCase() === booking.clientName.toLowerCase()
    );
    
    if (!client) {
        client = {
            id: Date.now(),
            name: booking.clientName,
            birthdate: booking.birthdate,
            phone: booking.phone,
            adminComment: commentFromModal,
            firstBooking: booking.date,
            lastBooking: booking.date,
            totalBookings: 1,
        };
        clients.push(client);
    } else {
        client.lastBooking = booking.date;
        if (!isEdit) {
            client.totalBookings = (client.totalBookings || 0) + 1;
        }
        if (booking.clientName && booking.clientName !== client.name) {
            client.name = booking.clientName;
        }
        if (booking.birthdate && !client.birthdate) {
            client.birthdate = booking.birthdate;
        }
        if (booking.phone && !client.phone) {
            client.phone = booking.phone;
        }
        // Обновляем комментарий только если он не пустой
        if (commentFromModal && commentFromModal.trim() !== '') {
            client.adminComment = commentFromModal;
        }
    }
    
    saveClients(clients);
}

// Закрытие модальных окон при клике вне области
window.addEventListener('click', function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            const form = modal.querySelector('form');
            if (form) {
                // Проверяем, есть ли введенные данные в форме
                const inputs = form.querySelectorAll('input, textarea');
                let hasData = false;
                inputs.forEach(input => {
                    if (input.value && input.value.trim() !== '') {
                        hasData = true;
                    }
                });
                
                if (hasData) {
                    if (confirm('У вас есть несохраненные данные. Вы уверены, что хотите закрыть без сохранения?')) {
                        modal.style.display = 'none';
                    }
                } else {
                    modal.style.display = 'none';
                }
            } else {
                modal.style.display = 'none';
            }
        }
    });
});