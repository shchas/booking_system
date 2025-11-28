from flask import Blueprint, request, jsonify, session
from app import db
from app.models import Setting
from app.utils.database import get_all_settings, init_default_settings
from datetime import datetime

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    password = data.get('password')

    # Получаем пароль из настроек
    settings = get_all_settings()
    admin_password = settings.get('admin_password', 'admin')

    if password == admin_password:
        session['logged_in'] = True
        session['login_time'] = datetime.utcnow().isoformat()

        return jsonify({
            'success': True,
            'message': 'Успешный вход в систему'
        })

    return jsonify({
        'success': False,
        'message': 'Неверный пароль'
    }), 401


@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True, 'message': 'Выход выполнен'})


@auth_bp.route('/check', methods=['GET'])
def check_auth():
    if session.get('logged_in'):
        return jsonify({'authenticated': True})
    return jsonify({'authenticated': False}), 401


@auth_bp.route('/change-password', methods=['POST'])
def change_password():
    if not session.get('logged_in'):
        return jsonify({'success': False, 'message': 'Не авторизован'}), 401

    data = request.get_json()
    old_password = data.get('old_password')
    new_password = data.get('new_password')

    # Получаем текущий пароль
    setting = Setting.query.filter_by(key='admin_password').first()
    current_password = setting.value if setting else 'admin'

    if old_password == current_password:
        if setting:
            setting.value = new_password
        else:
            setting = Setting(key='admin_password', value=new_password)
            db.session.add(setting)

        db.session.commit()
        return jsonify({'success': True, 'message': 'Пароль успешно изменен'})

    return jsonify({'success': False, 'message': 'Неверный старый пароль'}), 400


@auth_bp.route('/settings', methods=['GET'])
def get_settings():
    if not session.get('logged_in'):
        return jsonify({'error': 'Не авторизован'}), 401

    settings = get_all_settings()
    # Не возвращаем пароль в настройках
    if 'admin_password' in settings:
        del settings['admin_password']

    return jsonify(settings)


@auth_bp.route('/init', methods=['POST'])
def init_database():
    """Инициализация базы данных с настройками по умолчанию"""
    try:
        init_default_settings()
        return jsonify({'success': True, 'message': 'База данных инициализирована'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Ошибка: {str(e)}'}), 500