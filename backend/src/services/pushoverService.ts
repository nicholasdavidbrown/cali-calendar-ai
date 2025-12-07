/**
 * Pushover Notification Service
 *
 * Provides push notification functionality using the Pushover API with Groups.
 * Each user has their own API token and a delivery group for notifications.
 * Family members are added to the user's group to receive notifications.
 */

// ============================================================================
// Types
// ============================================================================

export interface PushoverResponse {
  status: number;
  request: string;
  errors?: string[];
  group?: string;
}

export interface SendNotificationParams {
  apiToken: string;
  groupKey: string;
  message: string;
  title?: string;
  priority?: number; // -2 (lowest) to 2 (emergency)
  sound?: string;
  url?: string;
  urlTitle?: string;
}

export interface SendNotificationResult {
  success: boolean;
  requestId?: string;
  error?: string;
  status?: number;
}

export interface CreateGroupResult {
  success: boolean;
  groupKey?: string;
  error?: string;
}

export interface GroupOperationResult {
  success: boolean;
  error?: string;
}

// ============================================================================
// Constants
// ============================================================================

const PUSHOVER_API_BASE = "https://api.pushover.net/1";

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate a Pushover user key format
 * User keys are 30-character alphanumeric strings
 */
export const validatePushoverUserKey = (key: string): boolean => {
  if (!key || typeof key !== "string") return false;
  return /^[a-zA-Z0-9]{30}$/.test(key);
};

/**
 * Validate a Pushover API token format
 * API tokens are 30-character alphanumeric strings
 */
export const validateApiToken = (token: string): boolean => {
  if (!token || typeof token !== "string") return false;
  return /^[a-zA-Z0-9]{30}$/.test(token);
};

/**
 * Validate a Pushover group key format
 * Group keys are 30-character alphanumeric strings starting with 'g'
 */
export const validateGroupKey = (key: string): boolean => {
  if (!key || typeof key !== "string") return false;
  return /^g[a-zA-Z0-9]{29}$/.test(key);
};

// ============================================================================
// Group Management Functions
// ============================================================================

/**
 * Create a new Pushover delivery group
 * @param apiToken - The user's Pushover API token
 * @param name - Name for the group (e.g., "Family Calendar")
 * @returns The created group key
 */
export const createGroup = async (
  apiToken: string,
  name: string
): Promise<CreateGroupResult> => {
  try {
    const body = new URLSearchParams({
      token: apiToken,
      name: name,
    });

    const response = await fetch(`${PUSHOVER_API_BASE}/groups.json`, {
      method: "POST",
      body: body,
    });

    const data: PushoverResponse = await response.json();

    if (data.status === 1 && data.group) {
      return {
        success: true,
        groupKey: data.group,
      };
    } else {
      return {
        success: false,
        error: data.errors?.join(", ") || "Failed to create group",
      };
    }
  } catch (error: any) {
    console.error("Pushover create group error:", error);
    return {
      success: false,
      error: error.message || "Failed to create group",
    };
  }
};

/**
 * Add a user to a Pushover group
 * @param apiToken - The group owner's API token
 * @param groupKey - The group key to add the user to
 * @param userKey - The Pushover user key to add
 */
export const addUserToGroup = async (
  apiToken: string,
  groupKey: string,
  userKey: string
): Promise<GroupOperationResult> => {
  try {
    const body = new URLSearchParams({
      token: apiToken,
      user: userKey,
    });

    const response = await fetch(
      `${PUSHOVER_API_BASE}/groups/${groupKey}/add_user.json`,
      {
        method: "POST",
        body: body,
      }
    );

    const data: PushoverResponse = await response.json();

    if (data.status === 1) {
      return { success: true };
    } else {
      return {
        success: false,
        error: data.errors?.join(", ") || "Failed to add user to group",
      };
    }
  } catch (error: any) {
    console.error("Pushover add user to group error:", error);
    return {
      success: false,
      error: error.message || "Failed to add user to group",
    };
  }
};

/**
 * Remove a user from a Pushover group
 * @param apiToken - The group owner's API token
 * @param groupKey - The group key to remove the user from
 * @param userKey - The Pushover user key to remove
 */
export const removeUserFromGroup = async (
  apiToken: string,
  groupKey: string,
  userKey: string
): Promise<GroupOperationResult> => {
  try {
    const body = new URLSearchParams({
      token: apiToken,
      user: userKey,
    });

    const response = await fetch(
      `${PUSHOVER_API_BASE}/groups/${groupKey}/delete_user.json`,
      {
        method: "POST",
        body: body,
      }
    );

    const data: PushoverResponse = await response.json();

    if (data.status === 1) {
      return { success: true };
    } else {
      return {
        success: false,
        error: data.errors?.join(", ") || "Failed to remove user from group",
      };
    }
  } catch (error: any) {
    console.error("Pushover remove user from group error:", error);
    return {
      success: false,
      error: error.message || "Failed to remove user from group",
    };
  }
};

// ============================================================================
// Notification Functions
// ============================================================================

/**
 * Send a notification to a Pushover group
 * All members of the group will receive the notification
 */
export const sendNotification = async (
  params: SendNotificationParams
): Promise<SendNotificationResult> => {
  try {
    const { apiToken, groupKey, message, title, priority, sound, url, urlTitle } =
      params;

    const body = new URLSearchParams({
      token: apiToken,
      user: groupKey, // Group key works like a user key for sending
      message: message,
    });

    if (title) body.append("title", title);
    if (priority !== undefined) body.append("priority", priority.toString());
    if (sound) body.append("sound", sound);
    if (url) body.append("url", url);
    if (urlTitle) body.append("url_title", urlTitle);

    const response = await fetch(`${PUSHOVER_API_BASE}/messages.json`, {
      method: "POST",
      body: body,
    });

    const data: PushoverResponse = await response.json();

    if (data.status === 1) {
      return {
        success: true,
        requestId: data.request,
        status: data.status,
      };
    } else {
      return {
        success: false,
        error: data.errors?.join(", ") || "Failed to send notification",
        status: data.status,
      };
    }
  } catch (error: any) {
    console.error("Pushover send notification error:", error);
    return {
      success: false,
      error: error.message || "Failed to send notification",
    };
  }
};

/**
 * Send a test notification directly to a user (not via group)
 * Useful for testing before group is set up
 */
export const sendTestNotification = async (
  apiToken: string,
  userKey: string,
  message: string,
  title?: string
): Promise<SendNotificationResult> => {
  try {
    const body = new URLSearchParams({
      token: apiToken,
      user: userKey,
      message: message,
    });

    if (title) body.append("title", title);

    const response = await fetch(`${PUSHOVER_API_BASE}/messages.json`, {
      method: "POST",
      body: body,
    });

    const data: PushoverResponse = await response.json();

    if (data.status === 1) {
      return {
        success: true,
        requestId: data.request,
        status: data.status,
      };
    } else {
      return {
        success: false,
        error: data.errors?.join(", ") || "Failed to send test notification",
        status: data.status,
      };
    }
  } catch (error: any) {
    console.error("Pushover send test notification error:", error);
    return {
      success: false,
      error: error.message || "Failed to send test notification",
    };
  }
};

/**
 * Verify Pushover credentials by sending a validation request
 * This validates the API token and user key combination
 */
export const verifyCredentials = async (
  apiToken: string,
  userKey: string
): Promise<GroupOperationResult> => {
  try {
    const body = new URLSearchParams({
      token: apiToken,
      user: userKey,
    });

    const response = await fetch(`${PUSHOVER_API_BASE}/users/validate.json`, {
      method: "POST",
      body: body,
    });

    const data: PushoverResponse = await response.json();

    if (data.status === 1) {
      return { success: true };
    } else {
      return {
        success: false,
        error: data.errors?.join(", ") || "Invalid credentials",
      };
    }
  } catch (error: any) {
    console.error("Pushover verify credentials error:", error);
    return {
      success: false,
      error: error.message || "Failed to verify credentials",
    };
  }
};
