// Управление клиентами

function filterClients() {
    const searchValue = document.getElementById('clientSearchInput').value.toLowerCase();
    const clients = getClients();
    const clientsContainer = document.getElementById('clientsList');
    
    clientsContainer.innerHTML = '';
    
    const filteredClients = clients.filter(client => 
        client.name && client.name.toLowerCase().includes(searchValue) ||
        (client.phone && client.phone.toLowerCase().includes(searchValue))
    );
    
    displayClients(filteredClients);
}

function showTodayClients() {
    const today = new Date().toISOString().split('T')[0];
    const bookings = getAllBookings().filter(b => b.date === today);
    
    const clientIdentifiers = new Set();
    bookings.forEach(b => {
        clientIdentifiers.add(b.clientName.toLowerCase());
        if (b.phone) clientIdentifiers.add(b.phone);
    });

    const clients = getClients().filter(c => 
        clientIdentifiers.has(c.name.toLowerCase()) || 
        (c.phone && clientIdentifiers.has(c.phone))
    );
    
    displayClients(clients);
}

function showUpcomingBirthdays() {
    const clients = getClients();
    const today = new Date();
    const upcoming = [];
    
    clients.forEach(client => {
        if (client.birthdate) {
            try {
                const birthDate = new Date(client.birthdate);
                const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
                
                let nextBirthday = thisYearBirthday;
                
                if (thisYearBirthday < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
                    nextBirthday = new Date(today.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate());
                }
                
                const diffTime = nextBirthday - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays >= 0 && diffDays <= 30) {
                    client.daysUntilBirthday = diffDays;
                    upcoming.push(client);
                }
            } catch (e) {
                console.error("Invalid birthdate for client:", client.name, client.birthdate);
            }
        }
    });
    
    upcoming.sort((a, b) => a.daysUntilBirthday - b.daysUntilBirthday);
    displayClients(upcoming, true); 
}

// Функция для получения статистики бронирований клиента по типам
function getClientBookingStats(client) {
    const bookings = getAllBookings();
    const clientBookings = bookings.filter(b => 
        b.clientName.toLowerCase() === client.name.toLowerCase() || 
        (client.phone && b.phone === client.phone)
    );
    
    const stats = {
        karting: 0,
        party: 0,
        lounge: 0,
        virtual: 0,
        total: clientBookings.length
    };
    
    clientBookings.forEach(booking => {
        if (booking.type === 'karting') stats.karting++;
        else if (booking.type === 'party') stats.party++;
        else if (booking.type === 'lounge') stats.lounge++;
        else if (booking.type === 'virtual') stats.virtual++;
    });
    
    return stats;
}

function displayClients(clients, isBirthdayList = false) {
    const clientsContainer = document.getElementById('clientsList');
    clientsContainer.innerHTML = '';
    
    if (clients.length === 0) {
        const message = isBirthdayList ? 'В ближайшие 30 дней нет дней рождения.' : 'Клиенты не найдены.';
        clientsContainer.innerHTML = `<div class="booking-item">${message}</div>`;
        return;
    }
    
    clients.forEach(client => {
        const item = document.createElement('div');
        item.className = 'booking-item';
        
        const stats = getClientBookingStats(client);
        
        let birthdayInfo = '';
        if (isBirthdayList && client.birthdate) {
            const birthDate = new Date(client.birthdate);
            const dateStr = `${String(birthDate.getDate()).padStart(2, '0')}.${String(birthDate.getMonth() + 1).padStart(2, '0')}`;
            const daysText = client.daysUntilBirthday === 0 ? ' (Сегодня!)' : ` (через ${client.daysUntilBirthday} д.)`;
            birthdayInfo = `<div style="color: #e74c3c; font-weight: bold;">🎂 ${dateStr}${daysText}</div>`;
        }

        item.innerHTML = `
            <div>
                <strong>${client.name || 'Не указано'}</strong>
                <div>${client.phone || 'Телефон не указан'}</div>
                <div>Дата рождения: ${client.birthdate || 'не указана'}</div>
                <div>Комментарий: ${client.adminComment || 'нет'}</div>
                ${birthdayInfo}
                <div class="client-stats">
                    <div class="stat-badge karting">🏎️ Картинг: ${stats.karting}</div>
                    <div class="stat-badge virtual">🎮 Симулятор: ${stats.virtual}</div>
                    <div class="stat-badge lounge">🥤 Лаундж: ${stats.lounge}</div>
                    <div class="stat-badge party">🎉 Зал: ${stats.party}</div>
                                                   
                </div>
            </div>
            <div class="client-actions">
                <div style="text-align: right;">
                    <div>${getRidesText(stats.total)}</div>
                    <div>Последний: ${client.lastBooking || 'нет'}</div>
                </div>
                <button class="btn btn-primary" onclick="editClient(${client.id})">Редактировать</button>
            </div>
        `;
        clientsContainer.appendChild(item);
    });
}

function editClient(clientId) {
    const clients = getClients();
    const client = clients.find(c => c.id === clientId);
    
    if (client) {
        document.getElementById('editClientId').value = client.id;
        document.getElementById('editClientName').value = client.name;
        document.getElementById('editClientBirthdate').value = client.birthdate || '';
        document.getElementById('editClientPhone').value = client.phone || '';
        document.getElementById('editClientComment').value = client.adminComment || ''; 
        
        const stats = getClientBookingStats(client);
        document.getElementById('editClientBookings').textContent = getRidesText(stats.total);
        document.getElementById('editClientLastBooking').textContent = client.lastBooking || 'нет';
        document.getElementById('editClientFirstBooking').textContent = client.firstBooking || 'нет';
        
        document.getElementById('editClientModal').style.display = 'flex';
    }
}

function saveClientChanges() {
    const clientId = parseInt(document.getElementById('editClientId').value);
    const clients = getClients();
    const clientIndex = clients.findIndex(c => c.id === clientId);
    
    if (clientIndex !== -1) {
        clients[clientIndex].name = document.getElementById('editClientName').value;
        clients[clientIndex].birthdate = document.getElementById('editClientBirthdate').value;
        clients[clientIndex].phone = document.getElementById('editClientPhone').value;
        clients[clientIndex].adminComment = document.getElementById('editClientComment').value; 
        
        saveClients(clients);
        closeModal('editClientModal');
        updateStats(currentModule);
        filterClients(); 
        
        alert('Данные клиента обновлены!');
    }
}

// Автодополнение
function suggestClients(event, moduleType = 'karting') {
    let nameInput, phoneInput, suggestions;
    
    if (moduleType === 'karting') {
        nameInput = document.getElementById('clientName');
        phoneInput = document.getElementById('clientPhone');
        suggestions = document.getElementById('clientSuggestions');
    } else if (moduleType === 'party') {
        nameInput = document.getElementById('partyClientName');
        phoneInput = document.getElementById('partyClientPhone');
        suggestions = document.getElementById('partyClientSuggestions');
    } else if (moduleType === 'lounge') {
        nameInput = document.getElementById('loungeClientName');
        phoneInput = document.getElementById('loungeClientPhone');
        suggestions = document.getElementById('loungeClientSuggestions');
    } else if (moduleType === 'virtual') {
        nameInput = document.getElementById('virtualClientName');
        phoneInput = document.getElementById('virtualClientPhone');
        suggestions = document.getElementById('virtualClientSuggestions');
    }
    
    if (!nameInput || !suggestions) return;
    
    const nameValue = nameInput.value.toLowerCase();
    const phoneValue = phoneInput ? phoneInput.value.toLowerCase() : '';
    
    if (nameValue.length < 2 && phoneValue.length < 2) {
        suggestions.style.display = 'none';
        return;
    }

    const clients = getClients();
    const phoneValueNormalized = phoneValue.replace(/[^0-9]/g, '');

    const filteredClients = clients.filter(client => {
        const nameMatch = nameValue.length >= 2 && client.name.toLowerCase().includes(nameValue);
        let phoneMatch = false;
        if (phoneValueNormalized.length >= 2 && client.phone) {
            const clientPhoneNormalized = client.phone.replace(/[^0-9]/g, '');
            phoneMatch = clientPhoneNormalized.includes(phoneValueNormalized);
        }
        return nameMatch || phoneMatch;
    });

    suggestions.innerHTML = '';

    if (filteredClients.length === 0) {
        suggestions.style.display = 'none';
        return;
    }

    filteredClients.forEach(client => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item';
        item.textContent = `${client.name} (${client.phone || 'нет тел.'})`;
        item.onclick = () => {
            selectClient(client, moduleType);
            suggestions.style.display = 'none';
        };
        suggestions.appendChild(item);
    });

    suggestions.style.display = 'block';
}

function selectClient(client, moduleType = 'karting') {
    if (moduleType === 'karting') {
        document.getElementById('clientName').value = client.name;
        document.getElementById('clientBirthdate').value = client.birthdate || '';
        document.getElementById('clientPhone').value = client.phone || '';
        document.getElementById('clientAdminComment').value = client.adminComment || '';
        document.getElementById('manualDiscount').value = '0';
        calculateAmount();
    } else if (moduleType === 'party') {
        document.getElementById('partyClientName').value = client.name;
        document.getElementById('partyClientBirthdate').value = client.birthdate || '';
        document.getElementById('partyClientPhone').value = client.phone || '';
        document.getElementById('partyClientAdminComment').value = client.adminComment || '';
        document.getElementById('partyManualDiscount').value = '0';
        calculatePartyAmount();
    } else if (moduleType === 'lounge') {
        document.getElementById('loungeClientName').value = client.name;
        document.getElementById('loungeClientBirthdate').value = client.birthdate || '';
        document.getElementById('loungeClientPhone').value = client.phone || '';
        document.getElementById('loungeClientAdminComment').value = client.adminComment || '';
        document.getElementById('loungeManualDiscount').value = '0';
        calculateLoungeAmount();
    } else if (moduleType === 'virtual') {
        document.getElementById('virtualClientName').value = client.name;
        document.getElementById('virtualClientBirthdate').value = client.birthdate || '';
        document.getElementById('virtualClientPhone').value = client.phone || '';
        document.getElementById('virtualClientAdminComment').value = client.adminComment || '';
        document.getElementById('virtualManualDiscount').value = '0';
        calculateVirtualAmount();
    }
}