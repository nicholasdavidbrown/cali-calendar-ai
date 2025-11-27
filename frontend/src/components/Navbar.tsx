import { Link } from "react-router-dom";
import { Button, Avatar } from "flowbite-react";
import { HiMenu } from "react-icons/hi";
import { useAuth } from "../hooks/useAuth";
import ThemeToggle from "./ThemeToggle";
import { useState } from "react";

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const getInitials = () => {
    return `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase();
  };

  return (
    <nav className="bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
        <Link to="/calendar" className="flex items-center space-x-3">
          <span className="self-center whitespace-nowrap text-xl font-semibold">
            <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
              📅 Cali Calendar AI
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-2 md:order-2">
          <ThemeToggle />
          <Avatar
            alt="User settings"
            placeholderInitials={getInitials()}
            rounded
            size="sm"
          />
          <span className="hidden lg:inline text-sm text-gray-600 dark:text-gray-400">
            {user?.firstName} {user?.lastName}
          </span>
          <Button size="sm" color="light" onClick={handleLogout}>
            Logout
          </Button>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
          >
            <HiMenu className="w-5 h-5" />
          </button>
        </div>

        <div className={`${showMenu ? 'block' : 'hidden'} w-full md:block md:w-auto md:order-1`}>
          <ul className="flex flex-col p-4 md:p-0 mt-4 border border-gray-100 rounded-lg bg-gray-50 md:flex-row md:space-x-8 md:mt-0 md:border-0 md:bg-white dark:bg-gray-800 md:dark:bg-gray-800 dark:border-gray-700">
            <li>
              <Link
                to="/calendar"
                className="block py-2 pl-3 pr-4 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-orange-500 md:p-0 dark:text-white dark:hover:bg-gray-700 md:dark:hover:bg-transparent dark:border-gray-700"
              >
                Calendar
              </Link>
            </li>
            <li>
              <Link
                to="/settings"
                className="block py-2 pl-3 pr-4 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-orange-500 md:p-0 dark:text-white dark:hover:bg-gray-700 md:dark:hover:bg-transparent dark:border-gray-700"
              >
                Settings
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
