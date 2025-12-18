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
    
    // Check for admin first, then fallback to teacher
    const admin = await db.collection("admins").findOne({ email });
    const user = admin || await db.collection("teachers").findOne({ email });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const name = user.name;
    const id = user._id;
    const userType = admin ? "admin" : "teacher";

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

    if (data.add == 2) {
      let count = 0;
      let errors = [];
      
      // Process bulk competencies with Promise.all for better error handling
      const results = await Promise.all(
        data.fileData.map(async (e) => {
          try {
            if (!e.competency_name) {
              return { error: "Missing competency name" };
            }
            
            const competencyId = await idGenerate();
            const result = await db.collection("competencies").insertOne({
              competency_name: e.competency_name,
              competency_id: competencyId,
              subject_id: data.subject_id,
              active: true, // Ensure active is set to true
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
              return { success: true, competency_id: competencyId };
            } else {
              return { error: "Failed to insert competency" };
            }
          } catch (err) {
            return { error: err.message };
          }
        })
      );
      
      // Count errors
      const errorCount = results.filter(r => r.error).length;
      
      if (count > 0) {
        return res.status(200).json({ 
          message: `Added ${count} competencies${errorCount > 0 ? `, failed to add ${errorCount}` : ''}` 
        });
      } else {
        return res.status(400).json({ error: "Failed to add any competencies" });
      }
    } else {
      // Add single competency
      const competencyId = await idGenerate();
      const result = await db.collection("competencies").insertOne({
        competency_name: data.competency,
        competency_id: competencyId,
        subject_id: data.subject_id,
        active: true, // Ensure active is set to true
        created_at: new Date(),
        created_by: {
          name,
          id,
          email,
          type: userType,
        },
      });
      
      if (result.insertedId) {
        return res.status(200).json({ message: "Competency added successfully" });
      } else {
        return res.status(400).json({ error: "Failed to add competency" });
      }
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
