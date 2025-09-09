import { Server } from 'socket.io';
import http from 'http';
export function createSocket(server: http.Server){
  const io = new Server(server, { cors: { origin: process.env.SERVER_ORIGIN?.split(',') || '*' } });
  io.on('connection', socket=>{
    socket.on('join', (matchId:string)=> socket.join(matchId));
  });
  return io;
}
