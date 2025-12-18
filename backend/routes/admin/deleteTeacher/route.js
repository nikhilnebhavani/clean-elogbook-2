const express = require('express');
const router = express.Router();
const clientPromise = require('../../../lib/mongodb');
const { ObjectId } = require('mongodb');

router.delete('/', async (req, res) => {
  try {
    const { id } = req.body;
    const client = await clientPromise;
    const db = client.db();

    // Check if teacher exists
    const teacher = await db.collection('teachers').findOne({ _id: new ObjectId(id) });
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Prevent deleting the last teacher
    const teacherCount = await db.collection('teachers').countDocuments();
    if (teacherCount <= 1) {
      return res.status(400).json({ error: 'Cannot delete the last teacher' });
    }

    // Delete teacher
    await db.collection('teachers').deleteOne({ _id: new ObjectId(id) });
    res.json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 