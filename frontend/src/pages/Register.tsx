import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
    <div className="min-h-screen flex items-center justify-center p-8 bg-bg-light dark:bg-bg-dark">
      <div className="bg-bg-card-light dark:bg-bg-card-dark p-12 rounded-xl shadow-lg max-w-md w-full border border-border-light dark:border-border-dark">
        <h1 className="text-3xl font-semibold mb-2 bg-gradient-to-r from-primary-orange to-primary-yellow bg-clip-text text-transparent">
          Create Admin Account
        </h1>
        <p className="text-text-muted-light dark:text-text-muted-dark mb-8">
          Start managing your calendar with AI-powered SMS
        </p>

        <form onSubmit={handleSubmit} className="mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="mb-6">
              <label htmlFor="firstName" className="block mb-2 font-medium text-text-dark dark:text-text-light">
                First Name
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white/5 border border-border-light dark:border-border-dark rounded-lg text-text-dark dark:text-text-light focus:outline-none focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/20 transition-all"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="lastName" className="block mb-2 font-medium text-text-dark dark:text-text-light">
                Last Name
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white/5 border border-border-light dark:border-border-dark rounded-lg text-text-dark dark:text-text-light focus:outline-none focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/20 transition-all"
              />
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="email" className="block mb-2 font-medium text-text-dark dark:text-text-light">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-white/5 border border-border-light dark:border-border-dark rounded-lg text-text-dark dark:text-text-light focus:outline-none focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/20 transition-all"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="phoneNumber" className="block mb-2 font-medium text-text-dark dark:text-text-light">
              Phone Number *
            </label>
            <input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-white/5 border border-border-light dark:border-border-dark rounded-lg text-text-dark dark:text-text-light focus:outline-none focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/20 transition-all"
              placeholder="+12345678900"
            />
            <small className="block mt-1 text-sm text-text-muted-light dark:text-text-muted-dark">
              Format: +1234567890 (E.164)
            </small>
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block mb-2 font-medium text-text-dark dark:text-text-light">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={8}
              className="w-full px-4 py-3 bg-white/5 border border-border-light dark:border-border-dark rounded-lg text-text-dark dark:text-text-light focus:outline-none focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/20 transition-all"
            />
            <small className="block mt-1 text-sm text-text-muted-light dark:text-text-muted-dark">
              Minimum 8 characters
            </small>
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
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-text-muted-light dark:text-text-muted-dark">
          Already have an account?{" "}
          <Link to="/login" className="text-primary-orange hover:text-primary-yellow transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
