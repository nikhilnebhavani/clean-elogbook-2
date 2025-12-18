const express = require('express');
const router = express.Router();
const clientPromise = require('../../../lib/mongodb');

router.get('/', async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db("elogbook");
    
    // Get all courses
    const coursesData = await db.collection("courses").find({}).toArray();
    
    // Transform the data if needed
    // If the document already has course_id and course_name, use those
    // Otherwise, use id and name (for backward compatibility)
    const courses = coursesData.map(course => ({
      course_id: course.course_id || course.id,
      course_name: course.course_name || course.name
    }));
    
    res.json({ courses });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});

module.exports = router; 