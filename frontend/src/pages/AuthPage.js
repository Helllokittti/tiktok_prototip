import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser, loginUser } from '../api/api';
import { AuthContext } from '../contexts/AuthContext';
import './AuthPage.css';

function AuthPage() {
    const [isRegister, setIsRegister] = useState(false);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const navigate = useNavigate();
    const { login } = useContext(AuthContext); // Получаем функцию login из контекста

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); // Сброс ошибок
        setSuccessMessage(''); // Сброс сообщений об успехе

        try {
            if (isRegister) {
                await registerUser({ username, email, password });
                setSuccessMessage('Регистрация успешна! Теперь вы можете войти.');
                setIsRegister(false); // После регистрации переключаем на вход
            } else {
                const data = await loginUser({ username, password });
                login(data.token, data.user); // Сохраняем токен и данные пользователя
                setSuccessMessage('Вход выполнен успешно!');
                navigate('/'); // Перенаправляем на ленту после успешного входа
            }
        } catch (err) {
            console.error('Ошибка:', err);
            setError(err.response?.data?.message || 'Произошла ошибка. Пожалуйста, попробуйте еще раз.');
        }
    };

    return (
        <div className="auth-container">
            <form onSubmit={handleSubmit} className="auth-form">
                <h2>{isRegister ? 'Регистрация' : 'Вход'}</h2>
                {error && <p className="error-message">{error}</p>}
                {successMessage && <p className="success-message">{successMessage}</p>}

                <div className="form-group">
                    <label htmlFor="username">Имя пользователя:</label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="input-field"
                    />
                </div>
                {isRegister && (
                    <div className="form-group">
                        <label htmlFor="email">Email:</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="input-field"
                        />
                    </div>
                )}
                <div className="form-group">
                    <label htmlFor="password">Пароль:</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="input-field"
                    />
                </div>
                <button type="submit" className="auth-button btn-primary">
                    {isRegister ? 'Зарегистрироваться' : 'Войти'}
                </button>
                <p className="toggle-link" onClick={() => setIsRegister(!isRegister)}>
                    {isRegister ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
                </p>
            </form>
        </div>
    );
}

export default AuthPage;