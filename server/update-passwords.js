const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User.js');

dotenv.config();

async function updatePasswords() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const usersToUpdate = [
      'krish.miyani@chintumintugang.com',
      'hasti.miyani@chintumintugang.com',
      'maitri.gopani@chintumintugang.com',
      'krisha.sutariya@chintumintugang.com',
      'harshil.sutariya@chintumintugang.com',
      'het.sheta@chintumintugang.com',
      'rutvi.sheta@chintumintugang.com'
    ];

    const users = await User.find({ email: { $in: usersToUpdate } });
    
    for (const u of users) {
      if (u.birthday) {
        const d = new Date(u.birthday);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        
        const rawPassword = `${day}${month}${year}`;
        const hashedPassword = await bcrypt.hash(rawPassword, 12);
        
        u.password = hashedPassword;
        await u.save();
        
        console.log(`Updated ${u.name} (${u.email}) -> Password set to: ${rawPassword}`);
      } else {
        console.log(`Warning: ${u.name} has no birthday set!`);
      }
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

updatePasswords();
