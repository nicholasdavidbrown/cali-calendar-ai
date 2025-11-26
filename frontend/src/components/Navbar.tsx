import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h1>📅 Cali Calendar AI</h1>
      </div>
      <div className="navbar-links">
        <Link to="/calendar" className="nav-link">
          Calendar
        </Link>
        <Link to="/settings" className="nav-link">
          Settings
        </Link>
      </div>
      <div className="navbar-user">
        <span className="user-name">
          {user?.firstName} {user?.lastName}
        </span>
        <button onClick={handleLogout} className="btn-logout">
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
