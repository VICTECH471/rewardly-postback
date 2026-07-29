const express = require("express");
const admin = require("firebase-admin");
const md5 = require("md5");

const app = express();
app.use(express.json());

// Initialize Firebase
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const SECRET_KEY = process.env.BITCOTASK_SECRET_KEY;

// Home
app.get("/", (req, res) => {
  res.send("Rewardly Postback Server Running ✅");
});

// Test Firebase
app.get("/test", async (req, res) => {
  try {

    const users = await db.collection("users").limit(1).get();

    res.json({
      success: true,
      usersFound: users.size
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      error: err.message
    });

  }
});

// BitcoTasks Postback
app.get("/postback", async (req, res) => {

  try {

    const {
      subId,
      transId,
      reward,
      reward_name,
      offer_name,
      offer_type,
      payout,
      userIp,
      country,
      status,
      signature
    } = req.query;

    if (!subId || !transId || !reward || !signature) {
      return res.status(400).send("Missing Parameters");
    }

    // Verify signature
    const expectedSignature = md5(
      subId + transId + reward + SECRET_KEY
    );

    if (expectedSignature !== signature) {
      return res.status(403).send("Invalid Signature");
    }

    // Prevent duplicate credits
    const existing = await db
      .collection("offerwall_history")
      .where("transId", "==", transId)
      .limit(1)
      .get();

    if (!existing.empty) {
      return res.send("ok");
    }

    const userRef = db.collection("users").doc(subId);

    await db.runTransaction(async (transaction) => {

      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists) {
        throw new Error("User not found");
      }

      const currentBalance =
        Number(userDoc.data().balance || 0);

      let amount = Number(reward);

      // Chargeback
      if (Number(status) === 2) {
        amount = -Math.abs(amount);
      }

      transaction.update(userRef, {
        balance: currentBalance + amount
      });

      transaction.set(
        db.collection("offerwall_history").doc(),
        {
          userId: subId,
          transId: transId,
          offerName: offer_name,
          offerType: offer_type,
          reward: amount,
          rewardName: reward_name,
          payout: Number(payout || 0),
          userIp: userIp || "",
          country: country || "",
          status: Number(status),
          createdAt:
            admin.firestore.FieldValue.serverTimestamp()
        }
      );

    });

    return res.send("ok");

  } catch (err) {

    console.error(err);

    return res.status(500).send("Server Error");

  }

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
