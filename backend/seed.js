const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Family = require('./models/Family');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/vsa_website';

async function seed() {
  await mongoose.connect(MONGO_URI);

  // 1. Create default family
  const familyName = 'Seed Family';
  const familyDescription = 'This is the default seeded family.';
  let family = await Family.findOne({ name: familyName });
  if (!family) {
    family = new Family({
      name: familyName,
      description: familyDescription,
      members: [],
      totalPoints: 0
    });
    await family.save();
    console.log('Default family created:', familyName);
  } else {
    console.log('Default family already exists.');
  }

  // 2. Create default user
  const email = 'admin@vsa.com';
  const username = 'admin';
  const password = 'password123';

  let user = await User.findOne({ email });
  if (!user) {
    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({
      username,
      email,
      password: hashedPassword,
      role: 'admin',
      family: family._id
    });
    await user.save();
    console.log('Default user created:', email, password);
  } else {
    console.log('Default user already exists.');
    // 3. Ensure user is in the family
    if (!user.family || user.family.toString() !== family._id.toString()) {
      user.family = family._id;
      await user.save();
      console.log('User family set to default family.');
    }
  }

  // 4. Add user to family's members if not already present
  if (!family.members.some(m => m.toString() === user._id.toString())) {
    family.members.push(user._id);
    await family.save();
    console.log('User added to family members.');
  }

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
