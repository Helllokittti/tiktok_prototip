import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import './Header.css';

function Header() {
    const { isAuthenticated, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/auth'); // Перенаправляем на страницу авторизации после выхода
    };

    return (
        <header className="header">
            <div className="header-left">
                <Link to="/" className="header-logo">
                    <img src="/logo.svg" alt="TikTok Logo" className="logo-icon" />
                    TikTok Clone
                </Link>
            </div>
            <div className="header-center">
                {/* Здесь может быть строка поиска*/}
                <input type="text" placeholder="Поиск..." className="search-input" />
            </div>
            <nav className="header-nav">
                <Link to="/" className="nav-item">Лента</Link>
                <Link to="/upload" className="nav-item">Загрузить</Link>
                <Link to="/chat" className="nav-item">Чат</Link>
                <Link to="/profile" className="nav-item">Профиль</Link>
                {isAuthenticated ? (
                    <button onClick={handleLogout} className="nav-item btn-primary">Выйти</button>
                ) : (
                    <>
                        <Link to="/auth" className="nav-item btn-primary">Войти</Link>
                    </>
                )}
            </nav>
        </header>
    );
}

export default Header;