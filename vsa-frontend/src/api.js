import axios from 'axios';

// In production, call the backend project directly; in dev, use local or env base URL
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://vsa-website.vercel.app'
  : (process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001').replace(/\/$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
  // You can add headers here if needed
});

export default api; 