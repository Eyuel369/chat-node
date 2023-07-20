const Message = require('../model/Message');
const User = require('../model/User');

exports.handleSocketConnection = async (socket, io) => {
  console.log('User connected:', socket.id);

  try {
    // Retrieve the user from the database using their ID
    const user = await User.findOne({ _id: socket.handshake.query.userId }).exec();

    if (!user) {
      // User not found in the database; disconnect the socket
      socket.disconnect(true);
      console.log('disconnected');
      return;
    }

    // Store the socket ID in the user's document
    user.socketId = socket.id;
    await user.save();

    // Listen for messages sent by this user
    socket.on('message', async ({ receiver, content }) => {
      try {
        // Create a new message
        const newMessage = new Message({ sender: user._id, receiver, content });
        await newMessage.save();
        console.log ('recieved');
        // Emit the message to the receiver
        const receiverUser = await User.findOne({ _id: receiver }).exec();
        
        if (receiverUser && receiverUser.socketId) {
          const id = receiverUser.socketId.toString();
          console.log(id);
          const contact = await User.find({ _id: { $in: user._id} }, '_id username');
          
          // const contactJson = JSON.parse(JSON.stringify(contact));
          console.log(typeof contact);
          console.log(typeof newMessage);
          if (id) {
            io.to(id).emit('message', newMessage);
            io.to(id).emit('contact', JSON.stringify(contact));
            io.to(id).emit('new_message_count', { contactId: receiverUser._id, count: 1});

          }
        }
      } catch (error) {
        console.log(error);
      }
    });
  } catch (error) {
    console.error('Error handling socket connection:', error);
  }

  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);

    try {
      // Remove the socket ID from the user's document
      const user = await User.findOne({ socketId: socket.id }).exec();
      if (user) {
        user.socketId = null;
        await user.save();
      }
    } catch (error) {
      console.error('Error handling socket disconnection:', error);
    }
  });
};
