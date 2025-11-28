from flask import Blueprint, request, jsonify
from app import db
from app.models import Setting
from app.middleware import login_required
import json

settings_bp = Blueprint('settings', __name__)


@settings_bp.route('/', methods=['GET'])
@login_required
def get_settings():
    from app.utils.database import get_all_settings
    settings = get_all_settings()
    # Не возвращаем пароль
    if 'admin_password' in settings:
        del settings['admin_password']
    return jsonify(settings)


@settings_bp.route('/', methods=['PUT'])
@login_required
def update_settings():
    data = request.get_json()

    try:
        for key, value in data.items():
            if key == 'admin_password':
                # Обновляем пароль
                setting = Setting.query.filter_by(key=key).first()
                if setting:
                    setting.value = value
                else:
                    setting = Setting(key=key, value=value)
                    db.session.add(setting)
            elif isinstance(value, (dict, list)):
                # Для сложных объектов сохраняем как JSON
                setting = Setting.query.filter_by(key=key).first()
                if setting:
                    setting.value = json.dumps(value, ensure_ascii=False)
                else:
                    setting = Setting(key=key, value=json.dumps(value, ensure_ascii=False))
                    db.session.add(setting)
            else:
                # Для простых значений
                setting = Setting.query.filter_by(key=key).first()
                if setting:
                    setting.value = str(value)
                else:
                    setting = Setting(key=key, value=str(value))
                    db.session.add(setting)

        db.session.commit()

        return jsonify({'success': True, 'message': 'Настройки сохранены'})

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Ошибка сохранения: {str(e)}'}), 500


@settings_bp.route('/export', methods=['GET'])
@login_required
def export_data():
    """Экспорт всех данных"""
    from app.models import Client, Booking, Setting
    import json
    from datetime import date, datetime

    def json_serial(obj):
        """JSON serializer for objects not serializable by default json code"""
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        raise TypeError(f"Type {type(obj)} not serializable")

    data = {
        'clients': [client.to_dict() for client in Client.query.all()],
        'bookings': [booking.to_dict() for booking in Booking.query.all()],
        'settings': {s.key: s.value for s in Setting.query.all()},
        'export_date': datetime.utcnow().isoformat()
    }

    return jsonify(data)


@settings_bp.route('/import', methods=['POST'])
@login_required
def import_data():
    """Импорт данных"""
    from app.models import Client, Booking, Setting
    from datetime import datetime
    import json

    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'Файл не найден'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'message': 'Файл не выбран'}), 400

    if file and file.filename.endswith('.json'):
        try:
            data = json.load(file)

            # Очищаем существующие данные (осторожно!)
            if request.args.get('clear_existing') == 'true':
                Booking.query.delete()
                Client.query.delete()
                # Setting.query.delete()  # Не очищаем настройки

            # Импортируем клиентов
            if 'clients' in data:
                for client_data in data['clients']:
                    client = Client(
                        name=client_data['name'],
                        birthdate=datetime.strptime(client_data['birthdate'], '%Y-%m-%d').date() if client_data.get(
                            'birthdate') else None,
                        phone=client_data.get('phone'),
                        admin_comment=client_data.get('admin_comment'),
                        first_booking=datetime.strptime(client_data['first_booking'],
                                                        '%Y-%m-%d').date() if client_data.get(
                            'first_booking') else None,
                        last_booking=datetime.strptime(client_data['last_booking'],
                                                       '%Y-%m-%d').date() if client_data.get('last_booking') else None,
                        total_bookings=client_data.get('total_bookings', 0)
                    )
                    db.session.add(client)

            # Импортируем бронирования
            if 'bookings' in data:
                for booking_data in data['bookings']:
                    # Находим клиента по имени (упрощенно)
                    client = Client.query.filter_by(name=booking_data['client_name']).first()
                    if client:
                        booking = Booking(
                            type=booking_data['type'],
                            date=datetime.strptime(booking_data['date'], '%Y-%m-%d').date(),
                            time=booking_data['time'],
                            client_id=client.id,
                            discount=booking_data.get('discount', 0),
                            payment_amount=booking_data['payment_amount'],
                            check_payment=booking_data.get('check_payment', False),
                            karts_count=booking_data.get('karts_count'),
                            mode=booking_data.get('mode'),
                            people_count=booking_data.get('people_count'),
                            duration=booking_data.get('duration'),
                            simulators_count=booking_data.get('simulators_count')
                        )
                        db.session.add(booking)

            db.session.commit()

            return jsonify({'success': True, 'message': 'Данные успешно импортированы'})

        except Exception as e:
            db.session.rollback()
            return jsonify({'success': False, 'message': f'Ошибка импорта: {str(e)}'}), 500

    return jsonify({'success': False, 'message': 'Неверный формат файла'}), 400