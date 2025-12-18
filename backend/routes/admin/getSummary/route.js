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

    const student = await db.collection("students").findOne({ email });
    const skills = await db.collection("skills").find().toArray();
    const skillWiseWorks = [
      {id:2, name:"Assited"},
      {id:3, name:"Done Under Supervision"},
      {id:1, name:"Observed / Attended"},
      {id:4, name:"Able to do Indepedently / Presented"}
    ];

    if (student) {
      const { course_id, subject_id } = data;
      const logs = await db
        .collection("logs")
        .find({ student_email: email, course_id, subject_id })
        .toArray();

      if (logs) {
        let summary = [];
        logs.forEach(log => {
          const skill = skills.find(skill => skill.skill_id == log.skill_id);
          const skillWiseWork = skillWiseWorks.find(
            (work) => work.id == log.skillWiseWork
          );
          summary.push({
            skill: skill.skill_name,
            skillWiseWork: skillWiseWork.name,
            fromDate: log.fromDate,
            toDate: log.toDate,
            noOfProcedure: log.noOfProcedure,
          });
        });
        res.status(200).json({
          summary
        });
      }
      else{
        console.log("no log")
        res.status(400).json({ error: "No logs found" });
      }
    } else {
      res.status(400).json({ error: "User Not Found" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message + "ok" });
  }
});

module.exports = router;
