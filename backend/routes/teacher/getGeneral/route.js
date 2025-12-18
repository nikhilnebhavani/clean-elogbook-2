const express = require("express");
const router = express.Router();
const clientPromise = require("../../../lib/mongodb");
const CryptoJS = require("crypto-js");
const { ObjectId } = require("mongodb");

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

    const teacher = await db.collection("teachers").findOne({ email });

    if (teacher) {
      let courses_ids = [];
      let subjects_ids = [];
      teacher.courses.forEach((course) => {
        courses_ids.push(course.course);
        course.subjects.forEach((subject) => {
          subjects_ids.push(subject);
        });
      });
      let students_id = teacher.students;
      const courses = await db
        .collection("courses")
        .find({ course_id: { $in: courses_ids } })
        .toArray();
      const subjects = await db
        .collection("subjects")
        .find({ subject_id: { $in: subjects_ids } })
        .toArray();
      const competencies = await db
        .collection("competencies")
        .find({ subject_id: { $in: subjects_ids } })
        .toArray();
        const skills = await db
        .collection("skills")
        .find({ subject_id: { $in: subjects_ids.map(Number) } })
        .toArray();

      const students = await db
        .collection("students")
        .find(
          { _id: { $in: students_id.map((id) => new ObjectId(id)) } },
          { projection: { email: 1, name: 1, _id: 1, courses :1 } }
        )
        .toArray();

      res.status(200).json({
        courses,
        subjects,
        students,
        competencies,
        skills,
        scorecard:teacher.scorecard
      });
    } else {
      res.status(404).json({ error: "Something Went Wrong" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message + "ok" });
  }
});

module.exports = router;
