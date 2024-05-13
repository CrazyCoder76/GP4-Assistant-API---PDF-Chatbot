import axios from 'axios';

// Create an Axios instance
const apiClient = axios.create({
});

// Request interceptor to add the auth token to requests
apiClient.interceptors.request.use(
    (config) => {
        // Assuming you store your token in localStorage or similar
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default apiClient;
