const express = require("express");
const router = express.Router();
const clientPromise = require("../../../lib/mongodb");

router.get("/", async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db("elogbook");

    const [
      adminCount,
      studentCount,
      teacherCount,
      logCount,
      skillCount,
      competencyCount,
      subjectCount,
      courseCount,
    ] = await Promise.all([
      db.collection("admins").countDocuments(),
      db.collection("students").countDocuments(),
      db.collection("teachers").countDocuments(),
      db.collection("logs").countDocuments(),
      db.collection("skills").countDocuments(),
      db.collection("competencies").countDocuments(),
      db.collection("subjects").countDocuments(),
      db.collection("courses").countDocuments(),
    ]);

    res.json({
      admins: adminCount,
      students: studentCount,
      teachers: teacherCount,
      logs: logCount,
      skills: skillCount,
      competencies: competencyCount,
      subjects: subjectCount,
      courses: courseCount,
    });
  } catch (error) {
    console.error("Error fetching dashboard summary:", error);
    res.status(500).json({ error: "Failed to fetch dashboard summary" });
  }
});

module.exports = router;
