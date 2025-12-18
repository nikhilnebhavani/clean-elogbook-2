const express = require('express');
const router = express.Router();
const clientPromise = require('../../../lib/mongodb');

router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    const client = await clientPromise;
    const db = client.db("elogbook");
    
    let query = {};
    
    // If search parameter is provided, filter by course name
    if (search) {
      query = { 
        course_name: { $regex: search, $options: 'i' } // Case-insensitive search
      };
    }
    
    const subjectsData = await db.collection("subjects").find(query).toArray();
    
    // Transform the data if needed
    const subjects = subjectsData.map(subject => ({
      subject_id: subject.subject_id,
      subject_name: subject.subject_name,
      course_id: subject.course_id,
      course_name: subject.course_name,
      created_at: subject.created_at,
      created_by: subject.created_by,
      updated_at: subject.updated_at,
      updated_by: subject.updated_by
    }));
    
    res.json({ subjects });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch subjects" });
  }
});

module.exports = router; 