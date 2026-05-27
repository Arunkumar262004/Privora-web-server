const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/photowallet');
    console.log('MongoDB connected for seeding...');

    const adminEmail = 'arunkumar957877@gmail.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log('Admin account already exists. Updating details...');
      existingAdmin.name = 'Admin User';
      existingAdmin.role = 'admin';
      existingAdmin.password = 'Arun@123'; // Pre-save hook hashes this password!
      await existingAdmin.save();
      console.log('Admin user updated successfully.');
    } else {
      console.log('Creating seed admin account...');
      await User.create({
        name: 'Admin User',
        email: adminEmail,
        password: 'Arun@123',
        role: 'admin',
        walletBalance: 0
      });
      console.log('Admin user created successfully.');
    }

    console.log('Seeding completed.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedAdmin();
