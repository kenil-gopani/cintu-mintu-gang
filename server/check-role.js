const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  const db = mongoose.connection.db;
  const usersCollection = db.collection('users');
  const kenil = await usersCollection.findOne({ email: 'gopanikenil26@gmail.com' });
  console.log("Kenil's Role:", kenil ? kenil.role : 'NOT FOUND');
  mongoose.disconnect();
})
.catch(err => console.error(err));
