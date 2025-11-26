import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { userAPI } from "../services/api";
import Layout from "../components/Layout";
import type { SettingsData } from "../types";

export const Settings: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [formData, setFormData] = useState<SettingsData>({
    phoneNumber: user?.phoneNumber || "",
    timezone: user?.timezone || "America/Los_Angeles",
    smsTime: user?.smsTime || "07:00",
    messageStyle: user?.messageStyle || "professional",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setFormData({
        phoneNumber: user.phoneNumber || "",
        timezone: user.timezone || "America/Los_Angeles",
        smsTime: user.smsTime || "07:00",
        messageStyle: user.messageStyle || "professional",
      });
    }
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setSuccess(false);
    setError("");
  };

  const validatePhone = (phone: string) => {
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Validate phone number
    if (formData.phoneNumber && !validatePhone(formData.phoneNumber)) {
      setError("Phone number must be in E.164 format (e.g., +12345678900)");
      return;
    }

    if (!formData.phoneNumber) {
      setError("Phone number is required");
      return;
    }

    setLoading(true);

    try {
      await userAPI.updateSettings(formData);
      await refreshUser();
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to update settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-semibold mb-8 text-text-dark dark:text-text-light">Settings</h1>

        <div className="bg-bg-card-light dark:bg-bg-card-dark border border-border-light dark:border-border-dark rounded-xl p-8 mt-8">
          <form onSubmit={handleSubmit}>
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
              <label htmlFor="timezone" className="block mb-2 font-medium text-text-dark dark:text-text-light">
                Timezone
              </label>
              <select
                id="timezone"
                name="timezone"
                value={formData.timezone}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/5 border border-border-light dark:border-border-dark rounded-lg text-text-dark dark:text-text-light focus:outline-none focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/20 transition-all"
              >
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/New_York">Eastern Time</option>
              </select>
            </div>

            <div className="mb-6">
              <label htmlFor="smsTime" className="block mb-2 font-medium text-text-dark dark:text-text-light">
                Daily SMS Time
              </label>
              <input
                id="smsTime"
                name="smsTime"
                type="time"
                value={formData.smsTime}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/5 border border-border-light dark:border-border-dark rounded-lg text-text-dark dark:text-text-light focus:outline-none focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/20 transition-all"
              />
              <small className="block mt-1 text-sm text-text-muted-light dark:text-text-muted-dark">
                When to receive daily calendar summary
              </small>
            </div>

            <div className="mb-6">
              <label className="block mb-3 font-medium text-text-dark dark:text-text-light">
                Message Style
              </label>
              <div className="flex flex-col gap-3">
                {["professional", "witty", "sarcastic", "mission", "irwin", "tanda"].map(
                  (style) => (
                    <label
                      key={style}
                      className="flex items-center gap-3 px-3 py-3 bg-white/5 border border-border-light dark:border-border-dark rounded-lg cursor-pointer transition-all hover:bg-primary-orange/5 hover:border-primary-orange"
                    >
                      <input
                        type="radio"
                        name="messageStyle"
                        value={style}
                        checked={formData.messageStyle === style}
                        onChange={handleChange}
                        className="w-4 h-4 accent-primary-orange"
                      />
                      <span className="text-text-dark dark:text-text-light">
                        {style.charAt(0).toUpperCase() + style.slice(1)}
                      </span>
                    </label>
                  )
                )}
              </div>
            </div>

            {error && (
              <div className="bg-error/10 border-l-4 border-error px-4 py-3 rounded-md text-error mb-4">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-success/10 border-l-4 border-success px-4 py-3 rounded-md text-success mb-4">
                Settings updated successfully!
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-orange to-primary-yellow text-white px-6 py-3 rounded-lg font-semibold shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? "Saving..." : "Save Settings"}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
