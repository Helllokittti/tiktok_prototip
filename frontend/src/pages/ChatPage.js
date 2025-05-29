// frontend/src/pages/ChatPage.js

import React, { useEffect, useState, useContext, useRef, useCallback } from 'react';

import { AuthContext } from '../contexts/AuthContext';

import { getChatUsers, getMessages, sendChatMessage } from '../api/api';

import './ChatPage.css'; // Убедитесь, что этот CSS-файл существует и содержит нужные стили



function ChatPage() {

    const { user, isAuthenticated } = useContext(AuthContext);



    const [availableUsers, setAvailableUsers] = useState([]);

    const [selectedChatUser, setSelectedChatUser] = useState(null);

    const [messages, setMessages] = useState([]);

    const [newMessage, setNewMessage] = useState('');



    const [loadingUsers, setLoadingUsers] = useState(true);

    const [loadingMessages, setLoadingMessages] = useState(false);

    const [error, setError] = useState('');



    const messagesEndRef = useRef(null); // Ref для прокрутки к последнему сообщению



    // --- ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ ФОРМАТИРОВАНИЯ ДАТЫ ---

    const formatMessageTimestamp = useCallback((timestampString) => {

        try {

            const date = new Date(timestampString);

            if (isNaN(date.getTime())) {

                return 'Invalid Date';

            }

            const today = new Date();

            if (date.toLocaleDateString() === today.toLocaleDateString()) {

                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

            } else {

                return date.toLocaleString([], {

                    year: 'numeric', month: '2-digit', day: '2-digit',

                    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false

                });

            }

        } catch (e) {

            console.error("Ошибка форматирования timestamp:", e, timestampString);

            return 'Invalid Date';

        }

    }, []);



    // --- Функция для загрузки сообщений конкретной беседы ---

    const fetchConversationMessages = useCallback(async () => {

        if (!selectedChatUser) {

            setMessages([]);

            return;

        }

        setLoadingMessages(true);

        setError('');

        try {

            const response = await getMessages(selectedChatUser.id);

            if (response && Array.isArray(response.messages)) {

                // Добавляем sender_username к сообщениям, если его нет,

                // используя информацию о пользователях, если это возможно.

                // В идеале, бэкенд должен возвращать sender_username.

                const messagesWithUsernames = response.messages.map(msg => {

                    let senderUsername = 'Неизвестно'; // Значение по умолчанию

                    if (msg.sender_id === user?.id) {

                        senderUsername = user.username;

                    } else if (msg.sender_id === selectedChatUser.id) {

                        senderUsername = selectedChatUser.username;

                    } else {

                        // Если есть другие пользователи в чате, их имена нужно будет получить дополнительно.

                        // Пока что, для 1-на-1 чата, этого достаточно.

                        const foundUser = availableUsers.find(u => u.id === msg.sender_id);

                        if (foundUser) {

                            senderUsername = foundUser.username;

                        }

                    }

                    return { ...msg, sender_username: senderUsername };

                });

                setMessages(messagesWithUsernames);

            } else {

                console.error("Неожиданный формат ответа при получении сообщений:", response);

                setError("Не удалось загрузить сообщения: некорректный формат данных.");

                setMessages([]);

            }

        } catch (err) {

            console.error("Ошибка загрузки сообщений чата:", err);

            setError("Не удалось загрузить сообщения.");

        } finally {

            setLoadingMessages(false);

        }

    }, [selectedChatUser, user, availableUsers]); // Добавил user и availableUsers в зависимости



    // --- useEffect для загрузки доступных пользователей для чата ---

    useEffect(() => {

        const fetchAvailableUsers = async () => {

            if (!isAuthenticated) {

                setAvailableUsers([]);

                setLoadingUsers(false);

                return;

            }

            setLoadingUsers(true);

            setError('');

            try {

                const response = await getChatUsers();

                let usersToSet = [];

                if (response && Array.isArray(response.users)) {

                    usersToSet = response.users;

                } else if (response && Array.isArray(response)) {

                    usersToSet = response;

                } else {

                    console.error("Неожиданная структура ответа от API пользователей:", response);

                    setError("Не удалось загрузить список пользователей: некорректный формат данных.");

                    setAvailableUsers([]);

                    setLoadingUsers(false);

                    return;

                }



                // Filter out the current authenticated user from the chat list

                const filteredUsers = usersToSet.filter(u => u.id !== user?.id);

                setAvailableUsers(filteredUsers);



                // Auto-select the first user if no one is selected, or if the selected user is no longer available

                if (selectedChatUser && !filteredUsers.some(u => u.id === selectedChatUser.id)) {

                    setSelectedChatUser(null);

                    setMessages([]);

                } else if (filteredUsers.length > 0 && !selectedChatUser) {

                    setSelectedChatUser(filteredUsers[0]);

                } else if (filteredUsers.length === 0) {

                    setSelectedChatUser(null);

                    setMessages([]);

                }



            } catch (err) {

                console.error("Ошибка загрузки пользователей для чата:", err);

                setError("Не удалось загрузить список пользователей для чата.");

                setAvailableUsers([]);

            } finally {

                setLoadingUsers(false);

            }

        };

        fetchAvailableUsers();

    }, [isAuthenticated, user, selectedChatUser]); // selectedChatUser добавлен, чтобы перепроверить, если выбранный пользователь пропал



    // --- useEffect для загрузки сообщений при смене выбранного пользователя ---

    useEffect(() => {

        fetchConversationMessages();

    }, [fetchConversationMessages]);



    // --- useEffect для автоматической прокрутки к последнему сообщению ---

    useEffect(() => {

        if (messagesEndRef.current) {

            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });

        }

    }, [messages]);



    // --- Обработчик отправки сообщения ---

    const handleSendMessage = async (e) => {

        e.preventDefault();

        if (newMessage.trim() === '' || !selectedChatUser) return;



        let tempMessage;

        try {

            tempMessage = {

                id: 'temp-' + Date.now() + Math.random().toString(36).substring(2, 9),

                sender_id: user?.id,

                sender_username: user ? user.username : 'You', // Добавляем имя отправителя для оптимистичного UI

                text: newMessage,

                timestamp: new Date().toISOString(),

                isTemp: true

            };

            setMessages(prevMessages => [...prevMessages, tempMessage]);

            setNewMessage('');



            const response = await sendChatMessage(selectedChatUser.id, { text: tempMessage.text });



            if (response && response.message && typeof response.message === 'object') {

                // Если сервер вернул полное сообщение, используем его

                const confirmedMessage = {

                    ...response.message,

                    sender_username: user ? user.username : 'You', // Убедимся, что имя отправителя есть

                    isTemp: false

                };

                setMessages(prevMessages =>

                    prevMessages.map(msg =>

                        msg.id === tempMessage.id && msg.isTemp ? confirmedMessage : msg

                    )

                );

            } else {

                console.warn("Сервер не вернул ожидаемый объект сообщения. Откат и перезагрузка.", response);

                if (tempMessage) {

                    setMessages(prevMessages => prevMessages.filter(msg => msg.id !== tempMessage.id));

                }

                // При ошибке или неожиданном формате ответа, лучше перезагрузить сообщения, чтобы синхронизироваться с сервером

                await fetchConversationMessages();

            }

        } catch (err) {

            console.error("Ошибка отправки сообщения:", err);

            setError("Не удалось отправить сообщение.");

            if (tempMessage) {

                setMessages(prevMessages => prevMessages.filter(msg => msg.id !== tempMessage.id));

            }

            // Также перезагружаем сообщения при ошибке отправки

            await fetchConversationMessages();

        }

    };



    if (!isAuthenticated) {

        return <div className="chat-page-wrapper"><p style={{textAlign: 'center', padding: '20px'}}>Пожалуйста, войдите, чтобы получить доступ к чату.</p></div>;

    }



    if (loadingUsers) {

        return <div className="chat-page-wrapper"><p style={{textAlign: 'center', padding: '20px'}}>Загрузка пользователей для чата...</p></div>;

    }



    if (error && availableUsers.length === 0 && !selectedChatUser) {

        return <div className="chat-page-wrapper"><p className="error-message">{error}</p></div>;

    }



    return (

        <div className="chat-page-wrapper">

            <div className="chat-sidebar">

                <h3>Чаты</h3>

                <div className="chat-users-list">

                    {availableUsers.length === 0 && !loadingUsers ? (

                        <p style={{textAlign: 'center', color: '#888'}}>Нет доступных пользователей для чата.</p>

                    ) : (

                        availableUsers.map(chatUser => (

                            <div

                                key={chatUser.id}

                                className={`chat-user-item ${selectedChatUser?.id === chatUser.id ? 'active' : ''}`}

                                onClick={() => setSelectedChatUser(chatUser)}

                            >

                                @{chatUser.username}

                            </div>

                        ))

                    )}

                </div>

            </div>



            <div className="chat-main-area">

                {selectedChatUser ? (

                    <>

                        <h3>Чат с @{selectedChatUser.username}</h3>

                        <div className="messages-scroll-area">

                            <div className="messages-list">

                                {loadingMessages ? (

                                    <p className="loading-messages">Загрузка сообщений...</p>

                                ) : error && messages.length === 0 ? (

                                    <p className="error-message" style={{textAlign:'center'}}>{error}</p>

                                ) : messages.length === 0 ? (

                                    <p className="no-messages">Начните общение с @{selectedChatUser.username}!</p>

                                ) : (

                                    messages.map(msg => (

                                        <div

                                            key={msg.id}

                                            // !!! ИЗМЕНЕНИЕ ЗДЕСЬ: Сравниваем sender_id с user?.id

                                            className={`message-item ${msg.sender_id === user?.id ? 'my-message' : 'other-message'}`}

                                            style={msg.isTemp ? { opacity: 0.7 } : {}} // Стиль для временных сообщений

                                        >

                                            {/* Отображаем имя отправителя только для чужих сообщений */}

                                            {/* msg.sender_username должен быть заполнен в fetchConversationMessages или получен с бэкенда */}

                                            {msg.sender_id !== user?.id && (

                                                <span className="message-sender">@{msg.sender_username || selectedChatUser.username || 'Неизвестный'}</span>

                                            )}

                                            <span className="message-text">{msg.text}</span>

                                            <span className="message-timestamp">{formatMessageTimestamp(msg.timestamp)}</span>

                                        </div>

                                    ))

                                )}

                                <div ref={messagesEndRef} />

                            </div>

                        </div>

                        <form onSubmit={handleSendMessage} className="message-form">

                            <input

                                type="text"

                                placeholder="Введите ваше сообщение..."

                                value={newMessage}

                                onChange={(e) => setNewMessage(e.target.value)}

                                disabled={loadingMessages || !isAuthenticated || !selectedChatUser}

                            />

                            <button type="submit" disabled={loadingMessages || !isAuthenticated || !selectedChatUser || newMessage.trim() === ''}>Отправить</button>

                        </form>

                    </>

                ) : (

                    <div className="no-chat-selected">

                        <h3>Выберите чат</h3>

                        <p>Выберите пользователя из списка слева, чтобы начать общение.</p>

                        {error && <p className="error-message" style={{marginTop: '10px'}}>{error}</p>}

                    </div>

                )}

            </div>

        </div>

    );

}



export default ChatPage;