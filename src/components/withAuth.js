import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { isSessionValid } from '@/utils/auth';

/**
 * Higher-Order Component that protects routes requiring authentication
 */
export default function withAuth(Component) {
  const AuthenticatedComponent = (props) => {
    const router = useRouter();
    
    useEffect(() => {
      // Check session validity when component mounts
      if (!isSessionValid()) {
        router.replace('/');
      }
    }, [router]);

    // Add an interval to periodically check session validity
    useEffect(() => {
      const interval = setInterval(() => {
        if (!isSessionValid()) {
          router.replace('/');
        }
      }, 60000); // Check every minute
      
      return () => clearInterval(interval);
    }, [router]);

    // Return protected component if session is valid
    return isSessionValid() ? <Component {...props} /> : null;
  };

  return AuthenticatedComponent;
}
