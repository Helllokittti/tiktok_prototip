import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'you-will-never-guess'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
                                'postgresql://tiktok_user:84yy84vv@localhost:5432/tiktok_clone'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    UPLOAD_FOLDER = 'uploads' # Папка для загруженных видео
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024 # Максимальный размер файла (16MB)