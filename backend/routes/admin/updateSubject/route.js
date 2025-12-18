const express = require('express');
const router = express.Router();
const clientPromise = require('../../../lib/mongodb');
const CryptoJS = require('crypto-js');

router.put('/', async (req, res) => {
  try {
    const { subject_id, subject_name, course_id, active } = req.body;
    const client = await clientPromise;
    const db = client.db("elogbook");

    // Validate required fields
    if (!subject_id) {
      return res.status(400).json({ error: 'Subject ID is required' });
    }

    // At least one update field is required: name or active status
    if (subject_name === undefined && active === undefined) {
      return res.status(400).json({ error: 'At least subject name or active status must be provided' });
    }

    // If updating name, course_id is required
    if (subject_name && !course_id) {
      return res.status(400).json({ error: 'Course ID is required when updating subject name' });
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

    // Check if subject exists
    const subject = await db.collection('subjects').findOne({ subject_id });
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
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

    // If updating subject name and course, add those fields
    if (subject_name) {
      // Get the course information for the updated course_id
      const course = await db.collection('courses').findOne({ course_id });
      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }
      
      updateData.subject_name = subject_name;
      updateData.course_id = course_id;
      updateData.course_name = course.course_name;
    }

    // If toggling active status, add that field
    if (active !== undefined) {
      updateData.active = active;
    }

    // Update subject
    await db.collection('subjects').updateOne(
      { subject_id },
      { $set: updateData }
    );

    res.json({ 
      message: active !== undefined 
        ? `Subject ${active ? 'activated' : 'deactivated'} successfully` 
        : 'Subject updated successfully' 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update subject' });
  }
});

module.exports = router; 