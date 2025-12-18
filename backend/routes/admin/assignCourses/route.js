const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const clientPromise = require("../../../lib/mongodb");
const CryptoJS = require("crypto-js");

// POST - Assign a course to a student
router.post("/", async (req, res) => {
  try {
    const { studentId, course } = req.body;

    // Validate request body
    if (!studentId || !course) {
      return res.status(400).json({ 
        error: "Missing required fields. Student ID and course are required." 
      });
    }

    // Get authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    
    // Connect to database
    const client = await clientPromise;
    const db = client.db("elogbook");
    
    // Decrypt the token
    const bytes = CryptoJS.AES.decrypt(token, process.env.TOKEN_SECRET);
    const decrypted = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    
    // Check auth based on email instead of user_id and admin properties
    const email = decrypted;
    const admin = await db.collection("admins").findOne({ email });
    
    if (!admin) {
      return res.status(401).json({ error: "Unauthorized - Admin not found" });
    }

    const admin_id = admin._id.toString();
    
    // Find student by ID
    const student = await db.collection("students").findOne({ 
      _id: new ObjectId(studentId) 
    });

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Check if assignedCourses array exists, if not, create it
    let courses = student.courses || [];

    // Check if the course is already assigned
    const existingAssignment = courses.find(
      (assignedCourse) => assignedCourse.course === course
    );

    if (existingAssignment) {
      return res.status(400).json({ 
        error: "This course is already assigned to this student" 
      });
    }

    // Add the new course assignment
    courses.push({ course, subjects: [] });

    // Update the student document with the new assignedCourses array
    const result = await db
      .collection("students")
      .updateOne(
        { _id: new ObjectId(studentId) },
        { $set: { courses, updated_at: new Date(), updated_by: admin_id } }
      );

    if (result.modifiedCount === 0) {
      return res.status(500).json({ error: "Failed to assign course to student" });
    }

    return res.status(200).json({ 
      message: "Course assigned successfully",
      studentId,
      course
    });
  } catch (error) {
    console.error("Error assigning course:", error);
    return res.status(500).json({ 
      error: "Failed to assign course: " + error.message 
    });
  }
});

// GET - Get all course assignments
router.get("/", async (req, res) => {
  try {
    // Get authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    
    // Connect to database
    const client = await clientPromise;
    const db = client.db("elogbook");
    
    // Decrypt the token
    const bytes = CryptoJS.AES.decrypt(token, process.env.TOKEN_SECRET);
    const decrypted = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    
    // Check auth based on email instead of user_id and admin properties
    const email = decrypted;
    const admin = await db.collection("admins").findOne({ email });
    
    if (!admin) {
      return res.status(401).json({ error: "Unauthorized - Admin not found" });
    }

    const admin_id = admin._id.toString();

    // Get all students with their assigned courses
    const students = await db.collection("students")
      .find({})
      .project({ 
        _id: 1, 
        name: 1, 
        email: 1,
        enrollNo: 1,
        courses: 1 
      })
      .toArray();

    return res.status(200).json({ students });
  } catch (error) {
    console.error("Error fetching course assignments:", error);
    return res.status(500).json({ 
      error: "Failed to fetch course assignments: " + error.message 
    });
  }
});

// DELETE - Remove a course assignment from a student
// router.delete("/:studentId", async (req, res) => {
//   try {
//     const { studentId } = req.params;
//     const { course } = req.body;

//     // Validate request parameters
//     if (!studentId || !course) {
//       return res.status(400).json({ 
//         error: "Missing required fields. Student ID and course are required." 
//       });
//     }

//     // Get authorization header
//     const authHeader = req.headers.authorization;
//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return res.status(401).json({ error: "Unauthorized" });
//     }

//     const token = authHeader.split(" ")[1];
    
//     // Connect to database
//     const client = await clientPromise;
//     const db = client.db("elogbook");
    
//     // Decrypt the token
//     const bytes = CryptoJS.AES.decrypt(token, process.env.TOKEN_SECRET);
//     const decrypted = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    
//     // Check auth based on email instead of user_id and admin properties
//     const email = decrypted;
//     const admin = await db.collection("admins").findOne({ email });
    
//     if (!admin) {
//       return res.status(401).json({ error: "Unauthorized - Admin not found" });
//     }

//     const admin_id = admin._id.toString();

//     // Remove the course assignment from the student
//     const result = await db.collection("students").updateOne(
//       { _id: new ObjectId(studentId) },
//       { 
//         $pull: { assignedCourses: course },
//         $set: { updated_at: new Date(), updated_by: admin_id }
//       }
//     );

//     if (result.modifiedCount === 0) {
//       return res.status(404).json({ 
//         error: "Course assignment not found or student not found" 
//       });
//     }

//     return res.status(200).json({ 
//       message: "Course assignment removed successfully",
//       studentId,
//       course
//     });
//   } catch (error) {
//     console.error("Error removing course assignment:", error);
//     return res.status(500).json({ 
//       error: "Failed to remove course assignment: " + error.message 
//     });
//   }
// });

module.exports = router; 