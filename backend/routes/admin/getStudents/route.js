const express = require('express');
const router = express.Router();
const clientPromise = require('../../../lib/mongodb');

router.get('/', async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db("elogbook");
    const students = await db.collection("students").find({}).toArray();
    res.json({ students });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

module.exports = router; 