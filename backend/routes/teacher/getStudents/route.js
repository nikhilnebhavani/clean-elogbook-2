const express = require("express");
const router = express.Router();
const clientPromise = require("../../../lib/mongodb");
const CryptoJS = require("crypto-js");
const { ObjectId } = require("mongodb");

router.get("/", async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db("elogbook");

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Unauthorized: No valid token provided" });
    }

    const token = authHeader.split(" ")[1];

    let decryptedData;
    try {
      decryptedData = CryptoJS.AES.decrypt(
        token,
        process.env.TOKEN_SECRET
      ).toString(CryptoJS.enc.Utf8);
      if (!decryptedData) throw new Error("Decryption failed");
    } catch (err) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    const email = JSON.parse(decryptedData);
    const teacher = await db.collection("teachers").findOne({ email });

    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    const studentIds = teacher.students.map((id) => new ObjectId(id)); // Ensure proper ObjectId conversion
    const students = await db
      .collection("students")
      .find({ _id: { $in: studentIds } })
      .toArray();

    res.status(200).json({ students });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error: " + error.message });
  }
});

module.exports = router;
