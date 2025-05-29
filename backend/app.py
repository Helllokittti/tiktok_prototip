import os
from flask import Flask, request, jsonify, send_from_directory
from flask_migrate import Migrate
from flask_cors import CORS
from models import db, User, Video, Comment, Like, Message, VideoShare
from config import Config
import jwt
from datetime import datetime, timedelta
from functools import wraps
from werkzeug.utils import secure_filename

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    db.init_app(app)
    migrate = Migrate(app, db)
    CORS(app) # Разрешить CORS для фронтенда

    # Создаем папку для загруженных файлов, если ее нет
    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        os.makedirs(app.config['UPLOAD_FOLDER'])

    # Декоратор для защиты маршрутов
    def token_required(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            token = None
            if 'Authorization' in request.headers:
                token = request.headers['Authorization'].split(" ")[1] # Bearer <token>

            if not token:
                return jsonify({'message': 'Token is missing!'}), 401

            try:
                data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
                current_user = User.query.get(data['user_id'])
            except Exception as e:
                return jsonify({'message': 'Token is invalid!', 'error': str(e)}), 401
            return f(current_user, *args, **kwargs)
        return decorated

    # --- Маршруты (API Эндпоинты) ---

    # 1. Регистрация и Авторизация
    @app.route('/api/register', methods=['POST'])
    def register():
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')

        if not username or not email or not password:
            return jsonify({'message': 'Missing required fields'}), 400

        if User.query.filter_by(username=username).first():
            return jsonify({'message': 'Username already exists'}), 409
        if User.query.filter_by(email=email).first():
            return jsonify({'message': 'Email already exists'}), 409

        new_user = User(username=username, email=email)
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()
        return jsonify({'message': 'User registered successfully'}), 201

    @app.route('/api/login', methods=['POST'])
    def login():
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')

        user = User.query.filter_by(username=username).first()
        if not user or not user.check_password(password):
            return jsonify({'message': 'Invalid credentials'}), 401

        token = jwt.encode({
            'user_id': user.id,
            'exp': datetime.utcnow() + timedelta(hours=24) # Токен действителен 24 часа
        }, app.config['SECRET_KEY'], algorithm="HS256")

        return jsonify({'token': token, 'user': {'id': user.id, 'username': user.username, 'email': user.email}}), 200

    # 2. Настройка профиля
    @app.route('/api/profile', methods=['GET'])
    @token_required
    def get_profile(current_user):
        return jsonify({
            'id': current_user.id,
            'username': current_user.username,
            'email': current_user.email,
            'profile_picture': current_user.profile_picture,
            'bio': current_user.bio
        }), 200

    @app.route('/api/profile', methods=['PUT'])
    @token_required
    def update_profile(current_user):
        data = request.get_json()
        current_user.bio = data.get('bio', current_user.bio)
        # TODO: Добавить загрузку и обновление profile_picture
        db.session.commit()
        return jsonify({'message': 'Profile updated successfully'}), 200

    # 3. Загрузка видео
    @app.route('/api/upload', methods=['POST'])
    @token_required
    def upload_video(current_user):
        if 'video' not in request.files:
            return jsonify({'message': 'No video file part'}), 400

        file = request.files['video']
        if file.filename == '':
            return jsonify({'message': 'No selected file'}), 400

        if file:
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)

            new_video = Video(
                user_id=current_user.id,
                file_path=file_path,
                description=request.form.get('description', '')
            )
            db.session.add(new_video)
            db.session.commit()
            return jsonify({'message': 'Video uploaded successfully', 'video_id': new_video.id}), 201
        return jsonify({'message': 'Error uploading video'}), 500

    # Для отдачи загруженных видео
    @app.route('/uploads/<filename>')
    def uploaded_file(filename):
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

    # 4. Лента рекомендаций (получение видео)
    @app.route('/api/videos', methods=['GET'])
    def get_videos():
        # TODO: Реализовать логику рекомендаций (например, по популярности, по подпискам)
        # Пока просто возвращаем все видео или пагинированные
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        videos = Video.query.order_by(Video.upload_date.desc()).paginate(page=page, per_page=per_page, error_out=False)
        
        video_list = []
        for video in videos.items:
            author = User.query.get(video.user_id)
            video_list.append({
                'id': video.id,
                'user_id': video.user_id,
                'username': author.username if author else 'Unknown',
                'file_url': f'/uploads/{os.path.basename(video.file_path)}', # URL для фронтенда
                'description': video.description,
                'upload_date': video.upload_date.isoformat(),
                'likes_count': video.likes_count,
                'is_liked_by_current_user': False # Пока просто заглушка, нужно дорабатывать
            })
        return jsonify({
            'videos': video_list,
            'total_pages': videos.pages,
            'current_page': videos.page,
            'has_next': videos.has_next,
            'has_prev': videos.has_prev
        }), 200

    # 5. Комментарии
    @app.route('/api/videos/<int:video_id>/comments', methods=['GET'])
    def get_comments(video_id):
        comments = Comment.query.filter_by(video_id=video_id).order_by(Comment.comment_date.asc()).all()
        comment_list = []
        for comment in comments:
            author = User.query.get(comment.user_id)
            comment_list.append({
                'id': comment.id,
                'user_id': comment.user_id,
                'username': author.username if author else 'Unknown',
                'text': comment.text,
                'comment_date': comment.comment_date.isoformat()
            })
        return jsonify({'comments': comment_list}), 200

    @app.route('/api/videos/<int:video_id>/comments', methods=['POST'])
    @token_required
    def add_comment(current_user, video_id):
        data = request.get_json()
        text = data.get('text')
        if not text:
            return jsonify({'message': 'Comment text is required'}), 400

        video = Video.query.get(video_id)
        if not video:
            return jsonify({'message': 'Video not found'}), 404

        new_comment = Comment(
            user_id=current_user.id,
            video_id=video_id,
            text=text
        )
        db.session.add(new_comment)
        db.session.commit()
        return jsonify({'message': 'Comment added successfully', 'comment_id': new_comment.id}), 201

    # 6. Лайки
    @app.route('/api/videos/<int:video_id>/like', methods=['POST'])
    @token_required
    def like_video(current_user, video_id):
        video = Video.query.get(video_id)
        if not video:
            return jsonify({'message': 'Video not found'}), 404

        existing_like = Like.query.filter_by(user_id=current_user.id, video_id=video_id).first()
        if existing_like:
            return jsonify({'message': 'Video already liked'}), 409

        new_like = Like(user_id=current_user.id, video_id=video_id)
        video.likes_count += 1 # Увеличиваем счетчик лайков
        db.session.add(new_like)
        db.session.commit()
        return jsonify({'message': 'Video liked successfully', 'likes_count': video.likes_count}), 200

    @app.route('/api/videos/<int:video_id>/unlike', methods=['POST'])
    @token_required
    def unlike_video(current_user, video_id):
        video = Video.query.get(video_id)
        if not video:
            return jsonify({'message': 'Video not found'}), 404

        existing_like = Like.query.filter_by(user_id=current_user.id, video_id=video_id).first()
        if not existing_like:
            return jsonify({'message': 'Video not liked yet'}), 409

        db.session.delete(existing_like)
        if video.likes_count > 0: # Предотвращаем отрицательные значения
            video.likes_count -= 1
        db.session.commit()
        return jsonify({'message': 'Video unliked successfully', 'likes_count': video.likes_count}), 200

    # 7. Чат
    @app.route('/api/chat/users', methods=['GET'])
    @token_required
    def get_chat_users(current_user):
        # Получаем всех пользователей, кроме текущего
        users = User.query.filter(User.id != current_user.id).all()
        # Возвращаем список пользователей с их ID и username
        return jsonify([{'id': u.id, 'username': u.username} for u in users]), 200

    @app.route('/api/chat/<int:user_id>/messages', methods=['GET'])
    @token_required
    def get_messages(current_user, user_id):
        # Получаем сообщения между текущим пользователем и user_id
        messages = Message.query.filter(
            ((Message.sender_id == current_user.id) & (Message.receiver_id == user_id)) |
            ((Message.sender_id == user_id) & (Message.receiver_id == current_user.id))
        ).order_by(Message.timestamp.asc()).all()

        message_list = []
        for msg in messages:
            sender = User.query.get(msg.sender_id) # Получаем отправителя
            receiver = User.query.get(msg.receiver_id) # Получаем получателя (для полноты)
            message_list.append({
                'id': msg.id,
                'sender_id': msg.sender_id,
                'receiver_id': msg.receiver_id,
                'sender_username': sender.username if sender else 'Unknown', # <-- КРИТИЧНОЕ ИЗМЕНЕНИЕ: Добавляем username отправителя
                'receiver_username': receiver.username if receiver else 'Unknown', # Добавляем username получателя
                'text': msg.text,
                'timestamp': msg.timestamp.isoformat()
            })
        return jsonify({'messages': message_list}), 200

    @app.route('/api/chat/<int:receiver_id>/send', methods=['POST'])
    @token_required
    def send_message(current_user, receiver_id):
        data = request.get_json()
        text = data.get('text')
        if not text:
            return jsonify({'message': 'Message text is required'}), 400

        receiver = User.query.get(receiver_id)
        if not receiver:
            return jsonify({'message': 'Receiver not found'}), 404

        new_message = Message(
            sender_id=current_user.id,
            receiver_id=receiver_id,
            text=text
        )
        db.session.add(new_message)
        db.session.commit()

        # <-- КРИТИЧНОЕ ИЗМЕНЕНИЕ: Возвращаем полный объект сообщения с username отправителя
        # Фронтенд использует этот объект для оптимистичного обновления
        return jsonify({
            'message': {
                'id': new_message.id,
                'sender_id': new_message.sender_id,
                'receiver_id': new_message.receiver_id,
                'sender_username': current_user.username, # Имя текущего пользователя (отправителя)
                'receiver_username': receiver.username, # Имя получателя
                'text': new_message.text,
                'timestamp': new_message.timestamp.isoformat()
            },
            'status': 'success'
        }), 201

    # 8. Поделиться видео
    @app.route('/api/videos/<int:video_id>/share', methods=['POST'])
    @token_required
    def share_video(current_user, video_id):
        data = request.get_json()
        receiver_id = data.get('receiver_id')

        if not receiver_id:
            return jsonify({'message': 'Receiver ID is required'}), 400

        video = Video.query.get(video_id)
        if not video:
            return jsonify({'message': 'Video not found'}), 404

        receiver = User.query.get(receiver_id)
        if not receiver:
            return jsonify({'message': 'Receiver user not found'}), 404

        # Опционально: можно добавить проверку, чтобы не делиться видео с самим собой
        if current_user.id == receiver_id:
            return jsonify({'message': 'Cannot share video with yourself'}), 400

        # TODO: Можно добавить отправку сообщения в чат с ссылкой на видео
        new_share = VideoShare(
            video_id=video_id,
            sender_id=current_user.id,
            receiver_id=receiver_id
        )
        db.session.add(new_share)
        db.session.commit()
        return jsonify({'message': f'Video shared with {receiver.username} successfully'}), 200

    return app

if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        # Инициализация базы данных и миграции
        db.create_all()
    app.run(debug=True, port=5000)