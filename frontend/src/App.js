import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import AuthPage from './pages/AuthPage';
import FeedPage from './pages/FeedPage';
import UploadVideoPage from './pages/UploadVideoPage';
import ProfilePage from './pages/ProfilePage';
import ChatPage from './pages/ChatPage';
import { AuthProvider } from './contexts/AuthContext'; // Импортируем AuthProvider

import './App.css'; // Общие стили приложения
import './index.css'; // Убедитесь, что этот файл подключен в index.js, если его нет здесь

function App() {
  return (
    <Router>
      <AuthProvider> {/* Оборачиваем все приложение в AuthProvider */}
        <div className="app-container">
          <Header />
          <main className="app-main-content">
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/" element={<FeedPage />} />
              <Route path="/upload" element={<UploadVideoPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/chat" element={<ChatPage />} />
              {/* Добавьте другие маршруты по мере необходимости */}
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;