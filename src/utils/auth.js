/**
 * Check if the user session is valid
 * @returns {boolean} True if session is valid, false otherwise
 */
export const isSessionValid = () => {
  if (typeof window === "undefined") {
    return false; // Server-side rendering check
  }

  const userData = localStorage.getItem("user");
  if (!userData) {
    return false;
  }

  try {
    const user = JSON.parse(userData);
    return user.sessionExpiry && user.sessionExpiry > Date.now();
  } catch (error) {
    console.error("Error checking session validity:", error);
    return false;
  }
};

/**
 * Clear user session data
 */
export const clearSession = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("user");
  }
};
