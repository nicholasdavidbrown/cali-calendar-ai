import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, Label, TextInput, Button, Alert } from "flowbite-react";
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
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gray-50 dark:bg-gray-900">
      <Card className="max-w-md w-full">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                Welcome Back!
              </span>
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Sign in to manage your calendar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="mb-2">
                <Label htmlFor="email">Email</Label>
              </div>
              <TextInput
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                color="gray"
              />
            </div>

            <div>
              <div className="mb-2">
                <Label htmlFor="password">Password</Label>
              </div>
              <TextInput
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                color="gray"
              />
            </div>

            {error && (
              <Alert color="failure">
                <span className="font-medium">Error!</span> {error}
              </Alert>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 enabled:hover:from-orange-600 enabled:hover:to-amber-600"
              size="lg"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{" "}
            <Link to="/register" className="text-orange-500 hover:text-orange-600 font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Login;
