// Admin.tsx

import { Link } from "react-router-dom";
import { useState } from "react";

function Admin() {
  const [apiKey, setApiKey] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [influencerName, setInfluencerName] = useState("");
  const [tweetCount, setTweetCount] = useState(5);
  const [fetchedTweets, setFetchedTweets] = useState<any[]>([]);
  const [analysisResults, setAnalysisResults] = useState<any[]>([]);

  // Remove the hardcoded baseURL and let the Vite proxy handle it
  const fetchTweets = async () => {
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        influencerName,
        tweetCount: tweetCount.toString(),
      });

      // Fetch from "/api/..." so the proxy can forward requests to localhost:3000
      const res = await fetch(`/api/admin/tweets?${params.toString()}`);
      if (!res.ok) {
        console.error("Error fetching tweets:", res.statusText);
        return;
      }
      const data = await res.json();
      console.log("/api/admin/tweets ",data[0]);

      setFetchedTweets(data);
    } catch (err) {
      console.error("Error fetching tweets:", err);
    }
  };

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
      console.log(data);

      setAnalysisResults(data);
      console.log(data);

    } catch (err) {
      console.error("Error analyzing tweets:", err);
    }
  };

  return (
    <>
      <h1>Admin Page</h1>

      <div>
        <label>OpenAI API Key:
       

        </label>
        <input
  type="text"
  placeholder="sk-..."
  value={apiKey}              // Use the state variable here
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

      <button onClick={fetchTweets}>Fetch Tweets</button>

      <h2>Fetched Tweets</h2>
      <ul>
        {fetchedTweets.map((tweet) => (
          <li key={tweet.id}>{tweet.text}</li>
        ))}
      </ul>

      <button onClick={analyzeTweets}>Analyze Tweets</button>

      <h2>Analysis Results</h2>
      <ul>
        {analysisResults.map((result, idx) => (
          <li key={idx}>
            Text: {result.text} | ChatGPT Response: {result.analysis}
          </li>
        ))}
      </ul>

      <Link to="/">Go back to Home</Link>
    </>
  );
}

export default Admin;
