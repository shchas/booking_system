from app import db
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import json


class Client(db.Model):
    __tablename__ = 'clients'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    birthdate = db.Column(db.Date)
    phone = db.Column(db.String(20))
    admin_comment = db.Column(db.Text)
    first_booking = db.Column(db.Date)
    last_booking = db.Column(db.Date)
    total_bookings = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Связь с бронированиями
    bookings = db.relationship('Booking', backref='client', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'birthdate': self.birthdate.isoformat() if self.birthdate else None,
            'phone': self.phone,
            'admin_comment': self.admin_comment,
            'first_booking': self.first_booking.isoformat() if self.first_booking else None,
            'last_booking': self.last_booking.isoformat() if self.last_booking else None,
            'total_bookings': self.total_bookings,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


class Booking(db.Model):
    __tablename__ = 'bookings'

    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(20), nullable=False)  # 'karting', 'party', 'lounge', 'virtual'
    date = db.Column(db.Date, nullable=False)
    time = db.Column(db.String(5), nullable=False)  # Формат HH:MM
    client_id = db.Column(db.Integer, db.ForeignKey('clients.id'), nullable=False)

    # Общие поля
    discount = db.Column(db.Integer, default=0)
    payment_amount = db.Column(db.Integer, nullable=False)
    check_payment = db.Column(db.Boolean, default=False)

    # Специфичные поля для разных типов
    karts_count = db.Column(db.Integer)  # Для картинга
    mode = db.Column(db.String(20))  # 'regular', 'race' - для картинга
    people_count = db.Column(db.Integer)  # Для зала и лаундж зоны
    duration = db.Column(db.Integer)  # Длительность в минутах
    simulators_count = db.Column(db.Integer)  # Для симулятора

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'type': self.type,
            'date': self.date.isoformat(),
            'time': self.time,
            'client_id': self.client_id,
            'client_name': self.client.name if self.client else None,
            'discount': self.discount,
            'payment_amount': self.payment_amount,
            'check_payment': self.check_payment,
            'karts_count': self.karts_count,
            'mode': self.mode,
            'people_count': self.people_count,
            'duration': self.duration,
            'simulators_count': self.simulators_count,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


class Setting(db.Model):
    __tablename__ = 'settings'

    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(100), unique=True, nullable=False)
    value = db.Column(db.Text, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'key': self.key,
            'value': self.value
        }

    @classmethod
    def get_setting(cls, key, default=None):
        setting = cls.query.filter_by(key=key).first()
        return setting.value if setting else default

    @classmethod
    def set_setting(cls, key, value):
        setting = cls.query.filter_by(key=key).first()
        if setting:
            setting.value = value
        else:
            setting = cls(key=key, value=value)
            db.session.add(setting)


class AdminUser(db.Model):
    __tablename__ = 'admin_users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'created_at': self.created_at.isoformat()
        }