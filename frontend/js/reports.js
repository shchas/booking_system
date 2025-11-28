// Генерация отчетов

function generateClientReport() {
    const clients = getClients();
    let csv = 'Имя,Телефон,Дата рождения,Комментарий,Броней в картинге,Броней в зале,Броней в лаундж зоне,Броней в симуляторах,Всего броней,Первый визит,Последний визит\n';
    
    clients.forEach(client => {
        const stats = getClientBookingStats(client);
        const comment = (client.adminComment || '').replace(/"/g, '""');
        csv += `"${client.name}","${client.phone || ''}","${client.birthdate || ''}","${comment}",${stats.karting},${stats.party},${stats.lounge},${stats.virtual},${stats.total},"${client.firstBooking || ''}","${client.lastBooking || ''}"\n`;
    });
    
    downloadCSV(csv, 'clients_report_all.csv');
}

function generatePeriodReport() {
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;
    
    if (!startDate || !endDate) {
        alert('Выберите начальную и конечную даты для отчета');
        return;
    }
    
    if (startDate > endDate) {
        alert('Начальная дата не может быть позже конечной');
        return;
    }
    
    const allBookings = getAllBookings().filter(b => b.date >= startDate && b.date <= endDate);
    
    allBookings.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA - dateB;
    });
    
    let csv = 'Дата,Время,Тип бронирования,Клиент,Телефон,Количество,Скидка %,Сумма,Статус оплаты\n';
    
    allBookings.forEach(booking => {
        const status = booking.checkPayment ? 'Оплачено' : 'Не оплачено';
        let typeText = '';
        let count = '';
        
        if (booking.type === 'karting') {
            typeText = 'Картинг';
            count = `${booking.kartsCount || 1} карт.`;
        } else if (booking.type === 'party') {
            typeText = 'Аренда зала';
            count = `${booking.peopleCount || 1} чел.`;
        } else if (booking.type === 'lounge') {
            typeText = 'Лаундж зона';
            count = `${booking.peopleCount || 1} чел.`;
        } else if (booking.type === 'virtual') {
            typeText = 'Симулятор';
            count = `${booking.simulatorsCount || 1} сим.`;
        }
        
        csv += `"${booking.date}","${booking.time}","${typeText}","${booking.clientName}","${booking.phone || ''}","${count}",${booking.discount || 0},${booking.paymentAmount},${status}\n`;
    });
    
    downloadCSV(csv, `bookings_report_${startDate}_to_${endDate}.csv`);
}

function downloadCSV(csv, filename) {
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}