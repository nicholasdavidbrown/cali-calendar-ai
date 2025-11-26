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
    <nav className="bg-bg-card-light dark:bg-bg-card-dark border-b border-border-light dark:border-border-dark px-4 sm:px-6 lg:px-8 py-3 sm:py-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-shrink-0">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold bg-gradient-to-r from-primary-orange to-primary-yellow bg-clip-text text-transparent">
            📅 <span className="hidden sm:inline">Cali Calendar AI</span><span className="sm:hidden">Cali</span>
          </h1>
        </div>

        <div className="hidden md:flex gap-4 lg:gap-6">
          <Link
            to="/calendar"
            className="px-3 py-2 lg:px-4 rounded-md font-medium text-sm lg:text-base text-text-dark dark:text-text-light hover:bg-primary-orange/10 transition-colors"
          >
            Calendar
          </Link>
          <Link
            to="/settings"
            className="px-3 py-2 lg:px-4 rounded-md font-medium text-sm lg:text-base text-text-dark dark:text-text-light hover:bg-primary-orange/10 transition-colors"
          >
            Settings
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
          <span className="hidden lg:inline text-sm text-text-muted-light dark:text-text-muted-dark">
            {user?.firstName} {user?.lastName}
          </span>
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white/10 dark:bg-white/10 text-text-dark dark:text-text-light rounded-md text-xs sm:text-sm hover:bg-white/15 dark:hover:bg-white/15 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="flex md:hidden gap-3 mt-3 pt-3 border-t border-border-light dark:border-border-dark">
        <Link
          to="/calendar"
          className="flex-1 text-center px-3 py-2 rounded-md font-medium text-sm text-text-dark dark:text-text-light hover:bg-primary-orange/10 transition-colors"
        >
          Calendar
        </Link>
        <Link
          to="/settings"
          className="flex-1 text-center px-3 py-2 rounded-md font-medium text-sm text-text-dark dark:text-text-light hover:bg-primary-orange/10 transition-colors"
        >
          Settings
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
