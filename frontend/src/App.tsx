import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { getApiBaseUrl } from "./utils/api";

function App() {
  const [healthStatus, setHealthStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const API_BASE = getApiBaseUrl();

  const checkHealth = async () => {
    setLoading(true);
    try {
      console.log("Checking backend health at ", `${API_BASE}/health`);
      const response = await fetch(`${API_BASE}/health`);
      const data = await response.json();
      setHealthStatus(
        `✅ Backend is healthy! Timestamp: ${new Date(
          data.timestamp
        ).toLocaleString()}`
      );
    } catch (error) {
      console.error("Failed to check health:", error);
      setHealthStatus("❌ Backend is not responding");
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
      <h1>Cali Calendar AI</h1>
      <p>Phase 6: AI Messaging with Claude Complete ✅</p>

      <div className="card">
        <h2>Backend Status</h2>
        <button onClick={checkHealth} disabled={loading}>
          {loading ? "Checking..." : "Check Backend Health"}
        </button>

        {healthStatus && (
          <div className="users-list">
            <p style={{ fontSize: "1.1em", marginTop: "1rem" }}>
              {healthStatus}
            </p>
          </div>
        )}
      </div>

      <div className="info-section">
        <div className="info-card">
          <h3>⚙️ Admin Setup Endpoints</h3>
          <div className="endpoint">
            <code className="method get">GET</code>
            <code className="path">/api/setup/status</code>
            <span className="description">Check setup status</span>
          </div>
          <div className="endpoint">
            <code className="method post">POST</code>
            <code className="path">/api/setup/initialize</code>
            <span className="description">Complete setup wizard</span>
          </div>
          <div className="endpoint">
            <code className="method get">GET</code>
            <code className="path">/api/admin/settings</code>
            <span className="description">List all settings (admin)</span>
          </div>
          <div className="endpoint">
            <code className="method put">PUT</code>
            <code className="path">/api/admin/settings/:key</code>
            <span className="description">Update setting (admin)</span>
          </div>
        </div>

        <div className="info-card">
          <h3>🔐 Authentication Endpoints</h3>
          <div className="endpoint">
            <code className="method post">POST</code>
            <code className="path">/api/auth/register</code>
            <span className="description">Register new user</span>
          </div>
          <div className="endpoint">
            <code className="method post">POST</code>
            <code className="path">/api/auth/login</code>
            <span className="description">Login user</span>
          </div>
          <div className="endpoint">
            <code className="method get">GET</code>
            <code className="path">/api/auth/me</code>
            <span className="description">Get current user</span>
          </div>
          <div className="endpoint">
            <code className="method post">POST</code>
            <code className="path">/api/auth/logout</code>
            <span className="description">Logout user</span>
          </div>
        </div>

        <div className="info-card">
          <h3>📅 Calendar Endpoints</h3>
          <div className="endpoint">
            <code className="method get">GET</code>
            <code className="path">/api/calendar/events</code>
            <span className="description">Get all events</span>
          </div>
          <div className="endpoint">
            <code className="method post">POST</code>
            <code className="path">/api/calendar/events</code>
            <span className="description">Create event</span>
          </div>
          <div className="endpoint">
            <code className="method put">PUT</code>
            <code className="path">/api/calendar/events/:id</code>
            <span className="description">Update event</span>
          </div>
          <div className="endpoint">
            <code className="method delete">DELETE</code>
            <code className="path">/api/calendar/events/:id</code>
            <span className="description">Delete event</span>
          </div>
        </div>

        <div className="info-card">
          <h3>💬 SMS Endpoints</h3>
          <div className="endpoint">
            <code className="method post">POST</code>
            <code className="path">/api/sms/test</code>
            <span className="description">Send test SMS</span>
          </div>
          <div className="endpoint">
            <code className="method get">GET</code>
            <code className="path">/api/sms/history</code>
            <span className="description">Get SMS history</span>
          </div>
          <div className="endpoint">
            <code className="method post">POST</code>
            <code className="path">/api/sms/send-daily-summary</code>
            <span className="description">Send daily summary (AI-powered)</span>
          </div>
        </div>

        <div className="info-card">
          <h3>👤 User Settings Endpoints</h3>
          <div className="endpoint">
            <code className="method put">PUT</code>
            <code className="path">/api/users/settings</code>
            <span className="description">Update user settings</span>
          </div>
          <p style={{ fontSize: "0.85em", marginTop: "0.5rem", opacity: 0.8 }}>
            Update: phoneNumber, timezone, smsTime, messageStyle
          </p>
          <p style={{ fontSize: "0.85em", marginTop: "0.25rem", opacity: 0.8 }}>
            Personalities: professional, witty, sarcastic, mission, irwin, tanda, random
          </p>
        </div>

        <div className="info-card">
          <h3>🗄️ Database Viewer</h3>
          <p>View and query the SQLite database directly:</p>
          <a
            href="http://localhost:8081"
            target="_blank"
            rel="noopener noreferrer"
            className="db-link"
          >
            Open SQLite Web Viewer
          </a>
          <p style={{ fontSize: "0.9em", marginTop: "1rem", opacity: 0.8 }}>
            View tables: users, calendar_events, family_members, sms_history,
            join_codes, calendar_integrations, admin_settings, system_setup
          </p>
        </div>

        <div className="info-card">
          <h3>📋 Project Status</h3>
          <ul style={{ textAlign: "left", fontSize: "0.9em" }}>
            <li>✅ Phase 1: Shared Types Setup</li>
            <li>✅ Phase 2: Database Setup (8 tables)</li>
            <li>✅ Phase 3: Authentication System</li>
            <li>✅ Phase 4: Calendar Events (Manual CRUD)</li>
            <li>✅ Phase 5: SMS Notifications (Twilio)</li>
            <li>✅ Phase 5.5: Admin Setup Wizard</li>
            <li>✅ Phase 6: AI Messaging with Claude</li>
            <li>⏳ Phase 7: Family Sharing</li>
          </ul>
        </div>
      </div>

      <p className="read-the-docs">
        Backend API: <code>http://localhost:8080</code> | Frontend:{" "}
        <code>http://localhost:5174</code>
      </p>
    </>
  );
}

export default App;
