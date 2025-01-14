

import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

function UserInfo() {
  const [user, setUser] = useState<any>(null);
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const userId = searchParams.get("id");
    if (!userId) return;

    fetch(`/api/users/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setUser(data);
      })
      .catch((err) => console.error("Error fetching user:", err));
  }, [location.search]);

  if (!user) {
    return (
      <>
        <h1>User Info</h1>
        <p>No user selected</p>
        <Link to="/">Home</Link>
      </>
    );
  }

  return (
    <>
      <h1>User Info</h1>
      <p>Name: {user.username}</p>
      <p>Leaderboard Score: {user.leaderboard_score}</p>
      <p>Follower Count: {user.followers_count}</p>
      <h2>Processed Claims:</h2>
      <ul>
        {user.processed_claims.map((claim: any) => (
          <li key={claim._id}>
            {claim.text} | Status: {claim.verification_status} | Score:{" "}
            {claim.confidence_score}
          </li>
        ))}
      </ul>
      <Link to="/">Home</Link>
    </>
  );
}

export default UserInfo;
