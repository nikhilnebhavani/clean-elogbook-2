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

    if (student) {
      const { course_id, subject_id } = data;
      const logs = await db
        .collection("logs")
        .find({ student_id: new ObjectId(student._id), course_id : parseInt(course_id), subject_id : parseInt(subject_id) })
        .toArray();

      if (logs) {
        res.status(200).json({
          logs
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
