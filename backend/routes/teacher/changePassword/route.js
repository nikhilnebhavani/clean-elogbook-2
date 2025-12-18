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
    const password = data.password;

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

    const encryptedPassword = CryptoJS.AES.encrypt(
      password,
      process.env.PASSWORD_SECRET
    ).toString();

    const changePassword = await db.collection("teachers").findOneAndUpdate({ email }, {$set : {password: encryptedPassword} });

    if(changePassword){
      res.status(200).json({ ok: true });
    }
    else{
      res.status(400).json({ message: "user not found" });
    }

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
