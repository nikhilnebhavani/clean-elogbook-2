const express = require("express");
const router = express.Router();
const clientPromise = require("../../../lib/mongodb");
const { ObjectId } = require("mongodb");
const CryptoJS = require("crypto-js");

router.post("/", async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db("elogbook");
    const data = req.body;
    const { password } = data;

    const encryptedPassword = CryptoJS.AES.encrypt(
      password,
      process.env.PASSWORD_SECRET
    ).toString();

    res.status(200).json({ encryptedPassword });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
