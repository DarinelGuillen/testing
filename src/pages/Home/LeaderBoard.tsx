

import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

interface User {
  _id: string;
  username: string;
  followers_count: number;
  leaderboard_score: number;
  processed_claims: any[];
  category: string;
}

function LeaderBoard() {
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [totalVerifiedClaims, setTotalVerifiedClaims] = useState<number>(0);
  const [averageScore, setAverageScore] = useState<number>(0);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((res) => res.json())
      .then((data) => {
        setUsers(data.users || []);
        setTotalUsers(data.totalUsers || 0);
        setTotalVerifiedClaims(data.totalVerifiedClaims || 0);
        setAverageScore(data.averageScore || 0);
      })
      .catch((err) => {
        console.error("Error fetching leaderboard:", err);
      });
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
