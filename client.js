const io = require('socket.io-client');
const socket = io.connect('http://localhost:3000'); 

socket.emit('message', { sender: 'user1', receiver: 'user2', content: 'Hello, user2!' });

socket.on('message', (data) => {
    console.log('Received message:', data);
  });