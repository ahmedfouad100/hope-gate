import axios from "axios";

// In local dev, vite.config.js proxies "/api" to the backend. In production
// (frontend and backend deployed as separate services, e.g. on Render),
// set VITE_API_URL to the backend's full URL at build time.
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("hope_gate_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("hope_gate_token");
      localStorage.removeItem("hope_gate_doctor");
    }
    return Promise.reject(error);
  }
);

export default client;
