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

    for (const adminData of fileData) {
      try {
        // Check if admin already exists
        const existingAdmin = await db.collection('admins').findOne({ email: adminData.email });
        if (existingAdmin) {
          results.failed.push({
            email: adminData.email,
            reason: 'Admin already exists'
          });
          continue;
        }

        // Encrypt password using CryptoJS
        const encryptedPassword = CryptoJS.AES.encrypt(
          "Parul@123",
          process.env.PASSWORD_SECRET
        ).toString();

        // Create new admin
        await db.collection('admins').insertOne({
          name: adminData.name,
          email: adminData.email,
          phone: adminData.phone,
          password: encryptedPassword,
          createdAt: new Date()
        });

        results.success.push(adminData.email);
      } catch (error) {
        results.failed.push({
          email: adminData.email,
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