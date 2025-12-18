const express = require("express");
const route = express.Router();
const clientPromise = require("../../../lib/mongodb");
const { ObjectId } = require('mongodb');
const ExcelJS = require('exceljs');
const multer = require('multer');
const upload = multer();

// Get students assigned to a specific teacher
route.get("/getTeacherStudents/:teacherId", async (req, res) => {
  try {
    const { teacherId } = req.params;
    
    if (!teacherId) {
      return res.status(400).json({
        error: "Teacher ID is required",
      });
    }
    
    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db("elogbook");
    
    // Create ObjectId from teacherId string
    let teacherObjectId;
    try {
      teacherObjectId = new ObjectId(teacherId);
    } catch (error) {
      console.error("Invalid teacherId format:", error);
      return res.status(400).json({
        error: "Invalid teacher ID format",
      });
    }
    
    // Find the teacher
    const teacher = await db.collection("teachers").findOne({ _id: teacherObjectId });
    
    if (!teacher) {
      return res.status(404).json({
        error: "Teacher not found",
      });
    }
    
    // Get the student IDs assigned to this teacher
    const studentIds = teacher.students || [];
    
    if (studentIds.length === 0) {
      return res.status(200).json({
        success: true,
        students: [],
        message: "No students assigned to this teacher",
      });
    }
    
    // Convert string IDs to ObjectIds for query
    const studentObjectIds = studentIds.map(id => {
      try {
        return new ObjectId(id);
      } catch (error) {
        console.warn(`Invalid student ID format: ${id}`);
        return null;
      }
    }).filter(id => id !== null);
    
    // Find all the students based on the IDs
    const assignedStudents = await db.collection("students").find({
      _id: { $in: studentObjectIds },
    }).toArray();
    
    return res.status(200).json({
      success: true,
      students: assignedStudents,
    });
  } catch (error) {
    console.error("Error getting teacher's students:", error);
    return res.status(500).json({
      error: "Internal server error: " + error.message,
    });
  }
});

// Assign a student to a teacher
route.post("/assignStudentTeacher", async (req, res) => {
  try {
    const { teacherId, studentIds } = req.body;
    
    if (!teacherId || !studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        error: "Teacher ID and at least one Student ID are required",
      });
    }
    
    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db("elogbook");
    
    // Create ObjectIds from string IDs
    let teacherObjectId;
    let studentObjectIds = [];
    
    try {
      teacherObjectId = new ObjectId(teacherId);
      studentObjectIds = studentIds.map(id => new ObjectId(id));
    } catch (error) {
      console.error("Invalid ID format:", error);
      return res.status(400).json({
        error: "Invalid ID format",
      });
    }
    
    // Find the teacher
    const teacher = await db.collection("teachers").findOne({ _id: teacherObjectId });
    
    if (!teacher) {
      return res.status(404).json({
        error: "Teacher not found",
      });
    }
    
    // Find all the students
    const students = await db.collection("students").find({
      _id: { $in: studentObjectIds }
    }).toArray();
    
    if (students.length !== studentIds.length) {
      return res.status(404).json({
        error: "One or more students not found",
      });
    }
    
    // Check if any of the students are already assigned to this teacher
    const studentArray = teacher.students || [];
    const alreadyAssigned = studentIds.filter(id => 
      studentArray.some(existingId => existingId.toString() === id.toString())
    );
    
    if (alreadyAssigned.length > 0) {
      return res.status(400).json({
        error: `Some students are already assigned to this teacher`,
        alreadyAssigned
      });
    }
    
    // Add the student IDs to the teacher's students array
    const updatedStudents = [...studentArray, ...studentIds];
    
    // Save the updated teacher
    await db.collection("teachers").updateOne(
      { _id: teacherObjectId },
      { $set: { students: updatedStudents } }
    );
    
    return res.status(200).json({
      success: true,
      message: "Students assigned to teacher successfully",
    });
  } catch (error) {
    console.error("Error assigning students to teacher:", error);
    return res.status(500).json({
      error: "Internal server error: " + error.message,
    });
  }
});

// Remove a student from a teacher
route.delete("/assignStudentTeacher/:teacherId", async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { studentId } = req.body;
    
    if (!teacherId || !studentId) {
      return res.status(400).json({
        error: "Teacher ID and Student ID are required",
      });
    }
    
    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db("elogbook");
    
    // Create ObjectId from teacherId string
    let teacherObjectId;
    try {
      teacherObjectId = new ObjectId(teacherId);
    } catch (error) {
      console.error("Invalid teacherId format:", error);
      return res.status(400).json({
        error: "Invalid teacher ID format",
      });
    }
    
    // Find the teacher
    const teacher = await db.collection("teachers").findOne({ _id: teacherObjectId });
    
    if (!teacher) {
      return res.status(404).json({
        error: "Teacher not found",
      });
    }
    
    // Check if the teacher has any assigned students
    if (!teacher.students || teacher.students.length === 0) {
      return res.status(404).json({
        error: "This teacher has no assigned students",
      });
    }
    
    // Convert to string for comparison
    const studentIdStr = studentId.toString();
    
    // Check if the student is actually assigned to this teacher
    if (!teacher.students.some(id => id.toString() === studentIdStr)) {
      return res.status(404).json({
        error: "This student is not assigned to this teacher",
      });
    }
    
    // Remove the student ID from the teacher's students array
    const updatedStudents = teacher.students.filter(id => id.toString() !== studentIdStr);
    
    // Save the updated teacher
    await db.collection("teachers").updateOne(
      { _id: teacherObjectId },
      { $set: { students: updatedStudents } }
    );
    
    return res.status(200).json({
      success: true,
      message: "Student removed from teacher successfully",
    });
  } catch (error) {
    console.error("Error removing student from teacher:", error);
    return res.status(500).json({
      error: "Internal server error: " + error.message,
    });
  }
});

// Get students assigned to a specific teacher
route.get("/getStudents/:teacherId", async (req, res) => {
    try {
        const client = await clientPromise;
        const db = client.db("elogbook");
        const teacherId = req.params.teacherId;

        const assignments = await db.collection("assignStudentTeacher").find({ teacherId: teacherId }).toArray();
        
        const studentIds = assignments.map(assignment => assignment.studentId);
        const students = await db.collection("students").find({ _id: { $in: studentIds.map(id => new ObjectId(id)) } }).toArray();

        res.json(students);
    } catch (error) {
        console.error("Error fetching students:", error);
        res.status(500).json({ error: "Failed to fetch students" });
    }
});

// Download Excel template for student-teacher assignments
route.get("/download", async (req, res) => {
    try {
        const client = await clientPromise;
        const db = client.db("elogbook");

        // Fetch all students and teachers
        const [students, teachers] = await Promise.all([
            db.collection("students").find({}).toArray(),
            db.collection("teachers").find({}).toArray()
        ]);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Student-Teacher Assignments');

        // Add headers
        worksheet.columns = [
            { header: 'Student ID', key: 'studentId', width: 20 },
            { header: 'Student Name', key: 'studentName', width: 30 },
            { header: 'Teacher ID', key: 'teacherId', width: 20 },
            { header: 'Teacher Name', key: 'teacherName', width: 30 }
        ];

        // Add data
        students.forEach(student => {
            worksheet.addRow({
                studentId: student._id.toString(),
                studentName: student.name,
                teacherId: '',
                teacherName: ''
            });
        });

        // Add teacher validation
        const teacherNames = teachers.map(t => t.name);
        const teacherIds = teachers.map(t => t._id.toString());
        
        worksheet.getColumn('teacherId').eachCell((cell, rowNumber) => {
            if (rowNumber > 1) { // Skip header
                worksheet.dataValidations.add(cell.address, {
                    type: 'list',
                    allowBlank: true,
                    formulae: [`"${teacherIds.join(',')}"`]
                });
            }
        });

        worksheet.getColumn('teacherName').eachCell((cell, rowNumber) => {
            if (rowNumber > 1) { // Skip header
                worksheet.dataValidations.add(cell.address, {
                    type: 'list',
                    allowBlank: true,
                    formulae: [`"${teacherNames.join(',')}"`]
                });
            }
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=student_teacher_assignments.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error("Error generating Excel file:", error);
        res.status(500).json({ error: "Failed to generate Excel file" });
    }
});

// Upload and process Excel file for bulk assignments
route.post("/upload", upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const client = await clientPromise;
        const db = client.db("elogbook");

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(req.file.buffer);

        const worksheet = workbook.getWorksheet(1);
        const assignments = [];
        const errors = [];

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) { // Skip header
                const [studentId, studentName, teacherId, teacherName] = row.values.slice(1);
                if (studentId && teacherId) {
                    assignments.push({
                        studentId: studentId.toString(),
                        teacherId: teacherId.toString()
                    });
                }
            }
        });

        if (assignments.length === 0) {
            return res.status(400).json({ error: "No valid assignments found in the file" });
        }

        // Validate all IDs
        for (const assignment of assignments) {
            try {
                new ObjectId(assignment.studentId);
                new ObjectId(assignment.teacherId);
            } catch (error) {
                errors.push(`Invalid ID format for student ${assignment.studentId} or teacher ${assignment.teacherId}`);
            }
        }

        if (errors.length > 0) {
            return res.status(400).json({ error: "Validation errors", errors });
        }

        // Process assignments
        for (const assignment of assignments) {
            const teacherObjectId = new ObjectId(assignment.teacherId);
            const studentObjectId = new ObjectId(assignment.studentId);

            // Update teacher's students array
            await db.collection("teachers").updateOne(
                { _id: teacherObjectId },
                { $addToSet: { students: studentObjectId.toString() } }
            );
        }

        res.json({ message: "Assignments updated successfully" });
    } catch (error) {
        console.error("Error processing Excel file:", error);
        res.status(500).json({ error: "Failed to process Excel file" });
    }
});

module.exports = route; 