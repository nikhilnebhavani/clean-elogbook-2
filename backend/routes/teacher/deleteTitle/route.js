const express = require("express");
const router = express.Router();
const clientPromise = require("../../../lib/mongodb");
const CryptoJS = require("crypto-js");
const { ObjectId } = require("mongodb");

router.post("/", async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db("elogbook");
    const { subject_id, title } = req.body;
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

    // Find the scorecard entry for the given subject_id
    const scorecardIndex = teacher.scorecard.findIndex(
      (item) => item.subject_id === parseInt(subject_id)
    );

    if (scorecardIndex === -1) {
      return res.status(404).json({ error: "Subject not found in scorecard" });
    }

    // Find the title index in the titles array
    const titleIndex = teacher.scorecard[scorecardIndex].titles.indexOf(title);
    if (titleIndex === -1) {
      return res.status(404).json({ error: "Title not found" });
    }

    // Remove the title from the array
    teacher.scorecard[scorecardIndex].titles.splice(titleIndex, 1);

    // Update the teacher document with the modified scorecard
    const result = await db.collection("teachers").updateOne(
      { email },
      { $set: { scorecard: teacher.scorecard } }
    );

    if (result.modifiedCount > 0) {
      // Find all students who have this subject_id in their score array
      const students = await db.collection("students").find({
        "score": {
          $elemMatch: {
            subject_id: parseInt(subject_id)
          }
        }
      }).toArray();

      // Remove the title from each student's score array
      const updatePromises = students.map(student => {
        // Find the score entry with matching subject_id
        const scoreIndex = student.score.findIndex(s => s.subject_id === parseInt(subject_id));
        if (scoreIndex === -1) return null;

        // Filter out the title from the arr array
        const updatedArr = student.score[scoreIndex].arr.filter(item => item.title !== title);

        // Create a new score array with updated arr
        const updatedScore = [...student.score];
        updatedScore[scoreIndex] = {
          ...updatedScore[scoreIndex],
          arr: updatedArr
        };

        // Update the student document with the new score array
        return db.collection("students").updateOne(
          { _id: student._id },
          { $set: { score: updatedScore } }
        );
      }).filter(Boolean); // Remove any null promises

      // Wait for all student updates to complete
      await Promise.all(updatePromises);

      res.status(200).json({ 
        message: "Title deleted successfully",
        studentsUpdated: students.length
      });
    } else {
      res.status(500).json({ error: "Failed to delete title" });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 