// UserInfo.tsx

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
        const localStr = localStorage.getItem("chatGPTClaims");
        const localClaims = localStr ? JSON.parse(localStr) : [];
        const userClaims = localClaims.filter(
          (c: any) => c.userId === data.username
        );
        setMergedClaims([
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
        ]);
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
          <p>Name: {user.username}</p>
          <p>Followers: {user.followers_count}</p>
          <p>Score: {user.leaderboard_score}</p>
          <h2>Claims</h2>
          <ul>
            {mergedClaims.map((c) => (
              <li key={c._id}>
                {c.text} | {c.verification_status} | {c.confidence_score}
              </li>
            ))}
          </ul>
        </>
      )}
      <Link to="/">Home</Link>
    </>
  );
}

export default UserInfo;
