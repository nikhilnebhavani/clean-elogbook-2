const express = require("express");
const router = express.Router();
const clientPromise = require("../../../lib/mongodb");
const CryptoJS = require("crypto-js");
const { ObjectId } = require("mongodb");

router.post("/", async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db("elogbook");

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    let token = authHeader.split(" ")[1];
    let decryptedData;

    try {
      decryptedData = CryptoJS.AES.decrypt(
        token,
        process.env.TOKEN_SECRET
      ).toString(CryptoJS.enc.Utf8);
      if (!decryptedData) throw new Error();
    } catch (err) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const email = JSON.parse(decryptedData);
    const { subject_id, student_id } = req.body;

    const teacher = await db.collection("teachers").findOne({ email });
    if (!teacher) {
      return res.status(400).json({ error: "User Not Found" });
    }

    let scores = [];

    if (student_id !== 0) {
      // Fetch single student
      const student_data = await db
        .collection("students")
        .findOne({ _id: new ObjectId(student_id) });
      if (student_data) {
        student_data.score.forEach((scorecard) => {
          if (scorecard.subject_id === subject_id) {
            scores.push({ name: student_data.name, student_id, scorecard });
          }
        });
      }
    } else {
      // Fetch all students assigned to the teacher
      const students = teacher.students;
      for (const student of students) {
        const student_data = await db
          .collection("students")
          .findOne({ _id: new ObjectId(student) });
        if (student_data) {
          student_data.score.forEach((scorecard) => {
            if (scorecard.subject_id === subject_id) {
              scores.push({
                name: student_data.name,
                student_id: student,
                scorecard,
              });
            }
          });
        }
      }
    }

    return res.status(200).json({ scores });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
