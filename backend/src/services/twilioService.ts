import twilio from "twilio";
import { adminHelpers } from "../lib/db-helpers.js";

let twilioClient: twilio.Twilio | null = null;

export const initializeTwilioClient = async () => {
  const accountSid = await adminHelpers.getSetting("twilio_account_sid");
  const authToken = await adminHelpers.getSetting("twilio_auth_token");
  const phoneNumber = await adminHelpers.getSetting("twilio_phone_number");

  if (!accountSid || !authToken) {
    console.warn("⚠️  Twilio credentials not configured");
    return null;
  }

  twilioClient = twilio(accountSid, authToken);
  return { client: twilioClient, phoneNumber };
};

export const getTwilioClient = () => {
  return twilioClient;
};

export interface SendSMSParams {
  to: string;
  message: string;
}

export const sendSMS = async ({ to, message }: SendSMSParams) => {
  try {
    const config = await initializeTwilioClient();

    if (!config || !config.client) {
      throw new Error("Twilio not configured");
    }

    if (!config.phoneNumber) {
      throw new Error("Twilio phone number not configured");
    }

    const result = await config.client.messages.create({
      body: message,
      from: config.phoneNumber,
      to: to,
    });

    return {
      success: true,
      sid: result.sid,
      status: result.status,
    };
  } catch (error: any) {
    console.error("SMS sending error:", error);
    return {
      success: false,
      error: error.message || "Failed to send SMS",
      code: error.code,
    };
  }
};

export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, "");

  if (!phone.startsWith("+")) {
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    }
    return `+${cleaned}`;
  }

  return phone;
};

export const validatePhoneNumber = (phone: string): boolean => {
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  const formatted = formatPhoneNumber(phone);
  return e164Regex.test(formatted);
};
