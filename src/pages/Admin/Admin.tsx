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
  const [fetchedTweets, setFetchedTweets] = useState<any[]>([]);
  const [analysisResults, setAnalysisResults] = useState<any[]>([]);
  const [userId, setUserId] = useState("");

  // Nuevos estados para la funcionalidad manual
  const [useManual, setUseManual] = useState(false);
  const [manualContent, setManualContent] = useState("");

  const fetchTweets = async () => {
    if (useManual) return; // No realiza fetch si se seleccionó modo manual

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

  const analyzeTweets = async () => {
    try {
      // Si se usa contenido manual, se envía como un único objeto dentro de un arreglo
      const payload = useManual
        ? { tweets: [{ text: manualContent }], apiKey }
        : { tweets: fetchedTweets, apiKey };

      const res = await fetch(`/api/admin/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.error("Error analyzing tweets:", res.statusText);
        return;
      }
      const data = await res.json();

      const normalizedData: any[] = [];

      data.forEach((item: any, idx: number) => {
        // Si se usa contenido manual, no hay tweets correlacionados, pero se mantiene la lógica
        const correspondingTweet = useManual ? {} : fetchedTweets[idx] || {};
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

      {/* Selector para usar contenido manual */}
      <div>
        <label>
          <input
            type="checkbox"
            checked={useManual}
            onChange={(e) => setUseManual(e.target.checked)}
          />
          Usar contenido manual en lugar de buscar tweets
        </label>
      </div>

      {/* Mostrar textarea para contenido manual si se selecciona */}
      {useManual && (
        <div>
          <label>Contenido Manual:</label>
          <textarea
            value={manualContent}
            onChange={(e) => setManualContent(e.target.value)}
            rows={10}
            cols={50}
            placeholder="Inserta aquí el texto completo..."
          />
        </div>
      )}

      {/* Mostrar campos de búsqueda solo si no se usa contenido manual */}
      {!useManual && (
        <>
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
        </>
      )}

      <div>
        <label>User ID (to save claims):</label>
        <input
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
      </div>

      {/* Botón de "Fetch Tweets" deshabilitado si se usa contenido manual */}
      {!useManual && <button onClick={fetchTweets}>Fetch Tweets</button>}

      {!useManual && (
        <>
          <h2>Fetched Tweets</h2>
          <ul>
            {fetchedTweets.map((tweet: any) => (
              <li key={tweet.id}>{tweet.text}</li>
            ))}
          </ul>
        </>
      )}

      <button onClick={analyzeTweets}>Analyze {useManual ? "Content" : "Tweets"}</button>

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
