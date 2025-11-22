import axios from 'axios';

// Get API URL from environment variable or default to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

console.log('🔧 API Client Configuration:');
console.log('  API_URL:', API_URL);
console.log('  Environment:', import.meta.env.MODE);

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important: sends httpOnly cookies with requests
  timeout: 30000, // 30 second timeout
});

// Request interceptor for debugging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  (error) => {
    console.error('❌ API Error:');
    console.error('  URL:', error.config?.url);
    console.error('  Method:', error.config?.method);
    console.error('  Status:', error.response?.status);
    console.error('  Message:', error.message);
    console.error('  Response Data:', error.response?.data);

    // Network errors
    if (!error.response) {
      console.error('❌ Network Error: No response received');
      console.error('  This could be due to:');
      console.error('  - CORS issues');
      console.error('  - Server not reachable');
      console.error('  - Timeout');
      console.error('  Error Details:', error);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
