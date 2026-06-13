/**
 * In-memory JWT token blocklist.
 * Tokens are added here on logout and checked by the auth middleware.
 * Note: This resets on server restart — acceptable for a single-server
 * college project deployment. For production, use a Redis-backed store.
 */

const blocklist = new Set();

/**
 * Add a token to the blocklist (call on logout).
 * @param {string} token - The raw JWT string.
 */
export const blockToken = (token) => {
  blocklist.add(token);
};

/**
 * Check whether a token has been revoked.
 * @param {string} token - The raw JWT string.
 * @returns {boolean}
 */
export const isTokenBlocked = (token) => {
  return blocklist.has(token);
};
