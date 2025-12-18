const express = require("express");
const router = express.Router();
const clientPromise = require("../../lib/mongodb");
const CryptoJS = require("crypto-js");

router.post("/", async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db("elogbook");
    const data = req.body;
    const { email, password, mode } = data;

    const student = await db.collection("students").findOne({ email });

    if (student) {
      if (mode === "manual") {
        const decryptedPassword = CryptoJS.AES.decrypt(
          student.password,
          process.env.PASSWORD_SECRET
        ).toString(CryptoJS.enc.Utf8);
        if (decryptedPassword !== password) {
          return res.status(404).json({ error: "Incorrect Password" });
        }
      }
      const token = CryptoJS.AES.encrypt(
        JSON.stringify(email),
        process.env.TOKEN_SECRET,
      ).toString();
      res.status(200).json({ token, type: "student" });
    } else {
      const teacher = await db.collection("teachers").findOne({ email });
      if (teacher) {
      if (mode === "manual") {
        const decryptedPassword = CryptoJS.AES.decrypt(
          teacher.password,
          process.env.PASSWORD_SECRET
        ).toString(CryptoJS.enc.Utf8);
        if (decryptedPassword !== password) {
          return res.status(404).json({ error: "Incorrect Password" });
        }
      }
      const token = CryptoJS.AES.encrypt(
        JSON.stringify(email),
        process.env.TOKEN_SECRET
      ).toString();
      res.status(200).json({ token, type: "teacher" });
    }
    else{
      const admin = await db.collection("admins").findOne({ email });
      if (admin) {
      if (mode === "manual") {
        const decryptedPassword = CryptoJS.AES.decrypt(
          admin.password,
          process.env.PASSWORD_SECRET
        ).toString(CryptoJS.enc.Utf8);
        if (decryptedPassword !== password) {
          return res.status(404).json({ error: "Incorrect Password" });
        }
      }
      const token = CryptoJS.AES.encrypt(
        JSON.stringify(email),
        process.env.TOKEN_SECRET
      ).toString();
      res.status(200).json({ token, type: "admin" });
    }
    else{
      res.status(404).json({ error: "Email Not Found" });
    }}}
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
