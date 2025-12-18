const express = require('express');
const router = express.Router();
const CryptoJS = require('crypto-js');
const clientPromise = require('../../../lib/mongodb');

router.post('/', async (req, res) => {
  try {
    const { fileData } = req.body;
    const client = await clientPromise;
    const db = client.db();
    
    if (!fileData || !Array.isArray(fileData)) {
      return res.status(400).json({ error: 'Invalid file data' });
    }

    const results = {
      success: [],
      failed: []
    };

    for (const teacherData of fileData) {
      try {
        // Check if teacher already exists
        const existingTeacher = await db.collection('teachers').findOne({ email: teacherData.email });
        if (existingTeacher) {
          results.failed.push({
            email: teacherData.email,
            reason: 'Teacher already exists'
          });
          continue;
        }

        // Encrypt password using CryptoJS
        const encryptedPassword = CryptoJS.AES.encrypt(
          "Parul@123",
          process.env.PASSWORD_SECRET
        ).toString();

        // Create new teacher
        await db.collection('teachers').insertOne({
          name: teacherData.name,
          email: teacherData.email,
          phone: teacherData.phone,
          password: encryptedPassword,
          createdAt: new Date()
        });

        results.success.push(teacherData.email);
      } catch (error) {
        results.failed.push({
          email: teacherData.email,
          reason: error.message
        });
      }
    }

    res.json({
      message: 'Bulk add completed',
      results
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 