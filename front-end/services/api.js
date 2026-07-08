import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001/api",
  withCredentials: true,
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ================= REQUEST =================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ================= RESPONSE =================
api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response?.status === 401) {
      // Token hết hạn hoặc không hợp lệ
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Chuyển về trang đăng nhập
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;
