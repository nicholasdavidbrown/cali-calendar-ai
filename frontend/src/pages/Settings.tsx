import { useState, useEffect } from "react";
import { Card, Label, TextInput, Select, Radio, Button, Alert } from "flowbite-react";
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
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Settings
        </h1>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
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
                <Label htmlFor="timezone">Timezone</Label>
              </div>
              <Select
                id="timezone"
                name="timezone"
                value={formData.timezone}
                onChange={handleChange}
                color="gray"
              >
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/New_York">Eastern Time</option>
              </Select>
            </div>

            <div>
              <div className="mb-2">
                <Label htmlFor="smsTime">Daily SMS Time</Label>
              </div>
              <TextInput
                id="smsTime"
                name="smsTime"
                type="time"
                value={formData.smsTime}
                onChange={handleChange}
                color="gray"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                When to receive daily calendar summary
              </p>
            </div>

            <div>
              <div className="mb-3">
                <Label>Message Style</Label>
              </div>
              <fieldset className="flex flex-col gap-3">
                {["professional", "witty", "sarcastic", "mission", "irwin", "tanda"].map(
                  (style) => (
                    <div key={style} className="flex items-center gap-2">
                      <Radio
                        id={`style-${style}`}
                        name="messageStyle"
                        value={style}
                        checked={formData.messageStyle === style}
                        onChange={handleChange}
                        color="warning"
                      />
                      <Label htmlFor={`style-${style}`} className="cursor-pointer">
                        {style.charAt(0).toUpperCase() + style.slice(1)}
                      </Label>
                    </div>
                  )
                )}
              </fieldset>
            </div>

            {error && (
              <Alert color="failure">
                <span className="font-medium">Error!</span> {error}
              </Alert>
            )}

            {success && (
              <Alert color="success">
                <span className="font-medium">Success!</span> Settings updated successfully!
              </Alert>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 enabled:hover:from-orange-600 enabled:hover:to-amber-600"
              size="lg"
            >
              {loading ? "Saving..." : "Save Settings"}
            </Button>
          </form>
        </Card>
      </div>
    </Layout>
  );
};

export default Settings;
