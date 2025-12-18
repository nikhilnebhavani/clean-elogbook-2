const express = require('express');
const router = express.Router();
const CryptoJS = require('crypto-js');
const clientPromise = require('../../../lib/mongodb');

router.post('/', async (req, res) => {
  try {
    const { name, email, phone, password, enrollNo, batchName } = req.body;
    const client = await clientPromise;
    const db = client.db("elogbook");

    // Check if student already exists via email
    const existingStudent = await db.collection("students").findOne({ email });
    if (existingStudent) {
      return res
        .status(400)
        .json({ error: "A Student with this email already exists" });
    }
    const existingTeacher = await db.collection("teachers").findOne({ email });
    if (existingTeacher) {
      return res
        .status(400)
        .json({ error: "A Teacher with this email already exists" });
    }
    const existingAdmin = await db.collection("admins").findOne({ email });
    if (existingAdmin) {
      return res
        .status(400)
        .json({ error: "An Admin with this email already exists" });
    }

    // Check if student already exists via phone
    const existingPhone = await db
      .collection("students")
      .findOne({ phone: parseInt(phone) });
    if (existingPhone) {
      return res
        .status(400)
        .json({ error: "Student with this phone already exists" });
    }
    const existingTeacherPhone = await db
      .collection("teachers")
      .findOne({ phone: parseInt(phone) });
    if (existingTeacherPhone) {
      return res
        .status(400)
        .json({ error: "A Teacher with this phone already exists" });
    }
    const existingAdminPhone = await db
      .collection("admins")
      .findOne({ phone: parseInt(phone) });
    if (existingAdminPhone) {
      return res
        .status(400)
        .json({ error: "An Admin with this phone already exists" });
    }

    // Check if enrollment number already exists
    const existingEnrollNo = await db
      .collection("students")
      .findOne({ enrollNo });
    if (existingEnrollNo) {
      return res
        .status(400)
        .json({ error: "Student with this enrollment number already exists" });
    }

    // Encrypt password
    const encryptedPassword = CryptoJS.AES.encrypt(
      password,
      process.env.PASSWORD_SECRET
    ).toString();

    // Create new student
    const result = await db.collection("students").insertOne({
      name,
      email,
      phone:parseInt(phone),
      password: encryptedPassword,
      enrollNo,
      batchName,
      status:true,
      createdAt: new Date(),
    });

    res.json({
      message: "Student added successfully",
      studentId: result.insertedId,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add student' });
  }
});

module.exports = router; 