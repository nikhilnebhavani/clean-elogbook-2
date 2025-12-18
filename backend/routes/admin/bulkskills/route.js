const express = require("express");
const router = express.Router();
const clientPromise = require("../../../lib/mongodb");
const CryptoJS = require("crypto-js");

router.post("/", async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db("elogbook");
    const data = req.body;
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

    const admin = await db.collection("admins").findOne({ email });
    const user = admin || (await db.collection("teachers").findOne({ email }));

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const name = user.name;
    const id = user._id;
    const userType = admin ? "admin" : "teacher";

    const idGenerate = async () => {
      const a = Math.floor(100000 + Math.random() * 900000);
      const skill = await db.collection("skills").findOne({ skill_id: a });
      return skill ? await idGenerate() : a;
    };

    if (data.add == 2) {
      let count = 0;
      const failedRows = [];

      const results = await Promise.all(
        data.fileData.map(async (e) => {
          try {
            if (!e.skill_name  || !e.subject_name || !e.competency_name) {
              failedRows.push({ ...e, error: "Missing required fields" });
              return;
            }

            const subject = await db
              .collection("subjects")
              .findOne({ subject_name: e.subject_name });
            const competency = await db
              .collection("competencies")
              .findOne({ competency_name: e.competency_name });

            if (!subject || !competency) {
              failedRows.push({
                ...e,
                error: !subject ? "Subject not found" : "Competency not found",
              });
              console.log(e.subject_name + " " + e.competency_name)
              return;
            }

            const skillId = await idGenerate();

            const result = await db.collection("skills").insertOne({
              skill_name: e.skill_name,
              skill_id: skillId,
              competency_id: competency.competency_id,
              subject_id: parseInt(subject.subject_id),
              active: true,
              created_at: new Date(),
              created_by: {
                name,
                id,
                email,
                type: userType,
              },
            });

            if (result.insertedId) {
              count++;
            } else {
              failedRows.push({ ...e, error: "Insert failed" });
            }
          } catch (err) {
            failedRows.push({ ...e, error: err.message });
          }
        })
      );

      if (count > 0) {
        return res.status(200).json({
          message: `Added ${count} skills${
            failedRows.length > 0 ? `, failed to add ${failedRows.length}` : ""
          }`,
          failed: failedRows,
        });
      } else {
        console.log(count + " " + failedRows.length)
        return res
          .status(400)
          .json({ error: "Failed to add any skills", failed: failedRows });
      }
    }

    // Single skill addition if needed
    return res
      .status(400)
      .json({ error: "Single add not implemented in this version" });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
