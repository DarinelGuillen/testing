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

    let totalUsers = users.length;
    let totalVerifiedClaims = 0;
    let totalGlobal = 0;


    users.forEach(user => {
      let userScoreSum = 0;
      if (user.processed_claims) {
        user.processed_claims.forEach(claim => {
          userScoreSum += claim.confidence_score;
        });
        totalVerifiedClaims += user.processed_claims.length;
      }
      user.rawScore = userScoreSum;
      totalGlobal += userScoreSum;
    });


    users.forEach(user => {
      user.relative_percentage = totalGlobal > 0 ? (user.rawScore / totalGlobal) * 100 : 0;
    });

    const averageScore = totalUsers > 0
      ? users.reduce((sum, user) => sum + user.relative_percentage, 0) / totalUsers
      : 0;

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
  console.log("fetch tweets ");
  try {
    const { startDate, endDate, influencerName, tweetCount } = req.query;
    const desiredCount = Number(tweetCount) || 5;
    const fakeTweets = readJSONFile(fakeTweetsPath).tweets || [];

    // Filtrar tweets según los criterios proporcionados
    const filteredTweets = fakeTweets.filter((t) => {
      const tweetDate = new Date(t.date).getTime();
      const from = startDate ? new Date(startDate).getTime() : 0;
      const to = endDate ? new Date(endDate).getTime() : Date.now();
      const validDate = tweetDate >= from && tweetDate <= to;
      const validName = !influencerName || t.influencerName === influencerName.toString();
      return validDate && validName;
    });

    // Tomar la cantidad solicitada de tweets filtrados
    let limitedTweets = filteredTweets.slice(0, desiredCount);

    // Si no se alcanzó la cantidad deseada con los filtros, complementar con otros tweets sin filtrar
    if (limitedTweets.length < desiredCount) {
      const additionalNeeded = desiredCount - limitedTweets.length;
      // Seleccionar tweets no incluidos en los filtrados
      const remainingTweets = fakeTweets.filter(t => !filteredTweets.includes(t));
      const extraTweets = remainingTweets.slice(0, additionalNeeded);
      limitedTweets = limitedTweets.concat(extraTweets);
    }

    console.log("Tweets a devolver:", limitedTweets);
    return res.json(limitedTweets);
  } catch (err) {
    console.error("Error retrieving tweets:", err);
    return res.status(500).json({ error: "Error retrieving tweets" });
  }
});



app.post("/api/admin/analyze", async (req, res) => {
  const { tweets, apiKey } = req.body;


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
