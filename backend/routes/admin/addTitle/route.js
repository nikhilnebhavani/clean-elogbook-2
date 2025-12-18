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

    // Check if title already exists
    if (teacher.scorecard[scorecardIndex].titles.includes(title)) {
      return res.status(400).json({ error: "Title already exists" });
    }

    // Add the new title to the array
    teacher.scorecard[scorecardIndex].titles.push(title);

    // Update the teacher document with the modified scorecard
    const result = await db.collection("teachers").updateOne(
      { email },
      { $set: { scorecard: teacher.scorecard } }
    );

    console.log(result)

    if (result.modifiedCount > 0) {
      // Find all students who have this subject_id in their score array
      const students = await db.collection("students").find({
        "score": {
          $elemMatch: {
            subject_id: parseInt(subject_id)
          }
        }
      }).toArray();

      console.log("Found students:", students.length); // Debug log

      // Add the new title to each student's score array
      const updatePromises = students.map(async student => {
        try {
          // Find the score entry with matching subject_id
          const scoreIndex = student.score.findIndex(s => s.subject_id === parseInt(subject_id));
          if (scoreIndex === -1) {
            console.log("No matching subject_id found for student:", student._id); // Debug log
            return null;
          }

          // Create new score entry
          const newScoreEntry = {
            title: title,
            comment: "",
            score: 0
          };

          // Update the student document by pushing the new entry to the arr array
          const updateResult = await db.collection("students").updateOne(
            { 
              _id: student._id,
              "score.subject_id": parseInt(subject_id)
            },
            { 
              $push: { 
                "score.$.arr": newScoreEntry 
              }
            }
          );

          if (updateResult.modifiedCount === 0) {
            console.log("Failed to update student:", student._id); // Debug log
          }

          return updateResult;
        } catch (error) {
          console.error("Error updating student:", student._id, error); // Debug log
          return null;
        }
      }).filter(Boolean); // Remove any null promises

      // Wait for all student updates to complete
      const updateResults = await Promise.all(updatePromises);
      const successfulUpdates = updateResults.filter(result => result && result.modifiedCount > 0).length;

      console.log("Update results:", updateResults); // Debug log

      res.status(200).json({ 
        message: "Title added successfully",
        studentsUpdated: successfulUpdates,
        totalStudents: students.length
      });
    } else {
      res.status(500).json({ error: "Failed to add title" });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
