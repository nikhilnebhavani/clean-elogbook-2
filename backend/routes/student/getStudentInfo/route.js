const express = require('express');
const router = express.Router();
const clientPromise = require("../../../lib/mongodb");
const CryptoJS = require("crypto-js");

router.get('/', async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db("elogbook");
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
      res.status(200).json({
        name: student.name,
        email: student.email,
        enroll: student.enrollNo,
        courses: student.courses,
      });
    } else {
      res.status(404).json({ error: "Something Went Wrong" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message + "ok"});
  }
});

module.exports = router;
