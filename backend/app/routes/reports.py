from flask import Blueprint, request, jsonify
from app.models import Client, Booking
from app.middleware import login_required
from datetime import datetime, timedelta
import csv
from io import StringIO

reports_bp = Blueprint('reports', __name__)


@reports_bp.route('/clients', methods=['GET'])
@login_required
def clients_report():
    """Отчет по клиентам"""
    clients = Client.query.all()

    output = StringIO()
    writer = csv.writer(output)

    # Заголовки
    writer.writerow([
        'Имя', 'Телефон', 'Дата рождения', 'Комментарий',
        'Броней в картинге', 'Броней в зале', 'Броней в лаундж зоне', 'Броней в симуляторах',
        'Всего броней', 'Первый визит', 'Последний визит'
    ])

    for client in clients:
        # Статистика по типам бронирований
        stats = {
            'karting': 0,
            'party': 0,
            'lounge': 0,
            'virtual': 0
        }

        for booking in client.bookings:
            stats[booking.type] += 1

        writer.writerow([
            client.name,
            client.phone or '',
            client.birthdate.isoformat() if client.birthdate else '',
            client.admin_comment or '',
            stats['karting'],
            stats['party'],
            stats['lounge'],
            stats['virtual'],
            len(client.bookings),
            client.first_booking.isoformat() if client.first_booking else '',
            client.last_booking.isoformat() if client.last_booking else ''
        ])

    return jsonify({
        'csv': output.getvalue(),
        'filename': f'clients_report_{datetime.now().strftime("%Y-%m-%d")}.csv'
    })


@reports_bp.route('/bookings', methods=['GET'])
@login_required
def bookings_report():
    """Отчет по бронированиям за период"""
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    if not start_date or not end_date:
        return jsonify({'error': 'Необходимы параметры start_date и end_date'}), 400

    try:
        start = datetime.strptime(start_date, '%Y-%m-%d').date()
        end = datetime.strptime(end_date, '%Y-%m-%d').date()

        bookings = Booking.query.filter(
            Booking.date >= start,
            Booking.date <= end
        ).order_by(Booking.date, Booking.time).all()

        output = StringIO()
        writer = csv.writer(output)

        # Заголовки
        writer.writerow([
            'Дата', 'Время', 'Тип бронирования', 'Клиент', 'Телефон',
            'Количество', 'Скидка', 'Сумма', 'Статус оплаты'
        ])

        for booking in bookings:
            count_text = ''
            if booking.type == 'karting':
                count_text = f'{booking.karts_count or 1} карт.'
            elif booking.type in ['party', 'lounge']:
                count_text = f'{booking.people_count or 1} чел.'
            elif booking.type == 'virtual':
                count_text = f'{booking.simulators_count or 1} сим.'

            type_text = {
                'karting': 'Картинг',
                'party': 'Аренда зала',
                'lounge': 'Лаундж зона',
                'virtual': 'Симулятор'
            }.get(booking.type, booking.type)

            writer.writerow([
                booking.date.isoformat(),
                booking.time,
                type_text,
                booking.client.name,
                booking.client.phone or '',
                count_text,
                booking.discount or 0,
                booking.payment_amount,
                'Оплачено' if booking.check_payment else 'Не оплачено'
            ])

        return jsonify({
            'csv': output.getvalue(),
            'filename': f'bookings_report_{start_date}_to_{end_date}.csv'
        })

    except ValueError:
        return jsonify({'error': 'Неверный формат даты'}), 400


@reports_bp.route('/revenue', methods=['GET'])
@login_required
def revenue_report():
    """Отчет по выручке"""
    period = request.args.get('period', 'day')  # day, week, month, year
    date_str = request.args.get('date', datetime.now().strftime('%Y-%m-%d'))

    try:
        date = datetime.strptime(date_str, '%Y-%m-%d').date()

        if period == 'day':
            start_date = date
            end_date = date
        elif period == 'week':
            start_date = date - timedelta(days=date.weekday())
            end_date = start_date + timedelta(days=6)
        elif period == 'month':
            start_date = date.replace(day=1)
            next_month = date.replace(day=28) + timedelta(days=4)
            end_date = next_month - timedelta(days=next_month.day)
        elif period == 'year':
            start_date = date.replace(month=1, day=1)
            end_date = date.replace(month=12, day=31)
        else:
            return jsonify({'error': 'Неверный период'}), 400

        # Статистика по типам
        stats = {
            'karting': {'count': 0, 'revenue': 0},
            'party': {'count': 0, 'revenue': 0},
            'lounge': {'count': 0, 'revenue': 0},
            'virtual': {'count': 0, 'revenue': 0},
            'total': {'count': 0, 'revenue': 0}
        }

        bookings = Booking.query.filter(
            Booking.date >= start_date,
            Booking.date <= end_date,
            Booking.check_payment == True  # Только оплаченные
        ).all()

        for booking in bookings:
            stats[booking.type]['count'] += 1
            stats[booking.type]['revenue'] += booking.payment_amount
            stats['total']['count'] += 1
            stats['total']['revenue'] += booking.payment_amount

        return jsonify({
            'period': period,
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'stats': stats
        })

    except ValueError:
        return jsonify({'error': 'Неверный формат даты'}), 400