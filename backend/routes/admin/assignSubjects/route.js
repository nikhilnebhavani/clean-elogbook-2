const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const clientPromise = require("../../../lib/mongodb");
const CryptoJS = require("crypto-js");

// POST - Assign a subject to a teacher
router.post("/", async (req, res) => {
  try {
    const { teacherId, course, subject } = req.body;

    // Validate request body
    if (!teacherId || !course || !subject) {
      return res.status(400).json({ 
        error: "Missing required fields. Teacher ID, course, and subject are required." 
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
    
    // Find teacher by ID
    const teacher = await db.collection("teachers").findOne({ 
      _id: new ObjectId(teacherId) 
    });

    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    // Check if courses array exists, if not, create it
    let courses = teacher.courses || [];
    console.log('Initial courses:', courses);

    // Find if the course already exists
    let courseAssignment = courses.find(assignment => assignment.course === course);

    if (!courseAssignment) {
      // If course doesn't exist, create it with the new subject
      courseAssignment = { course, subjects: [subject] };
      courses.push(courseAssignment);
    } else {
      // If course exists, check if subject is already assigned
      if (courseAssignment.subjects.includes(subject)) {
        return res.status(400).json({
          error: "This subject is already assigned to this teacher for the specified course"
        });
      }
      // Add the new subject to existing course
      courseAssignment.subjects.push(subject);
    }
    
    console.log('Updated courses:', courses);

    console.log(courses);

    // Update the teacher document with the new assignedSubjects array
    const result = await db.collection("teachers").updateOne( 
      { _id: new ObjectId(teacherId) },
      { $set: { courses, updated_at: new Date(), updated_by: admin_id } }
    );

    if (result.modifiedCount === 0) {
      return res.status(500).json({ error: "Failed to assign subject to teacher" });
    }

    return res.status(200).json({ 
      message: "Subject assigned successfully",
      teacherId,
      course,
      subject
    });
  } catch (error) {
    console.error("Error assigning subject:", error);
    return res.status(500).json({ 
      error: "Failed to assign subject: " + error.message 
    });
  }
});

// GET - Get all subject assignments
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

    // Get all teachers with their assigned subjects
    const teachers = await db.collection("teachers")
      .find({})
      .project({ 
        _id: 1, 
        name: 1, 
        email: 1, 
        courses: 1 
      })
      .toArray();

    return res.status(200).json({ teachers });
  } catch (error) {
    console.error("Error fetching subject assignments:", error);
    return res.status(500).json({ 
      error: "Failed to fetch subject assignments: " + error.message 
    });
  }
});

// // DELETE - Remove a subject assignment from a teacher
// router.delete("/:teacherId", async (req, res) => {
//   try {
//     const { teacherId } = req.params;
//     const { course, subject } = req.body;

//     // Validate request parameters
//     if (!teacherId || !course || !subject) {
//       return res.status(400).json({ 
//         error: "Missing required fields. Teacher ID, course, and subject are required." 
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

//     // Remove the subject assignment from the teacher
//     const result = await db.collection("teachers").updateOne(
//       { _id: new ObjectId(teacherId) },
//       { 
//         $pull: { assignedSubjects: { course, subject } },
//         $set: { updated_at: new Date(), updated_by: admin_id }
//       }
//     );

//     if (result.modifiedCount === 0) {
//       return res.status(404).json({ 
//         error: "Subject assignment not found or teacher not found" 
//       });
//     }

//     return res.status(200).json({ 
//       message: "Subject assignment removed successfully",
//       teacherId,
//       course,
//       subject
//     });
//   } catch (error) {
//     console.error("Error removing subject assignment:", error);
//     return res.status(500).json({ 
//       error: "Failed to remove subject assignment: " + error.message 
//     });
//   }
// });

module.exports = router; 