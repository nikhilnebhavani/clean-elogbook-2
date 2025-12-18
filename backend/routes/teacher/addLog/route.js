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
    const user = await db.collection("students").findOne({ email });
    let name, student_id;

    if(user){
      name=user.name;
      student_id=user._id;
      const log = await db.collection("logs").insertOne({
        student_id,
        student_name: name,
        student_email: email,
        course_id: data.course_id,
        subject_id: data.subject_id,
        competency_id: data.competency_id,
        skill_id: data.skill_id,
        skillWiseWork: parseInt(data.skillWiseWork),
        noOfTimeProcedure: parseInt(data.noOfTimeProcedure, 10),
        fromDate: data.fromDate,
        toDate: data.toDate,
        nameOfActivity: data.nameOfActivity,
        fileUrl: data.fileUrl,
        feedbackRecivied: data.feedbackReceived == 1 ? true : false,
        student_remark: data.studentReflection,
        verified:false,
        created_at: new Date(),
      });
      if(log){
        res.status(200).json({message:"Success full add log"})
      }
      else{
        res.status(400).json({ error: "add log not done" });
      }
    }
    else{
      res.status(404).json({error:"student not found"})
    }

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
