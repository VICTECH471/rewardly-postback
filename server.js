const express = require("express");
const admin = require("firebase-admin");

const app = express();
app.use(express.json());

// Initialize Firebase
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

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

// BitcoTask Postback (we'll complete this next)
app.get("/postback", async (req, res) => {
  res.send("Postback received");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
