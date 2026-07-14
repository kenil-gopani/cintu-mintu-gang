const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://efg5726_db_user:nczMNVFd5FeGKWmw@ac-lrjjl3w-shard-00-00.0nxw2vp.mongodb.net:27017,ac-lrjjl3w-shard-00-01.0nxw2vp.mongodb.net:27017,ac-lrjjl3w-shard-00-02.0nxw2vp.mongodb.net:27017/cintu-mintu-gang?ssl=true&authSource=admin&retryWrites=true&w=majority';

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
