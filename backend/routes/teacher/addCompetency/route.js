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

      const competency = await db
        .collection("competencies")
        .findOne({ competency_id: a });

      if (competency) {
        return idGenerate(); // Regenerate if already exists
      } else {
        return a; // Return numeric ID
      }
    };

    const competencyId = await idGenerate();

    if (user) {
      name = user.name;
      id = user._id;
      if (data.add == 2) {
        let count=0
        data.fileData.forEach(async (e) => {
          const competencyId = await idGenerate();
          const log = await db.collection("competencies").insertOne({
            competency_name: e.competency_name,
            competency_id: competencyId,
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
          if(log){
            count=count+1;
          }
        });
        res.status(200).json({ message: `Added ${count} competencies` });
      }
      else{
        const log = await db.collection("competencies").insertOne({
          competency_name: data.competency,
          competency_id: competencyId,
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
          res.status(200).json({ message: "Success full competency log" });
        } else {
          res.status(400).json({ error: "add competency not done" });
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
