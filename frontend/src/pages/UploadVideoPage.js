import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadVideo } from '../api/api';
import { AuthContext } from '../contexts/AuthContext';
import './UploadVideoPage.css'; // Создайте этот файл для стилей UploadVideoPage

function UploadVideoPage() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const navigate = useNavigate();
    const { token } = useContext(AuthContext); // Получаем токен из контекста

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (!selectedFile) {
            setError('Пожалуйста, выберите видеофайл для загрузки.');
            return;
        }

        if (!token) {
            setError('Вы не авторизованы. Пожалуйста, войдите, чтобы загрузить видео.');
            navigate('/auth'); // Перенаправляем на авторизацию
            return;
        }

        const formData = new FormData();
        formData.append('video', selectedFile);
        formData.append('description', description);

        try {
            setLoading(true);
            const headers = {
                'Authorization': `Bearer ${token}`,
                // 'Content-Type': 'multipart/form-data' // Axios автоматически установит Content-Type
            };
            await uploadVideo(formData, headers);
            setSuccessMessage('Видео успешно загружено!');
            setSelectedFile(null); // Очищаем форму
            setDescription('');
            // Можно перенаправить на ленту после успешной загрузки
            // navigate('/');
        } catch (err) {
            console.error('Ошибка при загрузке видео:', err);
            setError(err.response?.data?.message || 'Ошибка загрузки видео. Пожалуйста, попробуйте еще раз.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="upload-container">
            <h2>Загрузить видео</h2>
            <form onSubmit={handleSubmit} className="upload-form">
                {error && <p className="error-message">{error}</p>}
                {successMessage && <p className="success-message">{successMessage}</p>}

                <div className="form-group">
                    <label htmlFor="videoFile">Выберите видео:</label>
                    <input
                        type="file"
                        id="videoFile"
                        accept="video/*"
                        onChange={handleFileChange}
                        className="file-input"
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="description">Описание видео:</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Добавьте описание к видео..."
                        rows="4"
                        className="textarea-field"
                    ></textarea>
                </div>
                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Загрузка...' : 'Загрузить видео'}
                </button>
            </form>
        </div>
    );
}

export default UploadVideoPage;