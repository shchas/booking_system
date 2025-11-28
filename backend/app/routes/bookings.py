from flask import Blueprint, request, jsonify
from app import db
from app.models import Booking, Client
from app.middleware import login_required
from datetime import datetime, timedelta
import json

bookings_bp = Blueprint('bookings', __name__)


@bookings_bp.route('/', methods=['GET'])
@login_required
def get_bookings():
    booking_type = request.args.get('type')
    date = request.args.get('date')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    query = Booking.query

    if booking_type:
        query = query.filter_by(type=booking_type)

    if date:
        try:
            date_obj = datetime.strptime(date, '%Y-%m-%d').date()
            query = query.filter_by(date=date_obj)
        except ValueError:
            return jsonify({'error': 'Неверный формат даты'}), 400

    bookings = query.order_by(Booking.date.desc(), Booking.time.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        'bookings': [booking.to_dict() for booking in bookings.items],
        'total': bookings.total,
        'pages': bookings.pages,
        'current_page': page
    })


@bookings_bp.route('/', methods=['POST'])
@login_required
def create_booking():
    data = request.get_json()

    try:
        # Проверяем существование клиента
        client = Client.query.get(data['client_id'])
        if not client:
            return jsonify({'error': 'Клиент не найден'}), 404

        # Создаем бронирование
        booking = Booking(
            type=data['type'],
            date=datetime.strptime(data['date'], '%Y-%m-%d').date(),
            time=data['time'],
            client_id=data['client_id'],
            discount=data.get('discount', 0),
            payment_amount=data['payment_amount'],
            check_payment=data.get('check_payment', False),
            karts_count=data.get('karts_count'),
            mode=data.get('mode'),
            people_count=data.get('people_count'),
            duration=data.get('duration'),
            simulators_count=data.get('simulators_count')
        )

        db.session.add(booking)

        # Обновляем статистику клиента
        client.total_bookings += 1
        client.last_booking = booking.date
        if not client.first_booking:
            client.first_booking = booking.date
        client.updated_at = datetime.utcnow()

        db.session.commit()

        return jsonify(booking.to_dict()), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Ошибка при создании бронирования: {str(e)}'}), 400


@bookings_bp.route('/<int:booking_id>', methods=['GET'])
@login_required
def get_booking(booking_id):
    booking = Booking.query.get_or_404(booking_id)
    return jsonify(booking.to_dict())


@bookings_bp.route('/<int:booking_id>', methods=['PUT'])
@login_required
def update_booking(booking_id):
    booking = Booking.query.get_or_404(booking_id)
    data = request.get_json()

    try:
        if 'date' in data:
            booking.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        if 'time' in data:
            booking.time = data['time']

        booking.discount = data.get('discount', booking.discount)
        booking.payment_amount = data.get('payment_amount', booking.payment_amount)
        booking.check_payment = data.get('check_payment', booking.check_payment)
        booking.karts_count = data.get('karts_count', booking.karts_count)
        booking.mode = data.get('mode', booking.mode)
        booking.people_count = data.get('people_count', booking.people_count)
        booking.duration = data.get('duration', booking.duration)
        booking.simulators_count = data.get('simulators_count', booking.simulators_count)
        booking.updated_at = datetime.utcnow()

        db.session.commit()

        return jsonify(booking.to_dict())

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Ошибка при обновлении бронирования: {str(e)}'}), 400


@bookings_bp.route('/<int:booking_id>', methods=['DELETE'])
@login_required
def delete_booking(booking_id):
    booking = Booking.query.get_or_404(booking_id)

    # Обновляем статистику клиента
    client = booking.client
    client.total_bookings = max(0, client.total_bookings - 1)

    # Если это была последняя бронь, обновляем last_booking
    if client.last_booking == booking.date:
        last_booking = Booking.query.filter_by(client_id=client.id) \
            .filter(Booking.id != booking_id) \
            .order_by(Booking.date.desc()) \
            .first()
        client.last_booking = last_booking.date if last_booking else None

    db.session.delete(booking)
    db.session.commit()

    return jsonify({'success': True, 'message': 'Бронирование удалено'})


@bookings_bp.route('/availability', methods=['GET'])
@login_required
def check_availability():
    """Проверка доступности времени"""
    booking_type = request.args.get('type')
    date = request.args.get('date')
    time = request.args.get('time')

    if not all([booking_type, date, time]):
        return jsonify({'error': 'Необходимы параметры: type, date, time'}), 400

    try:
        date_obj = datetime.strptime(date, '%Y-%m-%d').date()

        # Здесь будет логика проверки доступности
        # Пока просто проверяем, есть ли бронирования в это время
        existing_bookings = Booking.query.filter_by(
            type=booking_type,
            date=date_obj,
            time=time
        ).count()

        # Получаем настройки для определения максимальной вместимости
        from app.models import Setting
        settings = {}
        setting = Setting.query.filter_by(key=f'{booking_type}_settings').first()
        if setting:
            settings = json.loads(setting.value)

        max_capacity = 1
        if booking_type == 'karting':
            max_capacity = settings.get('max_karts_per_slot', 6)
        elif booking_type == 'virtual':
            max_capacity = settings.get('max_simulators', 2)

        available = existing_bookings < max_capacity

        return jsonify({
            'available': available,
            'existing_bookings': existing_bookings,
            'max_capacity': max_capacity
        })

    except ValueError:
        return jsonify({'error': 'Неверный формат даты или времени'}), 400


@bookings_bp.route('/conflicts', methods=['GET'])
@login_required
def check_conflicts():
    """Проверка конфликтов бронирований"""
    date = request.args.get('date')
    time = request.args.get('time')
    duration = request.args.get('duration', 60, type=int)

    if not all([date, time]):
        return jsonify({'error': 'Необходимы параметры: date, time'}), 400

    try:
        date_obj = datetime.strptime(date, '%Y-%m-%d').date()
        time_obj = datetime.strptime(time, '%H:%M').time()
        start_datetime = datetime.combine(date_obj, time_obj)
        end_datetime = start_datetime + timedelta(minutes=duration)

        # Ищем конфликтующие бронирования
        conflicts = Booking.query.filter(
            Booking.date == date_obj,
            db.or_(
                db.and_(
                    Booking.time <= time,
                    db.cast(Booking.time + (Booking.duration / 60), db.String) > time
                ),
                db.and_(
                    Booking.time < db.cast(end_datetime.time(), db.String),
                    db.cast(Booking.time + (Booking.duration / 60), db.String) > db.cast(end_datetime.time(), db.String)
                )
            )
        ).all()

        return jsonify({
            'has_conflicts': len(conflicts) > 0,
            'conflicts': [booking.to_dict() for booking in conflicts]
        })

    except ValueError:
        return jsonify({'error': 'Неверный формат даты или времени'}), 400