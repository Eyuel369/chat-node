require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const userController = require('./controllers/userController');
const messageController = require('./controllers/messageController');

const {handleSocketConnection} = require('./controllers/socketController');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, { cors: { origin: '*' } });



// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Failed to connect to MongoDB:', err));

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.post('/register', userController.register);
app.post('/login', userController.login);
app.post('/send-message',(req, res) => { messageController.sendMessage(req,res,io);});
app.get('/fetch-messages/:userId/:contactId',(req, res) => { messageController.fetchMessages(req,res,io)});
app.get('/fetch-users/:userId',(req, res) => {messageController.fetchUserList(req,res,io)});


io.on('connection', (socket) => {
  handleSocketConnection(socket, io);
});

// Socket.IO events
// io.on('connection', async (socket) => {
//   console.log('User connected:',socket.id);

//   try {
//     // Retrieve the user from the database using their ID
//     const user = await User.findOne({ _id: socket.handshake.query.userId }).exec();
//     // console.log(user);

//     if (!user) {
//       // User not found in the database; disconnect the socket
//       socket.disconnect(true);
//       console.log('disconected');
//       return;
//     }

//     // Store the socket ID in the user's document
//     user.socketId = socket.id;
//     await user.save();

//     // console.log(user);

//     // Listen for messages sent by this user
//     socket.on('message', async ({ receiver, content }) => {
//       try {
//         // Create a new message
//         console.log(`${user}  ${receiver} ${content}`);
//         console.log(user._id)
//         const newMessage = new Message({ sender: user._id, receiver, content });
//         console.log(newMessage);
//         await newMessage.save();
//         // Emit the message to the receiver

//         const receiverUser = await User.findOne({ _id: receiver }).exec();
//         console.log(receiverUser);

//         if (receiverUser && receiverUser.socketId) {
//           console.log(receiverUser.socketId);
//           // socket.emit('message', newMessage); 
//           const id = receiverUser.socketId.toString();
//           console.log(typeof id);
//           console.log(typeof socket.id);
//           // if(typeof myVariable === 'undefined') {
//           //   alert('myVariable is either the special value `undefined`, or it has not been declared');
//           // }
//           // const receiverSocket = io.sockets.connected[id];
//           if (id) {
           
//             // receiverSocket.emit('message', newMessage);
//             // Emit message to specific socket
//             io.to(id).emit('message', newMessage);
//             console.log(newMessage);
//           }
//         }
//       } catch (error) {
//         console.log( error);
//       }
//     });
//   } catch (error) { 
//     console.error('Error handling socket connection:', error);
//   }

//   socket.on('disconnect', async () => {
//     console.log('User disconnected:', socket.id);

//     try {
//       // Remove the socket ID from the user's document
//       const user = await User.findOne({ socketId: socket.id }).exec();
//       if (user) {
//         user.socketId = null;
//         await user.save();
//       }
//     } catch (error) {
//       console.error('Error handling socket disconnection:', error);
//     }
//   });
// });

// Start the server
const ip = '127.0.0.1';
const port = process.env.PORT || 3000;
server.listen(port,ip, () => console.log(`Server running on port ${port}`));

// module.exports.io = { io };