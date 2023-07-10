import axios from "axios";

const server = axios.create({
  //baseURL: "http://localhost:3042",
  //baseURL: "http://192.168.1.30:3042",
  baseURL: import.meta.env.VITE_BASE_URL,
});

export default server;
