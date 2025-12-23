const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

console.log('Attempting to connect to MongoDB...', process.env.MONGO_URL.replace(/:([^:@]+)@/, ':****@'));

mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log('✅ Success! MongoDB is connected.');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Failed to connect to MongoDB:');
    console.error(err);
    process.exit(1);
  });
