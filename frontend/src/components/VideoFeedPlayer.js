// src/components/VideoFeedPlayer.js
import React from 'react';
import PropTypes from 'prop-types';
import './VideoFeedPlayer.css';

function VideoFeedPlayer({
    video,
    onLikeToggle,
    onCommentClick,
    onShareClick,
    isCurrentUserVideo, // Этот пропс пока не используется в JSX, но оставлен для возможного будущего использования
    onNextVideo,
    onPrevVideo,
    hasMoreVideos,
    hasPrevVideos
}) {
    // Если объект video не передан, отображаем сообщение
    if (!video) {
        return <div className="video-player-container"><p>Видео не найдено.</p></div>;
    }

    // Формируем полный URL для видеофайла
    const videoUrl = `http://127.0.0.1:5000${video.file_url}`;

    return (
        <div className="video-feed-player-wrapper">
            <div className="video-player-container">
                {/* Элемент <video> для воспроизведения видео */}
                <video controls autoPlay loop className="video-player" src={videoUrl}></video>

                {/* Боковая панель с кнопками действий (лайк, комментарии, поделиться) */}
                <div className="video-actions-sidebar">
                    <button
                        className={`action-button like-button ${video.is_liked_by_current_user ? 'liked' : ''}`}
                        onClick={() => onLikeToggle(video.id, video.is_liked_by_current_user)}
                        title={video.is_liked_by_current_user ? 'Дизлайк' : 'Лайк'}
                    >
                        ❤️
                        <span>{video.likes_count}</span>
                    </button>
                    <button
                        className="action-button comment-button"
                        onClick={() => onCommentClick(video.id)}
                        title="Комментарии"
                    >
                        💬
                        <span>{video.comments_count || 0}</span>
                    </button>
                    <button
                        className="action-button share-button"
                        onClick={() => onShareClick(video.id)}
                        title="Поделиться"
                    >
                        ↪️
                    </button>
                </div>

                {/* Наложение с информацией о видео (пользователь и описание) */}
                <div className="video-info-overlay">
                    <p className="video-meta">
                        <span className="video-username">@{video.username}</span>
                        <span className="video-description-inline">{video.description}</span>
                    </p>
                </div>
            </div>

            {/* Стрелки навигации для переключения видео */}
            <div className="video-navigation-arrows">
                <button
                    className="nav-arrow up-arrow"
                    onClick={onPrevVideo}
                    disabled={!hasPrevVideos}
                    title="Предыдущее видео"
                >
                    ▲
                </button>
                <button
                    className="nav-arrow down-arrow"
                    onClick={onNextVideo}
                    disabled={!hasMoreVideos}
                    title="Следующее видео"
                >
                    ▼
                </button>
            </div>
        </div>
    );
}

// Определение PropTypes для пропсов компонента для лучшей проверки типов
VideoFeedPlayer.propTypes = {
    video: PropTypes.object, // Объект, содержащий данные о видео
    onLikeToggle: PropTypes.func.isRequired, // Функция для обработки лайков/дизлайков
    onCommentClick: PropTypes.func.isRequired, // Функция для открытия модалки комментариев
    onShareClick: PropTypes.func.isRequired, // Функция для обработки действия "поделиться"
    isCurrentUserVideo: PropTypes.bool, // Флаг, является ли видео текущего пользователя
    onNextVideo: PropTypes.func.isRequired, // Функция для перехода к следующему видео
    onPrevVideo: PropTypes.func.isRequired, // Функция для перехода к предыдущему видео
    hasMoreVideos: PropTypes.bool.isRequired, // Флаг, есть ли еще видео для загрузки вперед
    hasPrevVideos: PropTypes.bool.isRequired // Флаг, есть ли предыдущие видео для просмотра
};

export default VideoFeedPlayer;