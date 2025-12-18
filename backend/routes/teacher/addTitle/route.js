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

    // Extract token
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else {
      return res.status(401).json({ error: "Unauthorized, token missing" });
    }

    // Decrypt token
    let email;
    try {
      const decryptedData = CryptoJS.AES.decrypt(
        token,
        process.env.TOKEN_SECRET
      ).toString(CryptoJS.enc.Utf8);
      email = JSON.parse(decryptedData);
    } catch (err) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Find teacher
    const user = await db.collection("teachers").findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    const { subject_id, title, fileData, add } = data;

    if (!subject_id) {
      return res.status(400).json({ error: "Subject ID is required" });
    }

    const subjectIdNum = parseInt(subject_id);
    const subjectMatchValues = [
      subjectIdNum,
      subjectIdNum.toString(),
      subject_id, // in case it's already a string like "677138"
    ];

    // ✅ Ensure teacher has a scorecard and an entry for this subject
    if (!Array.isArray(user.scorecard) || user.scorecard.length === 0) {
      // No scorecard at all → create with this subject
      await db.collection("teachers").updateOne(
        { email },
        {
          $set: {
            scorecard: [
              {
                subject_id: subjectIdNum,
                titles: [],
              },
            ],
          },
        }
      );
    } else {
      // Has scorecard, check if this subject_id exists
      const hasSubject = user.scorecard.some(
        (s) => s.subject_id === subjectIdNum
      );

      if (!hasSubject) {
        // Add a new subject entry to scorecard
        await db.collection("teachers").updateOne(
          { email },
          {
            $push: {
              scorecard: {
                subject_id: subjectIdNum,
                titles: [],
              },
            },
          }
        );
      }
    }

    // ✅ Ensure ALL students of this teacher have a score entry for this subject
    const studentIds = Array.isArray(user.students) ? user.students : [];

    if (studentIds.length > 0) {
      const objectIds = studentIds.map((id) => new ObjectId(id));

      const studentsOfTeacher = await db
        .collection("students")
        .find({
          _id: { $in: objectIds }, // students belonging to this teacher
          "courses.subjects": {
            // any course having this subject
            $in: subjectMatchValues,
          },
        })
        .toArray();

      const initPromises = studentsOfTeacher
        .map((student) => {
          const hasScoreArray =
            Array.isArray(student.score) && student.score.length > 0;
          const hasSubjectScore =
            hasScoreArray &&
            student.score.some((s) => s.subject_id === subjectIdNum);

          // Case 1: no score array at all → create it
          if (!hasScoreArray) {
            return db.collection("students").updateOne(
              { _id: student._id },
              {
                $set: {
                  score: [
                    {
                      subject_id: subjectIdNum,
                      arr: [],
                    },
                  ],
                },
              }
            );
          }

          // Case 2: has score array but no entry for this subject → push new entry
          if (!hasSubjectScore) {
            return db.collection("students").updateOne(
              { _id: student._id },
              {
                $push: {
                  score: {
                    subject_id: subjectIdNum,
                    arr: [],
                  },
                },
              }
            );
          }

          // Case 3: already has subject → nothing to do
          return null;
        })
        .filter(Boolean);

      await Promise.all(initPromises);
    }

    if (add === 1) {
      let erors = [];
      // Add a single title
      const updateResult = await db
        .collection("teachers")
        .updateOne(
          { email, "scorecard.subject_id": parseInt(subject_id) },
          { $push: { "scorecard.$.titles": title } }
        );

      if (updateResult.modifiedCount > 0) {
        // Find all students who have this subject_id in their score array
        const students = await db
          .collection("students")
          .find({
            score: {
              $elemMatch: {
                subject_id: parseInt(subject_id),
              },
            },
          })
          .toArray();

        console.log("Found students:", students.length);

        // Add the new title to each student's score array
        const updatePromises = students
          .map(async (student) => {
            try {
              // Create new score entry
              const newScoreEntry = {
                title: title,
                comment: "",
                score: 0,
              };

              // Update the student document by pushing the new entry to the arr array
              const updateResult = await db.collection("students").updateOne(
                {
                  _id: student._id,
                  "score.subject_id": parseInt(subject_id),
                },
                {
                  $push: {
                    "score.$.arr": newScoreEntry,
                  },
                }
              );

              if (updateResult.modifiedCount === 0) {
                erors.push("Failed to update student:", student._id);
                console.log("Failed to update student:", student._id);
              }

              return updateResult;
            } catch (error) {
              erors.push("Error updating student:", student._id, error);
              console.error("Error updating student:", student._id, error);
              return null;
            }
          })
          .filter(Boolean);

        // Wait for all student updates to complete
        const updateResults = await Promise.all(updatePromises);
        const successfulUpdates = updateResults.filter(
          (result) => result && result.modifiedCount > 0
        ).length;

        return res.status(200).json({
          message: "Title added successfully",
          studentsUpdated: successfulUpdates,
          totalStudents: students.length,
        });
      } else {
        erors.push("Failed to add title to teacher's scorecard");
      }
      return res.status(400).json({ erors });
    } else if (add === 2) {
      // Add multiple titles from fileData
      if (!fileData || !Array.isArray(fileData)) {
        return res.status(400).json({ error: "Invalid fileData format" });
      }

      let count = 0;
      let totalStudentsUpdated = 0;

      for (const item of fileData) {
        // Update teacher's scorecard
        console.log(item);
        const updateResult = await db
          .collection("teachers")
          .updateOne(
            { email, "scorecard.subject_id": parseInt(subject_id) },
            { $push: { "scorecard.$.titles": item.title } }
          );

        if (updateResult.modifiedCount > 0) {
          count++;

          // Find all students who have this subject_id in their score array
          const students = await db
            .collection("students")
            .find({
              score: {
                $elemMatch: {
                  subject_id: parseInt(subject_id),
                },
              },
            })
            .toArray();

          // Add the new title to each student's score array
          const updatePromises = students
            .map(async (student) => {
              try {
                const newScoreEntry = {
                  title: item.title,
                  comment: "",
                  score: 0,
                };

                const updateResult = await db.collection("students").updateOne(
                  {
                    _id: student._id,
                    "score.subject_id": parseInt(subject_id),
                  },
                  {
                    $push: {
                      "score.$.arr": newScoreEntry,
                    },
                  }
                );

                if (updateResult.modifiedCount > 0) {
                  totalStudentsUpdated++;
                }

                return updateResult;
              } catch (error) {
                console.error("Error updating student:", student._id, error);
                return null;
              }
            })
            .filter(Boolean);

          await Promise.all(updatePromises);
        }
      }

      return res.status(200).json({
        message: `Added ${count} titles successfully`,
        studentsUpdated: totalStudentsUpdated,
      });
    } else {
      return res.status(400).json({ error: "Invalid add parameter" });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;

