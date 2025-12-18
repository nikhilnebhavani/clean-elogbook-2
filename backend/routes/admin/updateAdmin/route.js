const express = require('express');
const router = express.Router();
const CryptoJS = require('crypto-js');
const clientPromise = require('../../../lib/mongodb');
const { ObjectId } = require('mongodb');

router.put('/', async (req, res) => {
  try {
    const { id, name, email, phone, password } = req.body;
    const client = await clientPromise;
    const db = client.db();

    // Check if admin exists
    const admin = await db.collection('admins').findOne({ _id: new ObjectId(id) });
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Check if email is being changed and if new email already exists
    if (email !== admin.email) {
      const existingAdmin = await db.collection('admins').findOne({ email });
      if (existingAdmin) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    // Prepare update data
    const updateData = {
      name,
      email,
      phone
    };

    // Update password if provided
    if (password) {
      const encryptedPassword = CryptoJS.AES.encrypt(
        password,
        process.env.PASSWORD_SECRET
      ).toString();
      updateData.password = encryptedPassword;
    }

    // Update admin
    await db.collection('admins').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    res.json({ message: 'Admin updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 