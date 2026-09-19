import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";

declare module "axios" {
  // Same type parameter as axios' own declaration (required for the merge).
  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  interface AxiosRequestConfig<D = any> {
    /**
     * A 401 on this request does not end the session. For optional background reads
     * (e.g. GET /admin/me) whose route may still be missing on an older backend; a real
     * invalid/expired token is still caught by the other requests.
     */
    skipAuthRedirect?: boolean;
  }
}

const baseURL = import.meta.env.VITE_BASE_URL ?? "https://api.example.com";

const axiosClient: AxiosInstance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});


axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);


axiosClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && !error.config?.skipAuthRedirect) {
      localStorage.removeItem("token"); 
      window.location.href = "/signin"; 
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
