import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import bodyParser from "body-parser";
import axios from "axios";

const app = express();
app.use(cors());
app.use(bodyParser.json());

const __dirname = path.resolve();
const dbPath = path.join(__dirname, "db.json");
const fakeTweetsPath = path.join(__dirname, "fakeTweets.json");

function readJSONFile(filePath) {
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data);
  }
  return {};
}

function writeJSONFile(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

app.get("/api/leaderboard", (req, res) => {
  try {
    const dbData = readJSONFile(dbPath);
    const users = dbData.users || [];

    // Encontrar el máximo número de claims procesados
    let maxClaims = users.reduce((max, user) => {
      const count = user.processed_claims ? user.processed_claims.length : 0;
      return count > max ? count : max;
    }, 0);

    let totalUsers = users.length;
    let totalVerifiedClaims = 0;
    let totalScore = 0;

    users.forEach(user => {
      const claimCount = user.processed_claims ? user.processed_claims.length : 0;
      totalVerifiedClaims += claimCount;
      const relativePercentage = maxClaims > 0 ? (claimCount / maxClaims) * 100 : 0;
      user.leaderboard_score = relativePercentage;
      totalScore += relativePercentage;
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
  try {
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

    const limitedTweets = filteredTweets.slice(
      0,
      Number(tweetCount) || 5
    );

    return res.json(limitedTweets);
  } catch (err) {
    console.error("Error retrieving tweets:", err);
    return res.status(500).json({ error: "Error retrieving tweets" });
  }
});

// POST /api/admin/analyze
app.post("/api/admin/analyze", async (req, res) => {
  const { tweets, apiKey } = req.body;

  // Validar datos de entrada
  if (!tweets || !Array.isArray(tweets)) {
    return res.status(400).json({ error: "Missing or invalid tweets array" });
  }
  if (!apiKey) {
    return res.status(400).json({ error: "Missing OpenAI API key" });
  }

  try {
    const results = [];

    for (const tweet of tweets) {
      const prompt = `Here is a tweet from an influencer: "${tweet.text}". Identify any health-related claims in the text. For each claim, provide a JSON object with the following properties:
      - "text": el texto original del claim,
      - "categoria": la categoría del claim,
      - "verification_status": "Verdadero", "Cuestionable" o "Falso",
      - "confidence_score": un número entre 0 y 1.

      Return the response strictly in valid JSON format.`;

      const openaiRes = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );

      const chatResponse = openaiRes.data.choices[0].message.content.trim();

      try {
        const parsedResponse = JSON.parse(chatResponse);
        results.push(parsedResponse);
      } catch (parseError) {
        console.error("Error parsing JSON from ChatGPT response:", parseError);
        results.push({ text: tweet.text, error: "Invalid JSON response", rawResponse: chatResponse });
      }
    }

    console.log("Analysis results:", JSON.stringify(results, null, 2));
    return res.json(results);
  } catch (error) {
    console.error("Error analyzing tweets:", error?.response?.data || error);
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
