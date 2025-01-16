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
      - "text": version reducida del texto original del claim,
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
a


// Ejemplo de implementación en tu archivo server (app.js o index.js)

app.get("/api/users/:userId/duplicates", (req, res) => {
  const { userId } = req.params;

  // 1. Leer el archivo db.json
  const dbData = readJSONFile(dbPath);
  const user = dbData.users.find((u) => u._id === userId);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const claims = user.processed_claims || [];

  // 2. Agrupar claims por texto normalizado
  const duplicatesMap = {};
  for (const claim of claims) {
    const normalizedText = claim.text.toLowerCase().trim();
    if (!duplicatesMap[normalizedText]) {
      duplicatesMap[normalizedText] = [];
    }
    duplicatesMap[normalizedText].push(claim);
  }

  // 3. Filtrar solo los grupos que tengan +1 claim (i.e., duplicados)
  const duplicateGroups = Object.values(duplicatesMap).filter(
    (group) => group.length > 1
  );

  // Estructura de respuesta:
  // [
  //   [
  //     { _id: "claim_2", text: "La cafeína..." },
  //     { _id: "claim_3", text: "La cafeína..." },
  //     ...
  //   ],
  //   [...]
  // ]
  // Cada elemento del arreglo es un grupo de duplicados con claims repetidas
  return res.json({ duplicates: duplicateGroups });
});

app.post("/api/users/:userId/remove-duplicates", (req, res) => {
  const { userId } = req.params;
  const { duplicates } = req.body;
  // duplicates = [ [ "claim_2", "claim_3" ], [ "claim_5", "claim_7" ], ... ]

  // 1. Leer el archivo db.json
  const dbData = readJSONFile(dbPath);
  const userIndex = dbData.users.findIndex((u) => u._id === userId);

  if (userIndex === -1) {
    return res.status(404).json({ error: "User not found" });
  }

  // 2. Para cada grupo de IDs, eliminar todas excepto la primera
  if (duplicates && Array.isArray(duplicates)) {
    for (const group of duplicates) {
      // group es un array de IDs duplicadas. Ej: ["claim_2", "claim_3"]
      if (group.length < 2) continue; // Si solo hay una, no hay nada que eliminar

      // Conservar la primera, eliminar el resto
      const [keep, ...toRemove] = group;
      dbData.users[userIndex].processed_claims = dbData.users[
        userIndex
      ].processed_claims.filter((claim) => !toRemove.includes(claim._id));
    }

    // 3. Guardar los cambios
    writeJSONFile(dbPath, dbData);
    return res.json({ message: "Duplicates removed successfully" });
  } else {
    return res.status(400).json({
      error: "Invalid or missing 'duplicates' in request body",
    });
  }
});



export const handler = serverless(app);