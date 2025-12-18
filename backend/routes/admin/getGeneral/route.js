const express = require("express");
const router = express.Router();
const clientPromise = require("../../../lib/mongodb");
const CryptoJS = require("crypto-js");

router.get("/", async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db("elogbook");
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
    const decryptedData = CryptoJS.AES.decrypt(
      token,
      process.env.TOKEN_SECRET
    ).toString(CryptoJS.enc.Utf8);

    const email = JSON.parse(decryptedData);
    const admin = await db.collection("admins").findOne({ email });

    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    const admins = await db.collection("admins").find({}).toArray();

    // Get all courses
    const courses = await db.collection("courses").find({}).toArray();

    // Get all subjects
    const subjects = await db.collection("subjects").find({}).toArray();

    // Get all competencies
    const competencies = await db.collection("competencies").find({}).toArray();

    // Get all skills
    const skills = await db.collection("skills").find({}).toArray();

    // Get all students
    const students = await db.collection("students").find({}).toArray();

    // Get all logs
    const logs = await db.collection("logs").find({}).toArray();

    // Get all teachers
    const teachers = await db.collection("teachers").find({}).toArray();

    res.status(200).json({
      admin: {
        name: admin.name,
        email: admin.email
      },
      admins,
      courses,
      subjects,
      competencies,
      skills,
      students,
      logs,
      teachers
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
