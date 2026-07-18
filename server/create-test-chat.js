import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import ChatRoom from './models/ChatRoom.js';

dotenv.config();

async function createTestChat() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('No admin found');
      process.exit(0);
    }

    let room = await ChatRoom.findOne({ name: 'Admin Test Chat' });
    if (!room) {
      room = await ChatRoom.create({ 
        name: 'Admin Test Chat', 
        isGroup: true, 
        participants: [admin._id] 
      });
      console.log('Created Admin Test Chat room');
    } else {
      console.log('Admin Test Chat already exists');
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

createTestChat();
