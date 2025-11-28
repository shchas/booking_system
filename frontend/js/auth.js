// Авторизация и управление доступом

// Обработка нажатия Enter при вводе пароля
function handleLoginKeyPress(event) {
    if (event.key === 'Enter') {
        login();
    }
}

function login() {
    const password = document.getElementById('passwordInput').value;
    const settings = getSettings();
    
    if (password === settings.adminPassword) {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('mainInterface').style.display = 'block';
        showModule(currentModule);
        loadAllSettingsToForm();
        generateWeekendCalendar();
    } else {
        alert('Неверный пароль!');
    }
}

function logout() {
    document.getElementById('loginScreen').style.display = 'block';
    document.getElementById('mainInterface').style.display = 'none';
    document.getElementById('passwordInput').value = '';
}

// Смена пароля
function openPasswordModal() {
    document.getElementById('passwordModal').style.display = 'block';
    document.getElementById('oldPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    document.getElementById('passwordMessage').textContent = '';
}

function closePasswordModal() {
    document.getElementById('passwordModal').style.display = 'none';
}

function changePassword() {
    const oldPassword = document.getElementById('oldPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const messageElement = document.getElementById('passwordMessage');
    
    const settings = getSettings();
    
    if (oldPassword !== settings.adminPassword) {
        messageElement.textContent = 'Неверный старый пароль!';
        return;
    }
    if (!newPassword) {
        messageElement.textContent = 'Новый пароль не может быть пустым!';
        return;
    }
    if (newPassword !== confirmPassword) {
        messageElement.textContent = 'Новый пароль и подтверждение не совпадают!';
        return;
    }
    
    settings.adminPassword = newPassword;
    saveSettings(settings);
    
    alert('Пароль успешно изменен!');
    closePasswordModal();
}