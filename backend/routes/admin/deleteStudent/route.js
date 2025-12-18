const express = require('express');
const router = express.Router();
const clientPromise = require('../../../lib/mongodb');
const { ObjectId } = require('mongodb');

router.delete('/', async (req, res) => {
  try {
    const { id } = req.body;
    const client = await clientPromise;
    const db = client.db("elogbook");

    // Check if student exists
    const student = await db.collection('students').findOne({ _id: new ObjectId(id) });
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Delete student
    await db.collection('students').deleteOne({ _id: new ObjectId(id) });

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

module.exports = router; 