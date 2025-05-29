import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);

    // Загрузка токена из localStorage при инициализации приложения
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            try {
                const decodedToken = jwtDecode(storedToken);
                // Проверяем срок действия токена
                if (decodedToken.exp * 1000 > Date.now()) { // exp в секундах, Date.now() в мс
                    setToken(storedToken);
                    setIsAuthenticated(true);
                    // Дополнительно можно получить информацию о пользователе из токена или из localStorage
                    setUser({ id: decodedToken.user_id, username: decodedToken.username });
                } else {
                    // Токен просрочен
                    localStorage.removeItem('token');
                }
            } catch (e) {
                console.error("Ошибка декодирования токена:", e);
                localStorage.removeItem('token');
            }
        }
    }, []);

    const login = (newToken, userData) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setIsAuthenticated(true);
        // Сохраняем user data, которое приходит при входе
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setIsAuthenticated(false);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};