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

        // Mapear claims locales por usuario para agrupar sus scores
        const localMap: { [key: string]: { localScore: number; claims: any[] } } = {};
        localClaims.forEach((claim: any) => {
          if (!localMap[claim.userId]) {
            localMap[claim.userId] = { localScore: 0, claims: [] };
          }
          localMap[claim.userId].localScore += claim.confidence_score;
          localMap[claim.userId].claims.push(claim);
        });

        let globalScore = 0;

        // Combinar datos del servidor con claims locales y recalcular scores
        data.users.forEach((usr: any) => {
          let serverScore = 0;
          if (usr.processed_claims) {
            usr.processed_claims.forEach((claim: any) => {
              serverScore += claim.confidence_score;
            });
          }

          const localData = localMap[usr.username] || { localScore: 0, claims: [] };
          const localScore = localData.localScore;

          // Sumar scores del servidor y locales
          usr.totalScore = serverScore + localScore;

          // Combinar claims locales con los procesados del servidor
          if (!usr.processed_claims) usr.processed_claims = [];
          usr.processed_claims = [
            ...usr.processed_claims,
            ...localData.claims.map((claim: any) => ({
              _id: claim._id,
              text: claim.text,
              categoria: claim.categoria,
              verification_status: claim.verification_status,
              confidence_score: claim.confidence_score,
              tweet_id: claim.tweet_id,
              date: claim.date,
            })),
          ];

          globalScore += usr.totalScore;
        });

        // Recalcular porcentajes relativos basados en los scores combinados
        data.users.forEach((usr: any) => {
          usr.relative_percentage = globalScore > 0 ? (usr.totalScore / globalScore) * 100 : 0;
        });

        const totalLocalClaims = localClaims.length;
        const totalVerifiedClaims = (data.totalVerifiedClaims || 0) + totalLocalClaims;

        const totalUsers = data.totalUsers;
        const averageScore = totalUsers > 0
          ? data.users.reduce((sum: number, u: any) => sum + u.relative_percentage, 0) / totalUsers
          : 0;

        setUsers(data.users);
        setTotalUsers(totalUsers);
        setTotalVerifiedClaims(totalVerifiedClaims);
        setAverageScore(averageScore);
      })
      .catch((err) => {
        console.error(err);
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
            <p>Score: {user.relative_percentage.toFixed(2)}%</p>
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
