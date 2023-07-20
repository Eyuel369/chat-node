const Message = require('../model/Message');
const User = require('../model/User');




exports.sendMessage = async (req, res, io) => {
  try {
    const { sender, receiver, content } = req.body;

    const users = await User.findOne({ _id: receiver });
    // Create a new message
    const newMessage = new Message({ sender, receiver, content });
    await newMessage.save()
    const contact = { userId: users._id, username: users.username };
    const contactJson = JSON.parse(JSON.stringify(contact));
    console.log(`${contactJson} sending the contact` );
    if (users.socketId != null) {
      io.to(users.socketId).emit('message', newMessage);
      io.to(users.socketId).emit('contact', contactJson);
      io.to(users.socketId).emit('new_message_count', { contactId: users._id, count: 1});
    }
    res.status(201).json({ message: 'Message sent successfully', message: newMessage });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.fetchMessages = async (req, res,io) => {
  try {
    const { userId, contactId } = req.params;



    // Fetch messages between the two users
    const messagess = await Message.find({
      $or: [
        { sender: userId, receiver: contactId },
        { sender: contactId, receiver: userId },
      ],
    }).sort({ timestamp: 1 });

    await Message.updateMany(
      { sender: contactId, receiver: userId, status: 'sent' },
      { $set: { status: 'read' } }
    );

    res.status(200).json({ message: 'Messages fetched successfully', messages: messagess });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
// exports.fetchUserList = async (req, res, io) => {
//   try {
//     const { userId } = req.params;

//     // Fetch messages between the two users
//     const messages = await Message.find({
//       $or: [
//         { sender: userId },
//         { receiver: userId },
//       ],
//     }).sort({ timestamp: 1 });

//     console.log(messages);
//     // Get a list of unique user ids from the messages
//     let userIds = [...new Set(messages.map(message => [message.sender, message.receiver]).flat())];

//     console.log(userIds);

//     userIds = userIds.filter(id => id !== userId);
//     // Flatten the userIds array and remove duplicates
//     const uniqueUserIds = [...new Set(userIds)];

//     // Fetch the users associated with the user ids
//     const users = await User.find({ _id: { $in: uniqueUserIds } });

//     // Compute the count of new messages for each user
//     let contactsWithCount = [];
//     for (const user of users) {
//       const newMessages = messages.filter(message => (
//         message.sender.toString() === user._id.toString()
//         && message.receiver.toString() === userId
//         && message.status === 'sent'
//       ));
//       contactsWithCount.push({
//         contactId: user._id,
//         newMessageCount: newMessages.length,
//       });

      
//     }

//     // Compute the list of contacts with their usernames
//     const contacts = users.map(user => ({
//       _id: user._id,
//       username: user.username,
//     }));

//     // Exclude the current user from the contacts list
//     const filteredContacts = contacts.filter(contact => contact._id.toString() !== userId);

//     res.status(200).json({ contacts: filteredContacts, newMessageCounts: contactsWithCount });
//   } catch (error) {
//     console.log(error);
  
//     res.status(500).json({ message: 'Server error', error });
//   }



exports.fetchUserList = async (req, res, io) => {
  try {
    const { userId } = req.params;

    // Fetch messages between the two users
    const messages = await Message.find({
      $or: [
        { sender: userId },
        { receiver: userId },
      ],
    }).sort({ timestamp: 1 });
    console.log(messages);

    // Get a list of unique user ids from the messages
    let userIds = [...new Set(messages.map(message => [message.sender, message.receiver]).flat())];

    userIds = userIds.filter(id => id.toString() !== userId);
    // Flatten the userIds array and remove duplicates
    const uniqueUserIds = [...new Set(userIds)];

    // Fetch the users associated with the user ids
    const users = await User.find({ _id: { $in: uniqueUserIds } });

    // Compute the count of new messages for each user
    let contactsWithCount = [];
    for (const user of users) {
      console.log(user._id);
      const newMessages = messages.filter(message => (
        message.sender.toString() ===user._id.toString()  &&
        message.receiver.toString() === userId &&
        message.status === 'sent'
      ));
      for (const message of newMessages){
        console.log(message.status);
      }
      const newMessageCount = newMessages.length;
      contactsWithCount.push({
        contactId: user._id,
        newMessageCount,
      });

      console.log(contactsWithCount);

      // Emit the new message count to the relevant client
      if (user.socketId) {
        io.to(user.socketId).emit('new_message_count', { contactId: userId, newMessageCount });
      }
    }

    // Compute the list of contacts with their usernames
    const contacts = users.map(user => ({
      _id: user._id,
      username: user.username,
    }));

    // Exclude the current user from the contacts list
    const filteredContacts = contacts.filter(contact => contact._id.toString() !== userId);
    console.log(contactsWithCount)
    res.status(200).json({ contacts: filteredContacts, newMessageCounts: contactsWithCount });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error', error });
  }
};