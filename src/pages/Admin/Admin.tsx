/********************************************
 * Admin.tsx
 ********************************************/
import { Link } from "react-router-dom";
import { useState } from "react";

function Admin() {
  const [apiKey, setApiKey] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [influencerName, setInfluencerName] = useState("");
  const [tweetCount, setTweetCount] = useState(5);
  const [fetchedTweets, setFetchedTweets] = useState([]);
  const [analysisResults, setAnalysisResults] = useState([]);
  const [userId, setUserId] = useState("");

  // Obtener tweets
  const fetchTweets = async () => {
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        influencerName,
        tweetCount: tweetCount.toString(),
      });

      const res = await fetch(`/api/admin/tweets?${params.toString()}`);
      if (!res.ok) {
        console.error("Error fetching tweets:", res.statusText);
        return;
      }
      const data = await res.json();
      setFetchedTweets(data);
    } catch (err) {
      console.error("Error fetching tweets:", err);
    }
  };

  // Analizar tweets
  const analyzeTweets = async () => {
    try {
      const res = await fetch(`/api/admin/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tweets: fetchedTweets, apiKey }),
      });
      if (!res.ok) {
        console.error("Error analyzing tweets:", res.statusText);
        return;
      }
      const data = await res.json();

      const normalizedData: any[] = [];

      data.forEach((item: any, idx: number) => {
        const correspondingTweet = fetchedTweets[idx] || {};
        if (item.claims && Array.isArray(item.claims)) {
          item.claims.forEach((claim: any) => {
            const score = parseFloat(claim.confidence_score) || 0;
            normalizedData.push({
              _id: claim._id || `claim_${Math.random().toString(36).substr(2, 9)}`,
              text: claim.text || "",
              categoria: claim.categoria || "health",
              verification_status: claim.verification_status || "Cuestionable",
              confidence_score: score < 0 ? 0 : score > 1 ? 1 : score,
              tweet_id: correspondingTweet.id || "",
              date: new Date().toISOString(),
            });
          });
        }
      });

      setAnalysisResults(normalizedData);
    } catch (err) {
      console.error("Error analyzing tweets:", err);
    }
  };



  // Guardar claims en un usuario
const saveClaims = async () => {
  try {
    for (const result of analysisResults) {
      const res = await fetch(`/api/users/${userId}/claims`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      });
      if (!res.ok) {
        console.error("Error saving claim:", res.statusText);
      } else {
        console.log(`Claim saved for user ${userId}:`, await res.json());
      }
    }
  } catch (err) {
    console.error("Error saving claims:", err);
  }
};


  return (
    <>
      <h1>Admin Page</h1>

      <div>
        <label>OpenAI API Key:</label>
        <input
          type="text"
          placeholder="sk-..."
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
      </div>

      <div>
        <label>Start Date:</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </div>

      <div>
        <label>End Date:</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>

      <div>
        <label>Influencer Name:</label>
        <input
          type="text"
          value={influencerName}
          onChange={(e) => setInfluencerName(e.target.value)}
        />
      </div>

      <div>
        <label>Tweet Count:</label>
        <input
          type="number"
          value={tweetCount}
          onChange={(e) => setTweetCount(Number(e.target.value))}
        />
      </div>

      <div>
        <label>User ID (to save claims):</label>
        <input
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
      </div>

      <button onClick={fetchTweets}>Fetch Tweets</button>

      <h2>Fetched Tweets</h2>
      <ul>
        {fetchedTweets.map((tweet: any) => (
          <li key={tweet.id}>{tweet.text}</li>
        ))}
      </ul>

      <button onClick={analyzeTweets}>Analyze Tweets</button>

      <h2>Analysis Results</h2>
      <ul>
  {analysisResults.map((result: any, idx) => (
    <li key={idx}>
      Text: {result.text} | Verification: {result.verification_status} | Score: {result.confidence_score}
    </li>
  ))}
</ul>


      <button onClick={saveClaims}>Save Claims</button>

      <Link to="/">Go back to Home</Link>
    </>
  );
}

export default Admin;
