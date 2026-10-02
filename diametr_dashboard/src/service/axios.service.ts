import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { endSession } from "./session";

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
    // Server messages (validation, errors) in the panel's language, not the browser's.
    if (config.headers) {
      config.headers["Accept-Language"] =
        localStorage.getItem("diametr_admin_lang") === "ru" ? "ru" : "uz";
    }
    return config;
  },
  (error) => Promise.reject(error)
);


/**
 * The 401 belongs to the stored session: the request carried a token and it is
 * still the stored one (or the session is already being cleared). A 401 for a
 * request made with an older token (signed in again meanwhile) is left alone.
 */
function isCurrentSession(error: AxiosError): boolean {
  const header = String(error.config?.headers?.Authorization ?? "");
  if (!header.startsWith("Bearer ")) return false;
  const stored = localStorage.getItem("token");
  return !stored || header === `Bearer ${stored}`;
}

axiosClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && isCurrentSession(error)) {
      endSession(true);
      // The page is leaving for /signin: keep the caller pending so it shows
      // no error toast of its own (the sign-in page explains what happened).
      return new Promise(() => {});
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
