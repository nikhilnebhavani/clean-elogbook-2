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

    // Check if teacher exists
    const teacher = await db.collection('teachers').findOne({ _id: new ObjectId(id) });
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Check if email is being changed and if new email already exists
    if (email !== teacher.email) {
      const existingTeacher = await db.collection('teachers').findOne({ email });
      if (existingTeacher) {
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

    // Update teacher
    await db.collection('teachers').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    res.json({ message: 'Teacher updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 