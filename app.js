const express = require('express');
const socketIo = require('socket.io');
const http = require('http');
const path = require('path');
const formatMessage = require('./utils/messages');
const {userJoin,getCurrentUser,userLeave,getRoomUsers,} = require('./utils/users');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static file
app.use(express.static(path.join(__dirname, 'public')));
const botName = 'Chatbook';

// Run when users connects
io.on('connection', function(socket){
   socket.on('joinRoom', function({username, room }){

      const user = userJoin(socket.id, username, room);
      socket.join(user.room);

      // Welcoming new user
      socket.emit('message', formatMessage(botName, 'Welcome to Chatbook!'));

      // Broadcast when a new user connects to that room
      socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has joined the chat.`));

      // Send room and users info
      io.to(user.room).emit('roomUsers', {
         room: user.room,
         users: getRoomUsers(user.room),
      });

   });

   // Listen to chatMessage
   socket.on('chatMessage', function(msg){

      const user = getCurrentUser(socket.id);
      io.to(user.room).emit('message', formatMessage(user.username, msg));

   });

   // Runs when users disconnects
   socket.on('disconnect', function(){

      const user = userLeave(socket.id);
      if (user){

         io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat.`));
          
         // Send room and users info
         io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room),
         });

      }
   });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, function(){
   console.log(`Server is running on PORT: ${PORT}`);
});
