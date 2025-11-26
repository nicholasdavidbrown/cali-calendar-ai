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
      <div className="settings-page">
        <h1>Settings</h1>

        <div className="settings-card">
          <form onSubmit={handleSubmit} className="settings-form">
            <div className="form-group">
              <label htmlFor="phoneNumber">Phone Number *</label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="+12345678900"
              />
              <small className="form-hint">Format: +1234567890 (E.164)</small>
            </div>

            <div className="form-group">
              <label htmlFor="timezone">Timezone</label>
              <select
                id="timezone"
                name="timezone"
                value={formData.timezone}
                onChange={handleChange}
                className="form-input"
              >
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/New_York">Eastern Time</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="smsTime">Daily SMS Time</label>
              <input
                id="smsTime"
                name="smsTime"
                type="time"
                value={formData.smsTime}
                onChange={handleChange}
                className="form-input"
              />
              <small className="form-hint">
                When to receive daily calendar summary
              </small>
            </div>

            <div className="form-group">
              <label>Message Style</label>
              <div className="radio-group">
                {["professional", "witty", "sarcastic", "mission", "irwin", "tanda"].map(
                  (style) => (
                    <label key={style} className="radio-label">
                      <input
                        type="radio"
                        name="messageStyle"
                        value={style}
                        checked={formData.messageStyle === style}
                        onChange={handleChange}
                      />
                      <span className="radio-text">
                        {style.charAt(0).toUpperCase() + style.slice(1)}
                      </span>
                    </label>
                  )
                )}
              </div>
            </div>

            {error && <div className="form-error">{error}</div>}
            {success && (
              <div className="form-success">Settings updated successfully!</div>
            )}

            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Saving..." : "Save Settings"}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
