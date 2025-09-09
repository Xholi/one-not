import { Server } from "socket.io";
import type { Server as HttpServer } from "http";

export function createSocket(server: HttpServer) {
  const io = new Server(server, { cors: { origin: process.env.SERVER_ORIGIN?.split(",") || "*" } });
  io.on("connection", (socket) => {
    socket.on("join", (matchId: string) => socket.join(matchId));
  });
  return io;
}
