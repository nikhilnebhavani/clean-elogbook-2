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
    const { name } = req.body;
    const client = await clientPromise;
    const db = client.db("elogbook");

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

    // Generate a 6-digit number
    let course_id = generateSixDigitNumber();
    
    // Check if course with the same course_id already exists
    // If it does, try up to 10 times to generate a unique ID
    let existingCourse = await db.collection('courses').findOne({ course_id });
    let attempts = 0;
    
    while (existingCourse && attempts < 10) {
      course_id = generateSixDigitNumber();
      existingCourse = await db.collection('courses').findOne({ course_id });
      attempts++;
    }
    
    if (existingCourse) {
      return res.status(400).json({ error: 'Failed to generate a unique course ID, please try again' });
    }

    // Create new course with course_id, course_name, and creator information
    const result = await db.collection('courses').insertOne({
      course_id,
      course_name: name,
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
      message: 'Course added successfully',
      courseId: course_id,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add course' });
  }
});

module.exports = router; 