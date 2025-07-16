import axios from 'axios';

// For Vercel deployment, use relative URLs to avoid CORS issues
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : (process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001').replace(/\/$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
  // You can add headers here if needed
});

export default api; 