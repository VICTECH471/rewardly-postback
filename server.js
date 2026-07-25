const express = require("express");
const admin = require("firebase-admin");

const app = express();

app.use(express.json());

// Home page
app.get("/", (req, res) => {
    res.send("Rewardly Postback Server is running ✅");
});

// Test endpoint
app.get("/test", (req, res) => {
    res.json({
        success: true,
        message: "Server is working!"
    });
});

// Placeholder for Bitcotask postback
app.get("/postback", async (req, res) => {
    res.send("Postback received");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
