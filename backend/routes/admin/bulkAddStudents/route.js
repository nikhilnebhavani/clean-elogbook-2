const express = require('express');
const router = express.Router();
const CryptoJS = require('crypto-js');
const clientPromise = require('../../../lib/mongodb');

router.post('/', async (req, res) => {
  try {
    const { fileData } = req.body;
    const client = await clientPromise;
    const db = client.db("elogbook");

    if (!Array.isArray(fileData) || fileData.length === 0) {
      return res.status(400).json({ error: 'Invalid file data' });
    }

    const results = {
      success: [],
      failed: [],
    };

    for (const student of fileData) {
      try {
        // Check if student already exists
        const existingStudent = await db.collection('students').findOne({ email: student.email });
        if (existingStudent) {
          results.failed.push({
            email: student.email,
            reason: `${student.email} Email already exists`,
          });
          continue;
        }
        const existingStudentEmail = await db.collection('teachers').findOne({ email: student.email });
        if (existingStudentEmail) {
          results.failed.push({
            email: student.email,
            reason: `${student.email} Email already exists in teachers`,
          });
          continue;
        }
        const existingStudentEmail2 = await db.collection('admins').findOne({ email: student.email });
        if (existingStudentEmail2) {
          results.failed.push({
            email: student.email,
            reason: `${student.email} Email already exists in admins`,
          });
          continue;
        }

        const existingStudentPhone = await db.collection('students').findOne({ phone: student.phone });
        if (existingStudentPhone) {
          results.failed.push({
            phone: student.phone,
            reason: `${student.phone} Phone already exists`,
          });
          continue;
        }

        const existingStudentPhone2 = await db.collection('teachers').findOne({ phone: student.phone });
        if (existingStudentPhone2) {
          results.failed.push({
            phone: student.phone,
            reason: `${student.phone} Phone already exists in teachers`,
          });
          continue;
        }

        const existingStudentPhone3 = await db.collection('admins').findOne({ phone: student.phone });
        if (existingStudentPhone3) {
          results.failed.push({
            phone: student.phone,
            reason: `${student.phone} Phone already exists in admins`,
          });
          continue;
        }

        // Check if enrollment number already exists
        const existingEnrollNo = await db.collection('students').findOne({ enrollNo: student.enrollNo });
        if (existingEnrollNo) {
          results.failed.push({
            email: student.email,
            reason: `${student.enrollNo} Enrollment number already exists`,
          });
          continue;
        }

        // Encrypt password
        const encryptedPassword = CryptoJS.AES.encrypt(
          "Parul@123",
          process.env.PASSWORD_SECRET
        ).toString();

        // Create new student
        await db.collection('students').insertOne({
          name: student.name,
          email: student.email,
          phone: student.phone,
          password: encryptedPassword,
          enrollNo: student.enrollNo,
          batchName: student.batchName,
          status:true,
          createdAt: new Date(),
        });

        results.success.push(student.email);
      } catch (error) {
        results.failed.push({
          email: student.email,
          reason: error.message,
        });
      }
    }

    res.json({
      message: 'Bulk add completed',
      results,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk add students' });
  }
});

module.exports = router; 