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
    const user = await db.collection("teachers").findOne({ email });
    console.log(data)
    if (user) {
      const log = await db.collection("logs").findOneAndUpdate(
        { _id: new ObjectId(data.id) },
        {
          $set: {
            active: data.active ? true : false,
            update_by: {
              name: user.name,
              id: user._id,
              email: user.email,
              type: "teacher",
            },
            updated_at: new Date(),
          },
        }
      );
      if (log) {
        res.status(200).json({ message: "Success full skill update" });
      } else {
        res.status(400).json({ error: "Skill failed to update" });
      }
    } else {
      res.status(404).json({ error: "teacher not found" });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
