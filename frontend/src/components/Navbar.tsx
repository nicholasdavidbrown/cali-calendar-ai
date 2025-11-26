import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import ThemeToggle from "./ThemeToggle";

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
    <nav className="bg-bg-card-light dark:bg-bg-card-dark border-b border-border-light dark:border-border-dark px-8 py-4 flex items-center justify-between shadow-sm">
      <div>
        <h1 className="text-2xl font-semibold bg-gradient-to-r from-primary-orange to-primary-yellow bg-clip-text text-transparent">
          📅 Cali Calendar AI
        </h1>
      </div>
      <div className="flex gap-6">
        <Link
          to="/calendar"
          className="px-4 py-2 rounded-md font-medium text-text-dark dark:text-text-light hover:bg-primary-orange/10 transition-colors"
        >
          Calendar
        </Link>
        <Link
          to="/settings"
          className="px-4 py-2 rounded-md font-medium text-text-dark dark:text-text-light hover:bg-primary-orange/10 transition-colors"
        >
          Settings
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-text-muted-light dark:text-text-muted-dark">
          {user?.firstName} {user?.lastName}
        </span>
        <ThemeToggle />
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-white/10 dark:bg-white/10 text-text-dark dark:text-text-light rounded-md text-sm hover:bg-white/15 dark:hover:bg-white/15 transition-colors"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
