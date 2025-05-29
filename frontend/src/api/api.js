import axios from 'axios';

// Измените на IP-адрес вашего компьютера, если тестируете в локальной сети
// Например, если ваш IP 192.168.1.100, то:
const API_BASE_URL = 'http://127.0.0.1:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Добавляем перехватчик для автоматического добавления токена к запросам
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token'); // Или sessionStorage
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);


// Функции для API запросов
export const registerUser = async (userData) => {
    const response = await api.post('/register', userData);
    return response.data;
};

export const loginUser = async (credentials) => {
    const response = await api.post('/login', credentials);
    return response.data;
};

export const getProfile = async (headers) => {
    const response = await api.get('/profile', { headers });
    return response.data;
};

export const updateProfile = async (profileData, headers) => {
    const response = await api.put('/profile', profileData, { headers });
    return response.data;
};

export const uploadVideo = async (formData, headers) => { // formData будет типа FormData
    const response = await api.post('/upload', formData, {
        headers: {
            ...headers,
            'Content-Type': 'multipart/form-data', // Явно указываем для файлов
        },
    });
    return response.data;
};

export const getVideos = async (headers) => {
    const response = await api.get('/videos', { headers });
    return response.data;
};

export const getComments = async (videoId, headers) => {
    const response = await api.get(`/videos/${videoId}/comments`, { headers });
    return response.data;
};

export const addComment = async (videoId, commentData, headers) => {
    const response = await api.post(`/videos/${videoId}/comments`, commentData, { headers });
    return response.data;
};

export const likeVideo = async (videoId, headers) => {
    const response = await api.post(`/videos/${videoId}/like`, {}, { headers }); // Пустой body для POST
    return response.data;
};

export const unlikeVideo = async (videoId, headers) => {
    const response = await api.post(`/videos/${videoId}/unlike`, {}, { headers }); // Пустой body для POST
    return response.data;
};

export const getChatUsers = async (headers) => {
    const response = await api.get('/chat/users', { headers });
    return response.data;
};

export const getMessages = async (userId, headers) => {
    const response = await api.get(`/chat/${userId}/messages`, { headers });
    return response.data;
};

export const sendChatMessage = async (receiverId, messageData, headers) => {
    const response = await api.post(`/chat/${receiverId}/send`, messageData, { headers });
    return response.data;
};

export const shareVideo = async (videoId, shareData, headers) => {
    const response = await api.post(`/videos/${videoId}/share`, shareData, { headers });
    return response.data;
};