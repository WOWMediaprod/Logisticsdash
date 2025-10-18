/**
 * API Configuration
 * Provides the base URL for API calls based on environment variables
 */

// Get API base URL from environment variables
// In production (Vercel), this will be the Render API URL
// In development, this can be localhost
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_URL_HTTPS ||
  'http://localhost:3003';

/**
 * Helper function to construct full API URLs
 * @param path - The API path (e.g., '/api/v1/clients')
 * @returns Full API URL
 */
export function getApiUrl(path: string): string {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_BASE_URL}/${cleanPath}`;
}

/**
 * Helper function for API fetch calls with proper error handling
 * @param path - The API path
 * @param options - Fetch options
 * @returns Fetch response
 */
export async function apiFetch(path: string, options?: RequestInit) {
  const url = getApiUrl(path);
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  return response;
}
