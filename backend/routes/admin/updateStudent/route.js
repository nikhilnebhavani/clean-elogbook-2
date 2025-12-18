const express = require('express');
const router = express.Router();
const CryptoJS = require('crypto-js');
const clientPromise = require('../../../lib/mongodb');
const { ObjectId } = require('mongodb');

router.put('/', async (req, res) => {
  try {
    const { id, name, email, phone, password, enrollNo, department } = req.body;
    const client = await clientPromise;
    const db = client.db("elogbook");

    // Check if student exists
    const student = await db.collection('students').findOne({ _id: new ObjectId(id) });
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // If email is being changed, check if new email already exists
    if (email !== student.email) {
      const existingStudent = await db.collection('students').findOne({ email });
      if (existingStudent) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    // If enrollment number is being changed, check if new number already exists
    if (enrollNo !== student.enrollNo) {
      const existingEnrollNo = await db.collection('students').findOne({ enrollNo });
      if (existingEnrollNo && existingEnrollNo._id.toString() !== id) {
        return res.status(400).json({ error: 'Enrollment number already in use' });
      }
    }

    // Prepare update data
    const updateData = {
      name,
      email,
      phone,
      enrollNo,
      department,
    };

    // Only update password if a new one is provided
    if (password) {
      updateData.password = CryptoJS.AES.encrypt(
        password,
        process.env.PASSWORD_SECRET
      ).toString();
    }

    // Update student
    await db.collection('students').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    res.json({ message: 'Student updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update student' });
  }
});

module.exports = router; 