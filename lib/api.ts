import axios, { type AxiosInstance } from "axios";

const baseURL = typeof window !== "undefined" ? "" : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const $axios: AxiosInstance = axios.create({
  baseURL: `${baseURL}/api`,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});
