/**
 * Get the base URL for API requests
 *
 * In development:
 * - Returns the value from VITE_API_BASE_URL environment variable
 * - Default: http://localhost:8080 (backend server URL)
 * - This allows the frontend to make requests to the separate backend dev server
 *
 * In production:
 * - Returns empty string (frontend is served from same origin as backend)
 * - API requests use relative URLs which work since backend serves the frontend
 *
 * @returns The base URL for API requests (e.g., "http://localhost:8080" or "")
 */
export function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL || "";
}
