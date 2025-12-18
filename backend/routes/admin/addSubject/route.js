const express = require('express');
const router = express.Router();
const clientPromise = require('../../../lib/mongodb');
const CryptoJS = require('crypto-js');

// Function to generate a random 6-digit number
const generateSixDigitNumber = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

router.post('/', async (req, res) => {
  try {
    const { subject_name, course_id } = req.body;
    const client = await clientPromise;
    const db = client.db("elogbook");

    // Validate required fields
    if (!subject_name || !course_id) {
      return res.status(400).json({ error: 'Subject name and course ID are required' });
    }

    // Extract token from authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: No valid token provided" });
    }

    const token = authHeader.split(" ")[1];

    // Decrypt the token to get user information
    let decryptedData;
    try {
      decryptedData = CryptoJS.AES.decrypt(
        token,
        process.env.TOKEN_SECRET
      ).toString(CryptoJS.enc.Utf8);
      if (!decryptedData) throw new Error("Decryption failed");
    } catch (err) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    // Parse user email from token
    const email = JSON.parse(decryptedData);

    // Find user by email to get additional information
    const admin = await db.collection("admins").findOne({ email });
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    // Get the course information
    const course = await db.collection('courses').findOne({ course_id });
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Generate a 6-digit number for subject_id
    let subject_id = generateSixDigitNumber();
    
    // Check if subject with the same subject_id already exists
    let existingSubject = await db.collection('subjects').findOne({ subject_id });
    let attempts = 0;
    
    while (existingSubject && attempts < 10) {
      subject_id = generateSixDigitNumber();
      existingSubject = await db.collection('subjects').findOne({ subject_id });
      attempts++;
    }
    
    if (existingSubject) {
      return res.status(400).json({ error: 'Failed to generate a unique subject ID, please try again' });
    }

    // Create new subject with course association and creator information
    const result = await db.collection('subjects').insertOne({
      subject_id,
      subject_name,
      course_id,
      course_name: course.course_name,
      active: true,
      created_at: new Date(),
      created_by: {
        name: admin.name,
        type: "admin",
        email: admin.email,
        id: admin._id.toString()
      }
    });

    res.json({
      message: 'Subject added successfully',
      subjectId: subject_id,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add subject' });
  }
});

module.exports = router; 