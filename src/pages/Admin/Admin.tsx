

import { Link } from "react-router-dom";
import { useState } from "react";

function Admin() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [influencerName, setInfluencerName] = useState("");
  const [tweetCount, setTweetCount] = useState(5);
  const [fetchedTweets, setFetchedTweets] = useState<any[]>([]);
  const [analysisResults, setAnalysisResults] = useState<any[]>([]);

  const fetchTweets = () => {
    const params = new URLSearchParams({
      startDate,
      endDate,
      influencerName,
      tweetCount: tweetCount.toString()
    });

    fetch(`/api/admin/tweets?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setFetchedTweets(data);
      })
      .catch((err) => console.error("Error fetching tweets:", err));
  };

  const analyzeTweets = () => {
    fetch("/api/admin/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tweets: fetchedTweets })
    })
      .then((res) => res.json())
      .then((data) => {
        setAnalysisResults(data);
      })
      .catch((err) => console.error("Error analyzing tweets:", err));
  };

  return (
    <>
      <h1>Admin Page</h1>

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
            Text: {result.text} | Status: {result.verification_status} | Score:{" "}
            {result.confidence_score}
          </li>
        ))}
      </ul>

      <Link to="/">Go back to Home</Link>
    </>
  );
}

export default Admin;
