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
    const { fileData, course_id } = req.body;
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

    if (!Array.isArray(fileData) || fileData.length === 0) {
      return res.status(400).json({ error: 'Invalid file data' });
    }

    const results = {
      success: [],
      failed: [],
    };

     const course = await db.collection('courses').findOne({ course_id });
        if (!course) {
          results.failed.push({
            subject_name: subject.subject_name,
            reason: 'Course not found',
          });
          res.json({
            message: "Course Not Found",
            results,
          });
    }

    for (const subject of fileData) {
      try {
        if (!subject.subject_name) {
          results.failed.push({
            subject_name: subject.subject_name || 'Unknown',
            reason: 'Subject name and course ID are required',
          });
          continue;
        }

        // Get course information
       

        // Generate a 6-digit number for subject_id
        let subject_id = generateSixDigitNumber();
        
        // Check if subject already exists with same ID
        let existingSubject = await db.collection('subjects').findOne({ subject_id });
        let attempts = 0;
        
        while (existingSubject && attempts < 10) {
          subject_id = generateSixDigitNumber();
          existingSubject = await db.collection('subjects').findOne({ subject_id });
          attempts++;
        }
        
        if (existingSubject) {
          results.failed.push({
            subject_name: subject.subject_name,
            reason: 'Failed to generate a unique subject ID, please try again',
          });
          continue;
        }

        // Create new subject with course association and creator information
        const subject_data = await db.collection('subjects').insertOne({
          subject_id,
          subject_name: subject.subject_name,
          course_id: course_id,
          active: true,
          created_at: new Date(),
          created_by: {
            name: admin.name,
            type: "admin",
            email: admin.email,
            id: admin._id.toString()
          }
        });

        if (subject_data) {
          results.success.push({
            subject_id,
            subject_name: subject.subject_name,
          });
        }
        
      } catch (error) {
        results.failed.push({
          subject_name: subject.subject_name || 'Unknown',
          reason: error.message,
        });
      }
    }
    
    console.log(results);
    res.json({
      message: 'Bulk add completed',
      results,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk add subjects' });
  }
});

module.exports = router; 