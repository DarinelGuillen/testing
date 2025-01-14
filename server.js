// server.js (Plain JavaScript)

import express from "express";
import fs from "fs";
import path from "path";
import bodyParser from "body-parser";
import axios from "axios";

const app = express();
app.use(bodyParser.json());

const __dirname = path.resolve();
const dbPath = path.join(__dirname, "db.json");
const fakeTweetsPath = path.join(__dirname, "fakeTweets.json");

function readJSONFile(filePath) {
  const data = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(data);
}

function writeJSONFile(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

app.get("/api/leaderboard", (req, res) => {
  try {
    const dbData = readJSONFile(dbPath);
    const users = dbData.users || [];

    const totalUsers = users.length;
    let totalVerifiedClaims = 0;
    let totalScore = 0;

    users.forEach((user) => {
      totalScore += user.leaderboard_score || 0;
      if (user.processed_claims) {
        totalVerifiedClaims += user.processed_claims.length;
      }
    });

    const averageScore = totalUsers > 0 ? totalScore / totalUsers : 0;

    return res.json({
      users,
      totalUsers,
      totalVerifiedClaims,
      averageScore,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get("/api/users/:id", (req, res) => {
  try {
    const dbData = readJSONFile(dbPath);
    const user = dbData.users.find((u) => u._id === req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get("/api/admin/tweets", (req, res) => {
  const { startDate, endDate, influencerName, tweetCount } = req.query;
  const fakeTweets = readJSONFile(fakeTweetsPath).tweets || [];

  const filteredTweets = fakeTweets.filter((t) => {
    const tweetDate = new Date(t.date).getTime();
    const from = startDate ? new Date(startDate).getTime() : 0;
    const to = endDate ? new Date(endDate).getTime() : Date.now();
    const validDate = tweetDate >= from && tweetDate <= to;
    const validName =
      !influencerName || t.influencerName === influencerName.toString();
    return validDate && validName;
  });

  const limitedTweets = filteredTweets.slice(0, Number(tweetCount) || 5);
  return res.json(limitedTweets);
});

app.post("/api/admin/analyze", async (req, res) => {
  const { tweets } = req.body;
  if (!tweets || !Array.isArray(tweets)) {
    return res.status(400).json({ error: "Missing or invalid tweets array" });
  }

  try {
    const results = [];

    for (const tweet of tweets) {
      const prompt = `Here is a tweet from an influencer: "${tweet.text}". Identify any claims related to health in the text. For each claim: 1. Verify if it is true, questionable, or false. 2. Assign a confidence score based on scientific evidence. 3. Return a brief summary.`;

      // Mock response (instead of real ChatGPT call):
      results.push({
        text: tweet.text,
        categoria: "health",
        verification_status: "Verdadero",
        confidence_score: 0.95,
      });
    }

    console.log("Analysis results:", results);
    return res.json(results);
  } catch (error) {
    return res.status(500).json({ error: "Error analyzing tweets" });
  }
});

app.post("/api/users/:id/claims", (req, res) => {
  const { id } = req.params;
  const newClaim = req.body;
  const dbData = readJSONFile(dbPath);
  const userIndex = dbData.users.findIndex((u) => u._id === id);
  if (userIndex === -1) {
    return res.status(404).json({ error: "User not found" });
  }

  if (!dbData.users[userIndex].processed_claims) {
    dbData.users[userIndex].processed_claims = [];
  }

  dbData.users[userIndex].processed_claims.push(newClaim);
  writeJSONFile(dbPath, dbData);

  return res.json({ message: "Claim added successfully" });
});

app.listen(3000, () => {
  console.log("Local server running on http://localhost:3000");
});
