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
    const { fileData } = req.body;
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

    for (const course of fileData) {
      try {
        if (!course.course_name) {
          results.failed.push({
            name: course.course_name || 'Unknown',
            reason: 'Course name is required',
          });
          continue;
        }

        // Generate a 6-digit number
        let course_id = generateSixDigitNumber();
        
        // Check if course already exists with same ID
        // If it does, try up to 10 times to generate a unique ID
        let existingCourse = await db.collection('courses').findOne({ course_id });
        let attempts = 0;
        
        while (existingCourse && attempts < 10) {
          course_id = generateSixDigitNumber();
          existingCourse = await db.collection('courses').findOne({ course_id });
          attempts++;
        }
        
        if (existingCourse) {
          results.failed.push({
            name: course.course_name,
            reason: 'Failed to generate a unique course ID, please try again',
          });
          continue;
        }

        // Create new course with creator information
        await db.collection('courses').insertOne({
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

        results.success.push({
          course_id,
          course_name: course.course_name
        });
      } catch (error) {
        results.failed.push({
          name: course.course_name || 'Unknown',
          reason: error.message,
        });
      }
    }

    res.json({
      message: 'Bulk add completed',
      results,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk add courses' });
  }
});

module.exports = router; 