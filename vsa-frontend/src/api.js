import axios from 'axios';
import { supabase } from './supabaseClient';

// In production, call the backend project directly; in dev, use local or env base URL
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://vsa-website.vercel.app'
  : (process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001').replace(/\/$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
  // You can add headers here if needed
});

// Attach Supabase access token to every request if available
api.interceptors.request.use(async (config) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (token) {
      config.headers = config.headers || {};
      if (!config.headers.Authorization && !config.headers.authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch (e) {
    // noop
  }
  return config;
});

export default api; 