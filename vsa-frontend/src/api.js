import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001';
const endpoint = '/api/auth/me';
const url = `${API_BASE_URL.replace(/\/$/, '')}${endpoint}`;

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001', // fallback for local dev
  // You can add headers here if needed
});

export default api; 