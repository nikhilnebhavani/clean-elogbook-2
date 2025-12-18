const express = require('express');
const router = express.Router();
const CryptoJS = require('crypto-js');
const clientPromise = require('../../../lib/mongodb');

router.post('/', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const client = await clientPromise;
    const db = client.db();

    // Check if teacher already exists
    const existingTeacher = await db.collection('teachers').findOne({ email });
    if (existingTeacher) {
      return res.status(400).json({ error: 'Teacher already exists' });
    }

    // Encrypt password using CryptoJS
    const encryptedPassword = CryptoJS.AES.encrypt(
      password,
      process.env.PASSWORD_SECRET
    ).toString();

    // Create new teacher
    await db.collection('teachers').insertOne({
      name,
      email,
      phone,
      password: encryptedPassword,
      createdAt: new Date()
    });

    res.json({ message: 'Teacher added successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 