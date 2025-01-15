// LeaderBoard.tsx

import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

function LeaderBoard() {
  const [users, setUsers] = useState<any[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalVerifiedClaims, setTotalVerifiedClaims] = useState(0);
  const [averageScore, setAverageScore] = useState(0);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((res) => res.json())
      .then((data) => {
        const localStr = localStorage.getItem("chatGPTClaims");
        const localClaims = localStr ? JSON.parse(localStr) : [];
        data.users.forEach((usr: any) => {
          const userClaims = localClaims.filter(
            (c: any) => c.userId === usr.username
          );
          let localScore = 0;
          userClaims.forEach((c: any) => {
            localScore += c.confidence_score;
          });
          usr.leaderboard_score = (usr.leaderboard_score || 0) + localScore;
          if (!usr.processed_claims) usr.processed_claims = [];
          usr.processed_claims = [
            ...usr.processed_claims,
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
        });
        setUsers(data.users);
        setTotalUsers(data.totalUsers);
        setTotalVerifiedClaims(data.totalVerifiedClaims + localClaims.length);
        setAverageScore(data.averageScore);
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <h1>Leaderboard</h1>
      <p>Total users: {totalUsers}</p>
      <p>Total verified claims: {totalVerifiedClaims}</p>
      <p>Average leaderboard score: {averageScore.toFixed(2)}</p>
      <ul>
        {users.map((user) => (
          <li key={user._id}>
            <Link to={`/User?id=${user._id}`}>{user.username}</Link>
            <p>Followers: {user.followers_count}</p>
            <p>Score: {user.leaderboard_score}</p>
            <p>Category: {user.category}</p>
            <p>Processed Claims: {user.processed_claims.length}</p>
          </li>
        ))}
      </ul>
      <Link to="/Admin">Go to Admin</Link>
    </>
  );
}

export default LeaderBoard;
