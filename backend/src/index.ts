import { WebSocketServer, WebSocket } from "ws";

interface Message {
  type: string;
  payload: {
    roomId?: string;
    message?: string;
  };
}

interface User {
  socket: WebSocket;
  room: string;
}

const wss = new WebSocketServer({ port: 8080 });
let allSockets: User[] = [];

wss.on("connection", (socket) => {
  console.log("New connection established");

  socket.on("message", (rawMessage) => {
    try {
      const parsedMessage: Message = JSON.parse(rawMessage.toString());

      switch (parsedMessage.type) {
        case "join": {
          const roomId = parsedMessage.payload.roomId;
          if (roomId) {
            // Remove user from any previous room
            allSockets = allSockets.filter((u) => u.socket !== socket);

            // Add user to the new room
            allSockets.push({ socket, room: roomId });

            // Send join confirmation
            socket.send(
              JSON.stringify({
                type: "join_confirmation",
                payload: { roomId },
              })
            );
            console.log(`Socket joined room: ${roomId}`);
          } else {
            socket.send(
              JSON.stringify({
                type: "error",
                payload: { message: "Room ID is required to join a room." },
              })
            );
          }
          break;
        }

        case "chat": {
          const senderRoom = allSockets.find((u) => u.socket === socket)?.room;
        
          if (senderRoom && parsedMessage.payload.message) {
            // Broadcast the message to all users in the same room
            const roomUsers = allSockets.filter((u) => u.room === senderRoom);
            roomUsers.forEach((user) => {
              if (user.socket !== socket) {
                user.socket.send(
                  JSON.stringify({
                    type: "chat",
                    payload: { 
                      message: parsedMessage.payload.message,
                      isSelf: false  // Indicate this is not the sender's message
                    },
                  })
                );
              }
            });
        
            // Send confirmation to the sender
            socket.send(
              JSON.stringify({
                type: "chat",
                payload: { 
                  message: parsedMessage.payload.message,
                  isSelf: true  // Indicate this is the sender's message
                },
              })
            );
          }
          break;
        }

        default:
          socket.send(
            JSON.stringify({
              type: "error",
              payload: { message: "Invalid message type." },
            })
          );
          break;
      }
    } catch (error) {
      console.error("Error processing message:", error);
      socket.send(
        JSON.stringify({
          type: "error",
          payload: { message: "Failed to parse message." },
        })
      );
    }
  });

  socket.on("close", () => {
    // Remove socket when connection closes
    allSockets = allSockets.filter((u) => u.socket !== socket);
    console.log("Connection closed, user removed.");
  });

  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });
});

console.log("WebSocket server running on port 8080");
