const express = require("express");
const router = express.Router();
const clientPromise = require("../../../lib/mongodb");
const CryptoJS = require("crypto-js");
const { ObjectId } = require("mongodb");

router.post("/", async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db("elogbook");
    const { subject_id, selectedStudent } = req.body;
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

    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    // Find the student using the correct ID
    const student = await db
      .collection("students")
      .findOne({ _id: new ObjectId(selectedStudent.id) });
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Find the subject entry
    const subjectIndex = student.score.findIndex(
      (item) => item.subject_id === parseInt(subject_id)
    );

    if (subjectIndex === -1) {
      return res.status(404).json({ error: "Subject not found for this student" });
    }

    try {
      // Process all score updates in parallel
      const updatePromises = selectedStudent.scores.map(async (scoreItem) => {
        const titleIndex = student.score[subjectIndex].arr.findIndex(
          (item) => item.title === scoreItem.title
        );
    
        if (titleIndex === -1) {
          throw new Error(`Title "${scoreItem.title}" not found for this subject`);
        }
    
        // Update the score and comment for the specific title
        const result = await db.collection("students").updateOne(
          { 
            _id: new ObjectId(selectedStudent.id),
            "score.subject_id": parseInt(subject_id)
          },
          { 
            $set: { 
              [`score.${subjectIndex}.arr.${titleIndex}.score`]: parseInt(scoreItem.score),
              [`score.${subjectIndex}.arr.${titleIndex}.comment`]: scoreItem.comment
            }
          }
        );
        
        return result;
      });

      // Wait for all updates to complete
      await Promise.all(updatePromises);
      res.status(200).json({ message: "Scores updated successfully" });
    } catch (error) {
      console.error("Error updating scores:", error);
      res.status(400).json({ 
        error: error.message || "Failed to update scores",
        details: error.details || undefined
      });
    }
  } catch (error) {
    console.error("Unexpected error in updateScore route:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router; 