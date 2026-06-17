require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('./models/User');

const EMAIL = 'admin@feastfleet.com';
const PASSWORD = 'admin1234'; // min 8 chars; change after first login

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  let admin = await User.findOne({ email: EMAIL }).select('+password');
  if (admin) {
    // Reset the password and ensure the role, so re-running always works.
    admin.password = PASSWORD;        // pre-save hook re-hashes it
    admin.role = 'admin';
    admin.isActive = true;
    await admin.save();
    console.log(`admin password reset: ${EMAIL} / ${PASSWORD}`);
  } else {
    await User.create({ name: 'FeastFleet Admin', email: EMAIL, password: PASSWORD, role: 'admin' });
    console.log(`admin created: ${EMAIL} / ${PASSWORD}`);
  }
  process.exit(0);
})();
