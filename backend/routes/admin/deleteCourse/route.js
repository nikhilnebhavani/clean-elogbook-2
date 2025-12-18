const express = require('express');
const router = express.Router();
const clientPromise = require('../../../lib/mongodb');
const CryptoJS = require('crypto-js');

router.delete('/', async (req, res) => {
  try {
    const { id } = req.body;
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

    // Check if course exists
    const course = await db.collection('courses').findOne({ course_id: id });
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Option 1: Hard delete - completely remove the course
    await db.collection('courses').deleteOne({ course_id: id });

    // Option 2: Soft delete - just mark as deleted (uncomment this and comment out the hard delete if you prefer)
    /*
    await db.collection('courses').updateOne(
      { course_id: id },
      { 
        $set: {
          is_deleted: true,
          deleted_at: new Date(),
          deleted_by: {
            name: admin.name,
            type: "admin",
            email: admin.email,
            id: admin._id.toString()
          }
        }
      }
    );
    */

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

module.exports = router; 