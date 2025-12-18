const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const clientPromise = require('../../../lib/mongodb');

// GET /getAdmins - Get all admins
router.get('/', async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection('admins');

    // Fetch all admins
    const admins = await collection.find({}).project({ password: 0 }).toArray();

    return res.status(200).json({ 
      success: true,
      admins 
    });
  } catch (error) {
    console.error('Error retrieving admins:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve admins' 
    });
  }
});

module.exports = router; 