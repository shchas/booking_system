// Работа с базой данных

const DB_KEY = 'modular_booking_system';

// Инициализация единой базы данных
function initDatabase() {
    if (!localStorage.getItem(DB_KEY)) {
        const defaultData = {
            // Все бронирования всех модулей
            bookings: [],
            // Единая база клиентов
            clients: [],
            // Единый объект настроек
            settings: {
                adminPassword: "admin",
                // Настройки вечернего режима
                eveningWeekendPricing: {
                    enabled: false,
                    time: "18:00"
                },
                // Настройки Картинга
                karting: {
                    openTime: "10:00",
                    closeTime: "22:00",
                    sessionDuration: 15,
                    priceRegular: 500,
                    priceRace: 700,
                    priceRegularWeekend: 600,
                    priceRaceWeekend: 840,
                    maxKartsPerSlot: 6
                },
                // Настройки Аренды зала
                party: {
                    openTime: "10:00",
                    closeTime: "22:00",
                    sessionDuration: 60,
                    price1Hour: 1000,
                    price2Hours: 1800,
                    price1HourWeekend: 1200,
                    price2HoursWeekend: 2160
                },
                // Настройки Лаундж зоны
                lounge: {
                    openTime: "10:00",
                    closeTime: "22:00",
                    sessionDuration: 120,
                    price1Hour: 800,
                    price2Hours: 1500,
                    price1HourWeekend: 960,
                    price2HoursWeekend: 1800
                },
                // Настройки Симулятора
                virtual: {
                    openTime: "10:00",
                    closeTime: "22:00",
                    baseDuration: 15,
                    maxSimulators: 2,
                    durationPrices: {
                        15: { weekday: 1000, weekend: 1200 },
                        30: { weekday: 1800, weekend: 2160 },
                        45: { weekday: 2500, weekend: 3000 },
                        60: { weekday: 3000, weekend: 3600 },
                        75: { weekday: 3500, weekend: 4200 },
                        90: { weekday: 4000, weekend: 4800 }
                    }
                },
                // Трудовой календарь (выходные дни)
                weekendCalendar: {}
            }
        };
        localStorage.setItem(DB_KEY, JSON.stringify(defaultData));
    }
    
    // Инициализация выпадающего списка времени
    initializeTimeSelect();
}

// Инициализация выпадающего списка времени
function initializeTimeSelect() {
    const timeSelect = document.getElementById('eveningWeekendPricingTime');
    if (!timeSelect) return;
    
    timeSelect.innerHTML = '';
    
    for (let hour = 10; hour <= 22; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
            const option = document.createElement('option');
            option.value = timeString;
            option.textContent = timeString;
            timeSelect.appendChild(option);
        }
    }
}

// Функции-хелперы для работы с единой БД
function getDatabase() {
    return JSON.parse(localStorage.getItem(DB_KEY)) || { bookings: [], clients: [], settings: {} };
}

function saveDatabase(data) {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
}

function getSettings() {
    return getDatabase().settings;
}

function saveSettings(settings) {
    const data = getDatabase();
    data.settings = settings;
    saveDatabase(data);
}

function getClients() {
    return getDatabase().clients;
}

function saveClients(clients) {
    const data = getDatabase();
    data.clients = clients;
    saveDatabase(data);
}

function getAllBookings() {
    return getDatabase().bookings;
}

function saveAllBookings(bookings) {
    const data = getDatabase();
    data.bookings = bookings;
    saveDatabase(data);
}

function getBookings(type) {
    return getAllBookings().filter(b => b.type === type);
}