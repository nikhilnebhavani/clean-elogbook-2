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

    const teacher = await db.collection("teachers").findOne({ email });

    if (teacher) {
      res.status(200).json({
        name: teacher.name,
        email: teacher.email,
        courses: teacher.courses,
        students: teacher.students,
      });
    } else {
      res.status(404).json({ error: "Something Went Wrong" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message + "ok"});
  }
});

module.exports = router;
