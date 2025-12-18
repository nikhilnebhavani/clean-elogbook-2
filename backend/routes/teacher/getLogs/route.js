const express = require("express");
const router = express.Router();
const clientPromise = require("../../../lib/mongodb");
const CryptoJS = require("crypto-js");
const { ObjectId } = require("mongodb");

router.post("/", async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db("elogbook");
    const data = req.body;
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
    let students_id = teacher.students;

    console.log(students_id)


    if (teacher) {
      const { course_id, subject_id, student_id } = data;
      
      // Validate required fields
      if (!course_id || !subject_id) {
        return res.status(400).json({ error: "Course ID and Subject ID are required" });
      }

      let logs;
      try {
        if (student_id && student_id !== "0") {
          logs = await db
            .collection("logs")
            .find({ student_id: new ObjectId(student_id), course_id :parseInt(course_id), subject_id :parseInt(subject_id) })
            .toArray();
        } else {
          logs = await db
            .collection("logs")
            .find({ student_id: { $in: students_id.map(id => new ObjectId(id))}, course_id :parseInt(course_id), subject_id :parseInt(subject_id) })
            .toArray();

            console.log({ $in: students_id.map(id => new ObjectId(id))})
        }
      } catch (err) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      if (logs) {
        res.status(200).json({
          logs,
        });
      } else {
        console.log("no log");
        res.status(400).json({ error: "No logs found" });
      }
    } else {
      res.status(400).json({ error: "User Not Found" });
    }
  } catch (error) {
    console.error("Error in getLogs route:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
