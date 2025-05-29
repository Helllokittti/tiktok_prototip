// src/pages/FeedPage.js
import React, { useEffect, useState, useContext, useCallback, useRef } from 'react';
import { getVideos, likeVideo, unlikeVideo, shareVideo } from '../api/api';
import { AuthContext } from '../contexts/AuthContext';
import VideoFeedPlayer from '../components/VideoFeedPlayer';
import CommentModal from '../components/CommentModal';
import './FeedPage.css';

const VIDEO_LOAD_LIMIT = 5;

function FeedPage() {
    const [videos, setVideos] = useState([]);
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
    const [selectedVideoIdForComments, setSelectedVideoIdForComments] = useState(null);

    const { isAuthenticated, token } = useContext(AuthContext);

    const loadingRef = useRef(false);

    const fetchVideos = useCallback(async () => {
        if (loadingRef.current || !hasMore) return;

        loadingRef.current = true;
        setLoading(true);
        setError('');

        try {
            const response = await getVideos(page, VIDEO_LOAD_LIMIT);

            if (response.videos && response.videos.length > 0) {
                setVideos(prevVideos => [...prevVideos, ...response.videos]);
                setPage(prevPage => prevPage + 1);
                setHasMore(response.has_more !== undefined ? response.has_more : response.videos.length === VIDEO_LOAD_LIMIT);
            } else {
                setHasMore(false);
            }
        } catch (err) {
            console.error('Ошибка при загрузке видео:', err);
            setError('Не удалось загрузить видео. Пожалуйста, попробуйте позже.');
            setHasMore(false);
        } finally {
            setLoading(false);
            loadingRef.current = false;
        }
    }, [page, hasMore]);

    useEffect(() => {
        fetchVideos();
    }, [fetchVideos]);

    const handleLikeToggle = async (videoId, isLiked) => {
        if (!isAuthenticated) {
            alert('Пожалуйста, войдите, чтобы поставить лайк.');
            return;
        }
        try {
            setVideos(prevVideos =>
                prevVideos.map(video => {
                    if (video.id === videoId) {
                        const newLikesCount = isLiked ? video.likes_count - 1 : video.likes_count + 1;
                        return {
                            ...video,
                            likes_count: newLikesCount,
                            is_liked_by_current_user: !isLiked
                        };
                    }
                    return video;
                })
            );

            if (isLiked) {
                await unlikeVideo(videoId);
            } else {
                await likeVideo(videoId);
            }
        } catch (error) {
            console.error('Ошибка при изменении лайка:', error);
            alert('Не удалось изменить лайк. Попробуйте снова.');
        }
    };

    const handleCommentClick = (videoId) => {
        if (!isAuthenticated) {
            alert('Пожалуйста, войдите, чтобы комментировать.');
            return;
        }
        setSelectedVideoIdForComments(videoId);
        setIsCommentModalOpen(true);
    };

    const handleCloseCommentModal = () => {
        setIsCommentModalOpen(false);
        setSelectedVideoIdForComments(null);
    };

    const handleCommentAdded = () => {
        setVideos(prevVideos =>
            prevVideos.map(video =>
                video.id === selectedVideoIdForComments
                    ? { ...video, comments_count: (video.comments_count || 0) + 1 }
                    : video
            )
        );
    };

    const handleShareClick = async (videoId) => {
        if (!isAuthenticated) {
            alert('Пожалуйста, войдите, чтобы поделиться видео.');
            return;
        }
        alert('Функция "Поделиться" пока в разработке. (Скопируйте ссылку или выберите пользователя)');
    };

    const goToNextVideo = () => {
        if (currentVideoIndex < videos.length - 1) {
            setCurrentVideoIndex(prevIndex => prevIndex + 1);
            if (currentVideoIndex >= videos.length - (VIDEO_LOAD_LIMIT / 2) && hasMore) {
                fetchVideos();
            }
        }
    };

    const goToPreviousVideo = () => {
        if (currentVideoIndex > 0) {
            setCurrentVideoIndex(prevIndex => prevIndex - 1);
        }
    };

    if (loading && videos.length === 0) {
        return <div className="feed-page-container"><p>Загрузка видео...</p></div>;
    }

    if (error) {
        return <div className="feed-page-container"><p className="error-message">{error}</p></div>;
    }

    if (videos.length === 0 && !loading && !error) {
        return <div className="feed-page-container"><p>Видео пока нет. Загрузите свое первое видео!</p></div>;
    }

    const currentVideo = videos[currentVideoIndex];

    return (
        <div className="feed-page-container">
            {currentVideo ? (
                <VideoFeedPlayer
                    video={currentVideo}
                    onLikeToggle={handleLikeToggle}
                    onCommentClick={handleCommentClick}
                    onShareClick={handleShareClick}
                    isCurrentUserVideo={false}
                    onNextVideo={goToNextVideo}
                    onPrevVideo={goToPreviousVideo}
                    hasMoreVideos={currentVideoIndex < videos.length - 1 || hasMore}
                    hasPrevVideos={currentVideoIndex > 0}
                />
            ) : (
                <p>Загрузка видео...</p>
            )}

            {isCommentModalOpen && (
                <CommentModal
                    videoId={selectedVideoIdForComments}
                    onClose={handleCloseCommentModal}
                    onCommentAdded={handleCommentAdded} // Убран комментарий внутри JSX
                />
            )}
        </div>
    );
}

export default FeedPage;