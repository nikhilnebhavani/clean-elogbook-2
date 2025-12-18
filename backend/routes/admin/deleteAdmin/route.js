const express = require('express');
const router = express.Router();
const clientPromise = require('../../../lib/mongodb');
const { ObjectId } = require('mongodb');

router.delete('/', async (req, res) => {
  try {
    const { id } = req.body;
    const client = await clientPromise;
    const db = client.db();

    // Check if admin exists
    const admin = await db.collection('admins').findOne({ _id: new ObjectId(id) });
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Prevent deleting the last admin
    const adminCount = await db.collection('admins').countDocuments();
    if (adminCount <= 1) {
      return res.status(400).json({ error: 'Cannot delete the last admin' });
    }

    // Delete admin
    await db.collection('admins').deleteOne({ _id: new ObjectId(id) });
    res.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 