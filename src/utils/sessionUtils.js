/**
 * Checks if the current user session is valid
 * @returns {boolean} true if session is valid, false otherwise
 */
export const isSessionValid = () => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return false;
    
    const user = JSON.parse(userStr);
    
    // Check if session has expiry and if it's still valid
    if (user.sessionExpiry && Date.now() < user.sessionExpiry) {
      return true;
    } else {
      // Session expired, clear it
      localStorage.removeItem('user');
      return false;
    }
  } catch (error) {
    console.error('Error checking session validity:', error);
    return false;
  }
};

/**
 * Updates the current session expiry time
 * Extends it by 10 more minutes from now
 */
export const refreshSession = () => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    
    const user = JSON.parse(userStr);
    const SESSION_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds
    
    // Update expiry time
    user.sessionExpiry = Date.now() + SESSION_TIMEOUT;
    localStorage.setItem('user', JSON.stringify(user));
  } catch (error) {
    console.error('Error refreshing session:', error);
  }
};

/**
 * Logs out the user by clearing their session data
 */
export const logoutUser = () => {
  localStorage.removeItem('user');
};
