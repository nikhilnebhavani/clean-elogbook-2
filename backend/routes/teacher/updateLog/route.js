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

    if (!user) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    // Check if this is a single log update or bulk verification
    if (data.log_id) {
      console.log(data.log_id)
      // Single log update case
      const updateResult = await db.collection("logs").findOneAndUpdate(
        { _id: new ObjectId(data.log_id) },
        {
          $set: {
            attemptActivity: parseInt(data.attemptActivity),
            decisionOfFaculty: parseInt(data.decisionOfFaculty),
            rating: parseInt(data.rating),
            teacher_remark: data.teacher_remark,
            verified: true,
            initialFaculty: user.name,
            initialDate: new Date()
          },
        },
        { returnDocument: 'after' }
      );
      console.log(updateResult)

      if (updateResult) {
        res.status(200).json({ message: "Log updated successfully" });
      } else {
        res.status(404).json({ error: "Log not found" });
      }
    } else if (data.logs && Array.isArray(data.logs)) {
      // Bulk verification case
      if (data.logs.length === 0) {
        return res.status(400).json({ error: "No logs selected for verification" });
      }

      const updatePromises = data.logs.map(async (logId) => {
        return db.collection("logs").findOneAndUpdate(
          { _id: new ObjectId(logId) },
          {
            $set: {
              attemptActivity: 1,
              decisionOfFaculty: 2,
              initialFaculty: user.name,
              rating: 2,
              verified: true,
              teacher_remark: "Verified",
              initialDate: new Date(),
            },
          }
        );
      });

      await Promise.all(updatePromises);
      res.status(200).json({ message: "Logs verified successfully" });
    } else {
      res.status(400).json({ error: "Invalid request format" });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
