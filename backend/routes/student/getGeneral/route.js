const express = require('express');
const router = express.Router();
const clientPromise = require("../../../lib/mongodb");
const CryptoJS = require("crypto-js");

router.get('/', async (req, res) => {
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

    const student = await db.collection("students").findOne({ email });

    if (student) {
      let courses_ids = [];
      let subjects_ids = [];
      student.courses.forEach((course) => {
        courses_ids.push(course.course);
        course.subjects.forEach((subject) => {
          subjects_ids.push(subject);
        });
      });
      const courses = await db
        .collection("courses")
        .find({ course_id: { $in: courses_ids }, active: true })
        .toArray();

        const subjects = await db
        .collection("subjects")
        .find({ subject_id: { $in: subjects_ids }, active: true })
        .toArray();
      
      const competencies = await db
        .collection("competencies")
        .find({ subject_id: { $in: subjects_ids }, active: true })
        .toArray();
      
      const skills = await db
        .collection("skills")
        .find({ subject_id: { $in: subjects_ids.map(Number) }, active: true })
        .toArray();      


      res.status(200).json({
        courses,
        subjects,
        competencies,
        skills,
      });
    } else {
      res.status(404).json({ error: "Something Went Wrong" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message + "ok" });
  }
});

module.exports = router;
