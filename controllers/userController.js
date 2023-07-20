const User = require('../model/User');
const bcrypt = require('bcryptjs');

exports.register = async (req,  res )=> {
  try {
    const { username, email, password } = req.body;

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully', user: newUser });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Compare the password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    res.status(200).json({ _id:user._id,username:user.username,email:user.email });
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

//     userIds = userIds.filter(id => id.toString() !== userId);
//     // Flatten the userIds array and remove duplicates
//     const uniqueUserIds = [...new Set(userIds)];

//     // Fetch the users associated with the user ids
//     const users = await User.find({ _id: { $in: uniqueUserIds } });

//     // Compute the count of new messages for each user
//     let contactsWithCount = [];
//     for (const user of users) {
//       console.log(user._id);
//       const newMessages = messages.filter(message => (
//         message.sender.toString() === userId &&
//         message.receiver.toString() === user._id.toString() &&
//         message.status === 'sent'
//       ));
//       for (const message of newMessages){
//         console.log(message.status);
//       }
//       const newMessageCount = newMessages.length;
//       contactsWithCount.push({
//         contactId: user._id,
//         newMessageCount,
//       });

//       console.log(contactsWithCount);

//       // Emit the new message count to the relevant client
//       if (user.socketId) {
//         io.to(user.socketId).emit('new_message_count', { contactId: userId, newMessageCount });
//       }
//     }

//     // Compute the list of contacts with their usernames
//     const contacts = users.map(user => ({
//       _id: user._id,
//       username: user.username,
//     }));

//     // Exclude the current user from the contacts list
//     const filteredContacts = contacts.filter(contact => contact._id.toString() !== userId);
//     console.log(contactsWithCount)
//     res.status(200).json({ contacts: filteredContacts, newMessageCounts: contactsWithCount });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ message: 'Server error', error });
//   }
