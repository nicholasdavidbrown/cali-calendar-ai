import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, Label, TextInput, Button, Alert } from "flowbite-react";
import { useAuth } from "../hooks/useAuth";
import { authAPI } from "../services/api";

export const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validatePhone = (phone: string) => {
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate phone number
    if (!validatePhone(formData.phoneNumber)) {
      setError("Phone number must be in E.164 format (e.g., +12345678900)");
      return;
    }

    // Password strength check
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      await authAPI.register(formData);
      // Auto-login after registration
      await login(formData.email, formData.password);
      navigate("/calendar");
    } catch (err: any) {
      setError(err.message || "Registration failed");
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
                Create Admin Account
              </span>
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Start managing your calendar with AI-powered SMS
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="mb-2">
                  <Label htmlFor="firstName">First Name</Label>
                </div>
                <TextInput
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  color="gray"
                />
              </div>

              <div>
                <div className="mb-2">
                  <Label htmlFor="lastName">Last Name</Label>
                </div>
                <TextInput
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  color="gray"
                />
              </div>
            </div>

            <div>
              <div className="mb-2">
                <Label htmlFor="email">Email</Label>
              </div>
              <TextInput
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                color="gray"
              />
            </div>

            <div>
              <div className="mb-2">
                <Label htmlFor="phoneNumber">
                  Phone Number
                  <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                    (E.164 format: +1234567890)
                  </span>
                </Label>
              </div>
              <TextInput
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="+12345678900"
                required
                color="gray"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Must include country code (e.g., +1 for US)
              </p>
            </div>

            <div>
              <div className="mb-2">
                <Label htmlFor="password">
                  Password
                  <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                    (Minimum 8 characters)
                  </span>
                </Label>
              </div>
              <TextInput
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                minLength={8}
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
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{" "}
            <Link to="/login" className="text-orange-500 hover:text-orange-600 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Register;
