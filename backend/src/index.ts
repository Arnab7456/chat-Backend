import { WebSocketServer, WebSocket } from "ws";

const wss = new WebSocketServer({ port: 8080 });
interface User{
    socket : WebSocket
    room : string
}

let allSockets: User[] = [];

wss.on("connection", (socket) => {
  socket.on("message", (message) => {
    // @ts-ignore
    const parsedMessage = JSON.parse(message);

    if (parsedMessage.type === "join") {
      allSockets.push({
        socket,
        room: parsedMessage.payload.roomId,
      });
    }

    if (parsedMessage.type === "chat") {
      let currentUserRoom = null;

      for (let i = 0; i < allSockets.length; i++) {
        if (allSockets[i].socket === socket) {
          currentUserRoom = allSockets[i].room;
          break;
        }
      }

      for (let i = 0; i < allSockets.length; i++) {
        if (allSockets[i].room === currentUserRoom) {
          allSockets[i].socket.send(parsedMessage.payload.message);
        }
      }
    }
  });
});
// let userCount =0;
// let allSockets: WebSocket[] = [];

// wss.on("connection", (socket)=>{
    
//     console.log("user connected");
//     allSockets.push(socket);
//     userCount++;
//     console.log("user counted #", userCount);

//     socket.on("message", (message)=>{
//         console.log("message recived" + message.toString());
//         for  (let i = 0; i < allSockets.length; i++) {
//             const s  = allSockets[i];
//             s.send(message.toString() + ": set from the server");
//         }

//         socket.on("disconnected", ()=>{
//             allSockets = allSockets.filter(x =>x !=socket)
//         })

//         // setTimeout(()=>{
//         //     socket.send(message.toString() + "send to server");
//         // },1000)
//     })
// })
