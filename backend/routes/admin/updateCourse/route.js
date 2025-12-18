const express = require('express');
const router = express.Router();
const clientPromise = require('../../../lib/mongodb');
const CryptoJS = require('crypto-js');

router.put('/', async (req, res) => {
  try {
    const { id, name, active } = req.body;
    
    // Validate that at least one field to update is provided
    if (name === undefined && active === undefined) {
      return res.status(400).json({ error: 'At least one field to update must be provided' });
    }
    
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

    // Create an update object with the updater information
    const updateData = {
      updated_at: new Date(),
      updated_by: {
        name: admin.name,
        type: "admin",
        email: admin.email,
        id: admin._id.toString()
      }
    };

    // If updating course name, add that field
    if (name !== undefined) {
      updateData.course_name = name;
    }

    // If toggling active status, add that field
    if (active !== undefined) {
      updateData.active = active;
    }

    // Update course
    await db.collection('courses').updateOne(
      { course_id: id },
      { $set: updateData }
    );

    // Generate appropriate success message based on the update type
    let message = '';
    if (active !== undefined && name !== undefined) {
      message = `Course updated and ${active ? 'activated' : 'deactivated'} successfully`;
    } else if (active !== undefined) {
      message = `Course ${active ? 'activated' : 'deactivated'} successfully`;
    } else {
      message = 'Course updated successfully';
    }

    res.json({ message });
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

module.exports = router; 