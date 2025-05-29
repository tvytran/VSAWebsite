import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001', // fallback for local dev
  // You can add headers here if needed
});

export default api; 