const express = require('express');
const router = express.Router();
const clientPromise = require('../../../lib/mongodb');
const CryptoJS = require('crypto-js');

router.put('/', async (req, res) => {
  try {
    const { skill_id, skill_name, subject_id, competency_id, active } = req.body;
    
    // Validate that at least one field to update is provided
    if (skill_name === undefined && subject_id === undefined && competency_id === undefined && active === undefined) {
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

    // Check if skill exists
    const skill = await db.collection('skills').findOne({ skill_id });
    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
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

    // If updating skill name, add that field
    if (skill_name !== undefined) {
      updateData.skill_name = skill_name;
    }

    // If updating subject, add that field
    if (subject_id !== undefined) {
      // Check if subject exists
      const subject = await db.collection('subjects').findOne({ subject_id });
      if (!subject) {
        return res.status(404).json({ error: 'Subject not found' });
      }
      updateData.subject_id = subject_id;
    }

    // If updating competency, add that field
    if (competency_id !== undefined) {
      // Check if competency exists
      const competency = await db.collection('competencies').findOne({ competency_id });
      if (!competency) {
        return res.status(404).json({ error: 'Competency not found' });
      }
      updateData.competency_id = competency_id;
    }

    // If toggling active status, add that field
    if (active !== undefined) {
      updateData.active = active;
    }

    // Update skill
    await db.collection('skills').updateOne(
      { skill_id },
      { $set: updateData }
    );

    // Generate appropriate success message based on the update type
    let message = '';
    if (active !== undefined && (skill_name !== undefined || subject_id !== undefined || competency_id !== undefined)) {
      message = `Skill updated and ${active ? 'activated' : 'deactivated'} successfully`;
    } else if (active !== undefined) {
      message = `Skill ${active ? 'activated' : 'deactivated'} successfully`;
    } else {
      message = 'Skill updated successfully';
    }

    res.json({ message });
  } catch (error) {
    console.error("Error updating skill:", error);
    res.status(500).json({ error: 'Failed to update skill' });
  }
});

module.exports = router; 