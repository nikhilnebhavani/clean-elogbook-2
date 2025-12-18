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

      const skill = await db
        .collection("skills")
        .findOne({ skill_id: a });

      if (skill) {
        return idGenerate(); // Regenerate if already exists
      } else {
        return a; // Return numeric ID
      }
    };

    if (data.add == 2) {
      let count = 0;
      let errors = [];
      
      // Process bulk skills with Promise.all for better error handling
      const results = await Promise.all(
        data.fileData.map(async (e) => {
          try {
            if (!e.skill_name) {
              return { error: "Missing skill name" };
            }
            
            const skillId = await idGenerate();
            const result = await db.collection("skills").insertOne({
              skill_name: e.skill_name,
              skill_id: skillId,
              competency_id: data.competency_id,
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
              return { success: true, skill_id: skillId };
            } else {
              return { error: "Failed to insert skill" };
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
          message: `Added ${count} skills${errorCount > 0 ? `, failed to add ${errorCount}` : ''}` 
        });
      } else {
        return res.status(400).json({ error: "Failed to add any skills" });
      }
    } else {
      // Add single skill
      const skillId = await idGenerate();
      const result = await db.collection("skills").insertOne({
        skill_name: data.skill,
        skill_id: skillId,
        competency_id: data.competency_id,
        subject_id: parseInt(data.subject_id),
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
        return res.status(200).json({ message: "Skill added successfully" });
      } else {
        return res.status(400).json({ error: "Failed to add skill" });
      }
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
