/********************************************
 * UserInfo.tsx
 ********************************************/
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

function UserInfo() {
  const [user, setUser] = useState<any>(null);
  const location = useLocation();
  const [mergedClaims, setMergedClaims] = useState<any[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const userId = params.get("id");
    if (!userId) return;

    fetch(`/api/users/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setUser(data);

        // Ejemplo de claims guardados en localStorage (opcional)
        const localStr = localStorage.getItem("chatGPTClaims");
        const localClaims = localStr ? JSON.parse(localStr) : [];
        // Filtrar los que correspondan a este usuario, si aplica
        const userClaims = localClaims.filter(
          (c: any) => c.userId === data.username
        );

        // Combinamos: lo de la DB con lo del localStorage
        const combined = [
          ...(data.processed_claims || []),
          ...userClaims.map((claim: any) => ({
            _id: claim._id,
            text: claim.text,
            categoria: claim.categoria,
            verification_status: claim.verification_status,
            confidence_score: claim.confidence_score,
            tweet_id: claim.tweet_id,
            date: claim.date,
          })),
        ];

        setMergedClaims(combined);
      })
      .catch(() => {});
  }, [location.search]);

  return (
    <>
      <h1>User Info</h1>
      {!user ? (
        <p>No user selected</p>
      ) : (
        <>
          <p>
            <strong>Name:</strong> {user.username}
          </p>
          <p>
            <strong>Followers:</strong> {user.followers_count}
          </p>
          <p>
            <strong>Score:</strong> {user.leaderboard_score}
          </p>

          <h2>Claims</h2>
          {mergedClaims.length === 0 ? (
            <p>No claims available.</p>
          ) : (
            <table
              border="1"
              cellPadding="10"
              style={{ borderCollapse: "collapse", width: "100%" }}
            >
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Text</th>
                  <th>Category</th>
                  <th>Verification Status</th>
                  <th>Confidence Score</th>
                  <th>Tweet ID</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {mergedClaims.map((claim) => (
                  <tr key={claim._id}>
                    <td>{claim._id}</td>
                    <td>{claim.text}</td>
                    <td>{claim.categoria}</td>
                    <td>{claim.verification_status || "N/A"}</td>
                    <td>
                      {claim.confidence_score !== undefined
                        ? `${(claim.confidence_score * 100).toFixed(2)}%`
                        : "N/A"}
                    </td>
                    <td>{claim.tweet_id}</td>
                    <td>
                      {claim.date
                        ? new Date(claim.date).toLocaleString()
                        : "Invalid Date"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
      <Link to="/">Home</Link>
    </>
  );
}

export default UserInfo;
