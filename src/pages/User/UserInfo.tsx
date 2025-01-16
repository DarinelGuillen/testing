/********************************************
 * UserInfo.tsx
 ********************************************/
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

function UserInfo() {
  const [user, setUser] = useState<any>(null);
  const location = useLocation();
  const [mergedClaims, setMergedClaims] = useState<any[]>([]);

  // Nuevo estado para duplicados
  const [duplicateGroups, setDuplicateGroups] = useState<any[]>([]);
  // Estado para mostrar/ocultar el modal
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const userId = params.get("id");
    if (!userId) return;

    // 1. Cargar los datos del usuario
    fetch(`/api/users/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setUser(data);

        // Ejemplo de claims guardados en localStorage (opcional)
        const localStr = localStorage.getItem("chatGPTClaims");
        const localClaims = localStr ? JSON.parse(localStr) : [];
        // Filtrar los que correspondan a este usuario, si aplica
        const userClaims = localClaims.filter((c: any) => c.userId === data.username);

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

  // 2. Una vez tenemos al usuario cargado, checamos los duplicados
  useEffect(() => {
    if (!user?._id) return;

    fetch(`/api/users/${user._id}/duplicates`)
      .then((res) => res.json())
      .then((data) => {
        if (data.duplicates && data.duplicates.length > 0) {
          setDuplicateGroups(data.duplicates);
          setShowModal(true);
        } else {
          alert("No se encontraron duplicados para este usuario.");
        }
      })
      .catch(() => {});
  }, [user]);

  const handleRemoveDuplicates = async () => {
    if (!user?._id) return;

    // Extraemos solamente los IDs de cada grupo
    // la respuesta actual es array de arrays de objetos:
    // [ [ { _id: "claim_2", ... }, { _id: "claim_3", ...} ], [...] ]
    // Necesitamos un array de arrays de IDs:
    // [ ["claim_2", "claim_3"], ... ]
    const duplicatesArrayOfIds = duplicateGroups.map((group) =>
      group.map((claim: any) => claim._id)
    );

    try {
      const res = await fetch(`/api/users/${user._id}/remove-duplicates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duplicates: duplicatesArrayOfIds }),
      });
      const result = await res.json();
      console.log(result);
      // Cerrar modal y refrescar la página o refrescar claims en memoria
      setShowModal(false);
      // Opcional: recargar la info del usuario
      window.location.reload();
    } catch (error) {
      console.error("Error removing duplicates:", error);
    }
  };

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

      {/* Modal para duplicados */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: "20%",
            left: "50%",
            transform: "translate(-50%, 0)",
            backgroundColor: "#fff",
            padding: "20px",
            border: "2px solid #000",
            zIndex: 9999,
          }}
        >
          <h2>Claims Duplicadas Encontradas</h2>
          {duplicateGroups.map((group, idx) => (
            <div key={idx}>
              <h4>Grupo #{idx + 1}</h4>
              <ul>
                {group.map((claim: any) => (
                  <li key={claim._id}>
                    <strong>{claim._id}:</strong> {claim.text}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <button onClick={handleRemoveDuplicates}>Eliminar Duplicados</button>
          <button onClick={() => setShowModal(false)}>Cerrar</button>
        </div>
      )}

      <Link to="/">Home</Link>
    </>
  );
}

export default UserInfo;
