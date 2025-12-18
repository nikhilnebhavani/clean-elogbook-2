const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const clientPromise = require("../../../lib/mongodb");
const CryptoJS = require("crypto-js");

// GET all teachers
router.get("/", async (req, res) => {
  try {
    // Get authorization header
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
      
      if (!decryptedData) {
        throw new Error("Decryption failed");
      }
    } catch (err) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    // Parse user email from token
    const email = JSON.parse(decryptedData);
    
    // Connect to the database
    const client = await clientPromise;
    const db = client.db("elogbook");
    
    // Find user by email to verify it's an admin
    const admin = await db.collection("admins").findOne({ email });
    if (!admin) {
      return res.status(401).json({ error: "Unauthorized: Admin access required" });
    }
    
    // Get all teachers without password field
    const teachers = await db.collection("teachers")
      .find({})
      .project({ password: 0 })
      .toArray();
    
    return res.status(200).json({ teachers });
  } catch (error) {
    console.error("Error fetching teachers:", error);
    return res.status(500).json({ error: "Failed to fetch teachers: " + error.message });
  }
});

// GET teacher by ID
router.get("/:id", async (req, res) => {
  try {
    const teacherId = req.params.id;
    
    if (!teacherId) {
      return res.status(400).json({ error: "Teacher ID is required" });
    }
    
    // Get authorization header
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
      
      if (!decryptedData) {
        throw new Error("Decryption failed");
      }
    } catch (err) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    // Parse user email from token
    const email = JSON.parse(decryptedData);
    
    // Connect to the database
    const client = await clientPromise;
    const db = client.db("elogbook");
    
    // Find user by email to verify it's an admin
    const admin = await db.collection("admins").findOne({ email });
    if (!admin) {
      return res.status(401).json({ error: "Unauthorized: Admin access required" });
    }
    
    // Get teacher by ID without password field
    const teacher = await db.collection("teachers")
      .findOne(
        { _id: new ObjectId(teacherId) },
        { projection: { password: 0 } }
      );
    
    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }
    
    return res.status(200).json({ teacher });
  } catch (error) {
    console.error("Error fetching teacher:", error);
    return res.status(500).json({ error: "Failed to fetch teacher: " + error.message });
  }
});

module.exports = router; 