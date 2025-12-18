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
    const user = await db.collection("teachers").findOne({ email });
    let name, id;

    const idGenerate = async () => {
      const a = Math.floor(100000 + Math.random() * 900000); // Generates a 6-digit random number

      const skill = await db
        .collection("skills")
        .findOne({ skill_id: a });

      if (skill) {
        return idGenerate(); // Regenerate if already exists
      } else {
        return a; // Return numeric ID
      }
    };


    if (user) {
      name = user.name;
      id = user._id;
      if (data.add == 2) {
        let count = 0;
        data.fileData.forEach(async (e) => {
          const skillId = await idGenerate();
          const log = await db.collection("skills").insertOne({
            skill_name: e.skill_name,
            skill_id:skillId,
            competency_id: data.competency_id,
            subject_id: data.subject_id,
            active: true,
            created_at: new Date(),
            created_by: {
              name,
              id,
              email,
              type: "teacher",
            },
          });
          if (log) {
            count = count + 1;
          }
        });
        res.status(200).json({ message: `Added ${count} skills` });
      } else {
        const skillId = await idGenerate();

        const log = await db.collection("skills").insertOne({
          skill_name: data.skill,
          skill_id:skillId,
          competency_id: data.competency_id,
          subject_id: data.subject_id,
          active: true,
          created_at: new Date(),
          created_by: {
            name,
            id,
            email,
            type: "teacher",
          },
        });
        if (log) {
          res.status(200).json({ message: "Success full skill log" });
        } else {
          res.status(400).json({ error: "add skill not done" });
        }
      }
    } else {
      res.status(404).json({ error: "teacher not found" });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
