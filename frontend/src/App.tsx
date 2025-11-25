import { useState, useEffect } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";

interface User {
  id: number;
  name: string;
}

function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [loading, setLoading] = useState(false);

  const API_BASE = "";

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/users`);
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newUserName }),
      });
      const newUser = await response.json();
      setUsers([...users, newUser]);
      setNewUserName("");
      setShowModal(false);
    } catch (error) {
      console.error("Failed to create user:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>SERN Compose Starter</h1>
      <p>with Vite React, Node Express and Sqlite3</p>

      <div className="card">
        <h2>User Management</h2>
        <button onClick={() => setShowModal(true)}>Create New User</button>

        <div className="users-list">
          {users.length === 0 ? (
            <p className="read-the-docs">
              No users yet. Create one to get started!
            </p>
          ) : (
            <ul>
              {users.map((user) => (
                <li key={user.id}>
                  <span className="user-id">#{user.id}</span>
                  <span className="user-name">{user.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="info-section">
        <div className="info-card">
          <h3>API Endpoints</h3>
          <div className="endpoint">
            <code className="method get">GET</code>
            <code className="path">/api/users</code>
            <span className="description">Fetch all users</span>
          </div>
          <div className="endpoint">
            <code className="method post">POST</code>
            <code className="path">/api/users</code>
            <span className="description">Create a new user</span>
          </div>
        </div>

        <div className="info-card">
          <h3>Database Viewer</h3>
          <p>View and query the SQLite database directly:</p>
          <a
            href="http://localhost:8081"
            target="_blank"
            rel="noopener noreferrer"
            className="db-link"
          >
            Open SQLite Web Viewer
          </a>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create New User</h2>
            <form onSubmit={createUser}>
              <input
                type="text"
                placeholder="Enter user name"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                autoFocus
              />
              <div className="modal-buttons">
                <button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create"}
                </button>
                <button type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <p className="read-the-docs">Frontend connected to backend API</p>
    </>
  );
}

export default App;
