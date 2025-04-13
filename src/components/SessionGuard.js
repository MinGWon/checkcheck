import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { isSessionValid, refreshSession } from '../utils/sessionUtils';

/**
 * A component that guards routes requiring authentication
 * Checks if the session is valid and redirects to login if not
 */
export default function SessionGuard({ children }) {
  const router = useRouter();

  useEffect(() => {
    // Check if session is valid
    if (!isSessionValid()) {
      // Redirect to login page if session is invalid or expired
      router.replace('/');
      return;
    }
    
    // Set up interval to periodically check session validity
    const intervalId = setInterval(() => {
      if (!isSessionValid()) {
        clearInterval(intervalId);
        router.replace('/');
      }
    }, 60000); // Check every minute
    
    // Optional: refresh the session on user activity
    const handleUserActivity = () => {
      if (isSessionValid()) {
        refreshSession();
      }
    };
    
    // Add event listeners for user activity
    window.addEventListener('click', handleUserActivity);
    window.addEventListener('keypress', handleUserActivity);
    
    // Clean up on unmount
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('click', handleUserActivity);
      window.removeEventListener('keypress', handleUserActivity);
    };
  }, [router]);

  return <>{children}</>;
}
