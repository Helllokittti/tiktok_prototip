import React, { useState, useEffect, useContext } from 'react';
import { getProfile, updateProfile } from '../api/api';
import { AuthContext } from '../contexts/AuthContext';
import './ProfilePage.css';

function ProfilePage() {
    const { isAuthenticated, user, token } = useContext(AuthContext);
    const [profileData, setProfileData] = useState(null);
    const [bio, setBio] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            if (!isAuthenticated || !token) {
                setError('Вы не авторизованы.');
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const headers = { Authorization: `Bearer ${token}` };
                const response = await getProfile(headers);
                setProfileData(response);
                setBio(response.bio || ''); // Устанавливаем текущее био
            } catch (err) {
                console.error('Ошибка при загрузке профиля:', err);
                setError(err.response?.data?.message || 'Не удалось загрузить данные профиля.');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [isAuthenticated, token]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        if (!isAuthenticated || !token) {
            setError('Вы не авторизованы.');
            return;
        }

        try {
            setLoading(true);
            const headers = { Authorization: `Bearer ${token}` };
            await updateProfile({ bio }, headers);
            setMessage('Профиль успешно обновлен!');
        } catch (err) {
            console.error('Ошибка при обновлении профиля:', err);
            setError(err.response?.data?.message || 'Не удалось обновить профиль.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="profile-container"><p>Загрузка профиля...</p></div>;
    }

    if (error) {
        return <div className="profile-container"><p className="error-message">{error}</p></div>;
    }

    if (!profileData) {
        return <div className="profile-container"><p>Данные профиля не найдены.</p></div>;
    }

    return (
        <div className="profile-container">
            <h2>Мой профиль</h2>
            {message && <p className="success-message">{message}</p>}
            {error && <p className="error-message">{error}</p>}

            <div className="profile-info">
                <img src={profileData.profile_picture || '/default_profile.png'} alt="Profile" className="profile-picture" />
                <p><strong>Имя пользователя:</strong> {profileData.username}</p>
                <p><strong>Email:</strong> {profileData.email}</p>
            </div>

            <form onSubmit={handleUpdateProfile} className="profile-form">
                <div className="form-group">
                    <label htmlFor="bio">О себе:</label>
                    <textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Расскажите что-нибудь о себе..."
                        rows="4"
                        className="textarea-field"
                    ></textarea>
                </div>
                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Сохранение...' : 'Сохранить изменения'}
                </button>
            </form>
        </div>
    );
}

export default ProfilePage;