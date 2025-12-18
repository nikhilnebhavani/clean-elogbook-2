const express = require("express");
const route = express.Router();
const clientPromise = require("../../../lib/mongodb");
const { ObjectId } = require("mongodb");

route.post("/", async (req, res) => {
  
  try {
    const { studentId, course, subject } = req.body;

    if (!studentId || !course || !subject) {
      return res.status(400).json({
        error: "Student ID, Course ID, and Subject ID are required",
      });
    }

    const client = await clientPromise;
    const db = client.db("elogbook");
    const studentsCollection = db.collection("students");

    const studentObjectId = new ObjectId(studentId);
    const student = await studentsCollection.findOne({ _id: studentObjectId });

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    let courses = student.courses || [];

    let courseIndex = courses.findIndex((c) => c.course === course);

    if (courseIndex !== -1) {
      // Course exists, check if subject already exists
      let subjects = courses[courseIndex].subjects || [];

      if (subjects.includes(subject)) {
        return res.status(400).json({
          error: "Subject already assigned to this student in this course",
        });
      }

      subjects.push(subject);
      courses[courseIndex].subjects = subjects;
    } else {
      // Course not present, add new course with subject
      courses.push({
        course: course,
        subjects: [subject],
      });
    }

    // Update the student document
    await studentsCollection.updateOne(
      { _id: studentObjectId },
      { $set: { courses } }
    );

    return res.status(200).json({
      success: true,
      message: "Subject assigned successfully",
    });
  } catch (error) {
    console.error("Error assigning subject to student:", error);
    return res.status(500).json({
      error: "Internal server error: " + error.message,
    });
  }
});

module.exports = route;
