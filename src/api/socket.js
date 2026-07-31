import { io } from "socket.io-client";

let socket = null;

// Single shared connection; components join/leave rooms as needed.
export function getSocket(token) {
  if (!socket) {
    socket = io("/", {
      path: "/socket.io",
      auth: token ? { token } : {},
      autoConnect: true,
    });
  }
  return socket;
}
