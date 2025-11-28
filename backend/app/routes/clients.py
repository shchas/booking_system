from flask import Blueprint, request, jsonify
from app import db
from app.models import Client, Booking
from sqlalchemy import or_
from datetime import datetime

clients_bp = Blueprint('clients', __name__)


@clients_bp.route('/', methods=['GET'])
def get_clients():
    search = request.args.get('search', '')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    query = Client.query

    if search:
        query = query.filter(
            or_(
                Client.name.ilike(f'%{search}%'),
                Client.phone.ilike(f'%{search}%')
            )
        )

    clients = query.order_by(Client.name).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        'clients': [client.to_dict() for client in clients.items],
        'total': clients.total,
        'pages': clients.pages,
        'current_page': page
    })


@clients_bp.route('/<int:client_id>', methods=['GET'])
def get_client(client_id):
    client = Client.query.get_or_404(client_id)
    return jsonify(client.to_dict())


@clients_bp.route('/', methods=['POST'])
def create_client():
    data = request.get_json()

    client = Client(
        name=data['name'],
        birthdate=datetime.strptime(data['birthdate'], '%Y-%m-%d').date() if data.get('birthdate') else None,
        phone=data.get('phone'),
        admin_comment=data.get('admin_comment')
    )

    db.session.add(client)
    db.session.commit()

    return jsonify(client.to_dict()), 201


@clients_bp.route('/<int:client_id>', methods=['PUT'])
def update_client(client_id):
    client = Client.query.get_or_404(client_id)
    data = request.get_json()

    client.name = data.get('name', client.name)
    if data.get('birthdate'):
        client.birthdate = datetime.strptime(data['birthdate'], '%Y-%m-%d').date()
    client.phone = data.get('phone', client.phone)
    client.admin_comment = data.get('admin_comment', client.admin_comment)
    client.updated_at = datetime.utcnow()

    db.session.commit()

    return jsonify(client.to_dict())


@clients_bp.route('/<int:client_id>', methods=['DELETE'])
def delete_client(client_id):
    client = Client.query.get_or_404(client_id)
    db.session.delete(client)
    db.session.commit()

    return jsonify({'success': True})


@clients_bp.route('/today', methods=['GET'])
def get_today_clients():
    today = datetime.now().date()

    # Находим клиентов с бронированиями на сегодня
    today_bookings = Booking.query.filter_by(date=today).all()
    client_ids = {booking.client_id for booking in today_bookings}

    clients = Client.query.filter(Client.id.in_(client_ids)).all()

    return jsonify({
        'clients': [client.to_dict() for client in clients],
        'count': len(clients)
    })


@clients_bp.route('/birthdays', methods=['GET'])
def get_upcoming_birthdays():
    today = datetime.now().date()
    upcoming = []

    clients = Client.query.filter(Client.birthdate.isnot(None)).all()

    for client in clients:
        birth_date = client.birthdate
        this_year_birthday = today.replace(month=birth_date.month, day=birth_date.day)

        if this_year_birthday < today:
            next_birthday = today.replace(year=today.year + 1, month=birth_date.month, day=birth_date.day)
        else:
            next_birthday = this_year_birthday

        days_until = (next_birthday - today).days

        if 0 <= days_until <= 30:
            client_data = client.to_dict()
            client_data['days_until_birthday'] = days_until
            client_data['next_birthday'] = next_birthday.isoformat()
            upcoming.append(client_data)

    # Сортируем по ближайшим дням рождения
    upcoming.sort(key=lambda x: x['days_until_birthday'])

    return jsonify({'clients': upcoming})