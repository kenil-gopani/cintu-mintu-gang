const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User.js');

dotenv.config();

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const users = await User.find({});
    users.forEach(u => {
      console.log(`Name: ${u.name}, Email: ${u.email}, Birthday: ${u.birthday}`);
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkUsers();
