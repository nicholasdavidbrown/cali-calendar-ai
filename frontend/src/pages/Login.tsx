import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, needsSetup } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If system needs setup, redirect to register
    if (needsSetup) {
      navigate("/register", { replace: true });
    }
  }, [needsSetup, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/calendar");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-bg-light dark:bg-bg-dark">
      <div className="bg-bg-card-light dark:bg-bg-card-dark p-12 rounded-xl shadow-lg max-w-md w-full border border-border-light dark:border-border-dark">
        <h1 className="text-3xl font-semibold mb-2 bg-gradient-to-r from-primary-orange to-primary-yellow bg-clip-text text-transparent">
          Welcome Back!
        </h1>
        <p className="text-text-muted-light dark:text-text-muted-dark mb-8">
          Sign in to manage your calendar
        </p>

        <form onSubmit={handleSubmit} className="mb-6">
          <div className="mb-6">
            <label htmlFor="email" className="block mb-2 font-medium text-text-dark dark:text-text-light">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/5 border border-border-light dark:border-border-dark rounded-lg text-text-dark dark:text-text-light focus:outline-none focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/20 transition-all"
              placeholder="you@example.com"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block mb-2 font-medium text-text-dark dark:text-text-light">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/5 border border-border-light dark:border-border-dark rounded-lg text-text-dark dark:text-text-light focus:outline-none focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/20 transition-all"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-error/10 border-l-4 border-error px-4 py-3 rounded-md text-error mb-4">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary-orange to-primary-yellow text-white px-6 py-3 rounded-lg font-semibold shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-text-muted-light dark:text-text-muted-dark">
          Don't have an account?{" "}
          <Link to="/register" className="text-primary-orange hover:text-primary-yellow transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
