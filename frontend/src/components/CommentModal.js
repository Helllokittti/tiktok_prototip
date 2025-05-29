// src/components/CommentModal.js
import React, { useState, useEffect, useContext } from 'react';
import { getComments, addComment } from '../api/api';
import { AuthContext } from '../contexts/AuthContext';
import './CommentModal.css';

function CommentModal({ videoId, onClose, onCommentAdded }) {
    const [comments, setComments] = useState([]);
    const [newCommentText, setNewCommentText] = useState('');
    const [loadingComments, setLoadingComments] = useState(true);
    const [errorComments, setErrorComments] = useState('');
    const { user } = useContext(AuthContext);

    const fetchComments = async () => {
        setLoadingComments(true);
        setErrorComments('');
        try {
            const response = await getComments(videoId);
            setComments(response.comments || []);
        } catch (error) {
            console.error('Ошибка получения комментариев:', error);
            setErrorComments('Не удалось загрузить комментарии.');
        } finally {
            setLoadingComments(false);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [videoId]);

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newCommentText.trim()) return;

        try {
            const response = await addComment(videoId, { text: newCommentText });
            if (response.comment) {
                setComments(prevComments => [...prevComments, response.comment]);
            } else {
                await fetchComments();
            }
            setNewCommentText('');
            if (onCommentAdded) {
                onCommentAdded();
            }
        } catch (error) {
            console.error('Ошибка добавления комментария:', error);
            if (error.response && error.response.status === 401) {
                 alert('Вы не авторизованы для добавления комментариев. Пожалуйста, войдите.');
            } else {
                 alert('Не удалось добавить комментарий. Пожалуйста, попробуйте позже.');
            }
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h3>Комментарии</h3>
                {/* Изменено: крестик вместо текста "Закрыть" */}
                <button onClick={onClose} className="close-modal-button">
                    &times;
                </button>

                <div className="comments-list">
                    {loadingComments ? (
                        <p>Загрузка комментариев...</p>
                    ) : errorComments ? (
                        <p className="error-message">{errorComments}</p>
                    ) : comments.length === 0 ? (
                        <p>Пока нет комментариев.</p>
                    ) : (
                        comments.map((comment) => (
                            <div key={comment.id} className="comment-item">
                                <div className="comment-header">
                                    <strong>@{comment.username}</strong>
                                    <small>{new Date(comment.comment_date).toLocaleString()}</small>
                                </div>
                                <p className="comment-text">{comment.text}</p>
                            </div>
                        ))
                    )}
                </div>
                {user ? (
                    <form onSubmit={handleAddComment} className="comment-form">
                        <textarea
                            placeholder="Оставьте комментарий..."
                            value={newCommentText}
                            onChange={(e) => setNewCommentText(e.target.value)}
                            rows="3"
                        ></textarea>
                        <button type="submit">Отправить</button>
                    </form>
                ) : (
                    <p className="auth-message">Для добавления комментариев, пожалуйста, авторизуйтесь.</p>
                )}
            </div>
        </div>
    );
}

export default CommentModal;