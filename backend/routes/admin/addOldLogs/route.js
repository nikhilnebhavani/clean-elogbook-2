const express = require("express");
const router = express.Router();
const clientPromise = require("../../../lib/mongodb");
const CryptoJS = require("crypto-js");
const { ObjectId } = require("mongodb");

router.post("/", async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db("elogbook");
    const { add, fileData, course_id, subject_id } = req.body;

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

    // Check admin or teacher
    const admin = await db.collection("admins").findOne({ email });
    const user = admin || (await db.collection("teachers").findOne({ email }));
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const name = user.name;
    const id = user._id;
    const userType = admin ? "admin" : "teacher";

    // --- LOGS ADDITION ---
    if (add === 1) {
      const processedLogs = fileData.map((log) => ({
        ...log,
        student_id: new ObjectId(log.student_id),
        competency_id: parseInt(log.competency_id) || 0,
        skill_id: parseInt(log.skill_id),
        course_id: parseInt(course_id),
        subject_id: parseInt(subject_id),
        created_at: new Date(log.created_at),
        initialDate: log.initialDate || "-",
      }));

      const result = await db.collection("logs").insertMany(processedLogs);
      if (result.insertedCount > 0) {
        return res.status(200).json({
          message: `Successfully added ${result.insertedCount} logs`,
          insertedCount: result.insertedCount,
        });
      } else {
        return res.status(500).json({ error: "Failed to add logs" });
      }
    }

    // --- SKILLS ADDITION (with auto competency creation) ---
    if (add === 2) {
      const failedRows = [];
      let skillCount = 0;
      let competencyCount = 0;
      const createdCompetencies = [];

      const generateId = async (collection, field) => {
        const newId = Math.floor(100000 + Math.random() * 900000);
        const exists = await db
          .collection(collection)
          .findOne({ [field]: newId });
        return exists ? await generateId(collection, field) : newId;
      };

      await Promise.all(
        fileData.map(async (e) => {
          try {
            if (!e.skill_name || !e.subject_name || !e.competency_name || !e.course_name) {
              failedRows.push({ ...e, error: "Missing required fields" });
              return;
            }

            const course = await db
              .collection("courses")
              .findOne({ course_name: e.course_name });

            if (!course) {
              failedRows.push({ ...e, error: "Course not found" });
              return;
            }

            // 2. Check if subject exists under that course
            const subject = await db
              .collection("subjects")
              .findOne({ subject_name: e.subject_name, course_id: course.course_id });

            if (!subject) {
              failedRows.push({
                ...e,
                error: "Subject not found in this course",
              });
              return;
            }

            let competency = await db
              .collection("competencies")
              .findOne({ competency_name: e.competency_name,
	                 subject_id: subject.subject_id
	      });

            // If competency does not exist, create it
            if (!competency) {
              const newCompId = await generateId(
                "competencies",
                "competency_id"
              );
              const result = await db.collection("competencies").insertOne({
                competency_name: e.competency_name,
                competency_id: newCompId,
                subject_id: parseInt(subject.subject_id),
                active: true,
                created_at: new Date(),
                created_by: { name, id, email, type: userType },
              });

              if (!result.insertedId) {
                failedRows.push({ ...e, error: "Failed to create competency" });
                return;
              }

              competency = { competency_id: newCompId };
              competencyCount++;
              createdCompetencies.push(e.competency_name);
            }

            const skillId = await generateId("skills", "skill_id");

            const insertResult = await db.collection("skills").insertOne({
              skill_name: e.skill_name,
              skill_id: skillId,
              competency_id: competency.competency_id,
              subject_id: parseInt(subject.subject_id),
              active: true,
              created_at: new Date(),
              created_by: { name, id, email, type: userType },
            });

            if (insertResult.insertedId) {
              skillCount++;
            } else {
              failedRows.push({ ...e, error: "Skill insert failed" });
            }
          } catch (err) {
            failedRows.push({ ...e, error: err.message });
          }
        })
      );

      return res.status(200).json({
        message: `✅ Added ${skillCount} skills${
          competencyCount > 0 ? ` and ${competencyCount} new competencies` : ""
        }.`,
        createdCompetencies,
        failedRows,
      });
    }

    return res.status(400).json({ error: "Invalid add type in request." });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
