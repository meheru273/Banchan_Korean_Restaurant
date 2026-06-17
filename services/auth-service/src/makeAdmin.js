// Promote an existing user to the admin role.
//
// With Firebase auth, admins log in like everyone else (verified email), so the
// flow is: register + verify + log in once through the app (which creates the
// MongoDB user), then run this to grant admin:
//
//   node services/auth-service/src/makeAdmin.js you@example.com
//
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('./models/User');

const email = (process.argv[2] || '').toLowerCase();
if (!email) {
  console.error('Usage: node services/auth-service/src/makeAdmin.js <email>');
  process.exit(1);
}

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOneAndUpdate({ email }, { role: 'admin' }, { new: true });
  if (!user) {
    console.log(`No user with email "${email}". Register & verify that email in the app and log in once, then re-run this.`);
    process.exit(1);
  }
  console.log(`Promoted to admin: ${user.email} (role=${user.role})`);
  process.exit(0);
})().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
