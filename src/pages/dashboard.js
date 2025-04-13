import Head from "next/head";
import styles from "@/styles/Dashboard.module.css";
import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import Swal from 'sweetalert2'; // Import SweetAlert2

// Import tab components
import DashboardTab from "@/components/DashboardTab";
import UsersTab from "@/components/UsersTab";
import StudentsTab from "@/components/StudentsTab";
import DocsTab from "@/components/DocsTab";
import UpdateLogsTab from "@/components/UpdateLogsTab";

// Session timeout duration in milliseconds (15 minutes)
const SESSION_TIMEOUT = 15 * 60 * 1000;

export default function Dashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [activePage, setActivePage] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const sessionCheckIntervalRef = useRef(null);
  const [isProfileHovered, setIsProfileHovered] = useState(false);
  const hoverTimeoutRef = useRef(null);
  // Add loading state to prevent content flashing
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const userData = localStorage.getItem("user");
        if (!userData) {
          // Set loading to false but don't render content
          router.push("/");
          return;
        }

        const user = JSON.parse(userData);
        setUserName(user.name || user.userId);
        
        // Set/update the last activity timestamp
        localStorage.setItem("lastActivityTime", Date.now().toString());
        
        // User is authenticated
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/");
      } finally {
        // Mark loading as complete
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Session monitoring effect
  useEffect(() => {
    // Function to check if session is expired
    const checkSessionValidity = () => {
      const lastActivityTime = localStorage.getItem("lastActivityTime");
      if (!lastActivityTime) {
        handleLogout();
        return;
      }
      
      const currentTime = Date.now();
      const elapsedTime = currentTime - Number(lastActivityTime);
      
      if (elapsedTime > SESSION_TIMEOUT) {
        // Session expired
        alert("세션이 만료되었습니다. 다시 로그인해주세요.");
        handleLogout();
      }
    };
    
    // Set up interval to check session validity
    sessionCheckIntervalRef.current = setInterval(checkSessionValidity, 60000); // Check every minute
    
    // Update last activity time on user interaction
    const updateActivityTime = () => {
      localStorage.setItem("lastActivityTime", Date.now().toString());
    };
    
    // Add event listeners for user activity
    window.addEventListener("click", updateActivityTime);
    window.addEventListener("keypress", updateActivityTime);
    window.addEventListener("scroll", updateActivityTime);
    window.addEventListener("mousemove", updateActivityTime);
    
    // Initial check
    checkSessionValidity();
    
    // Cleanup function
    return () => {
      if (sessionCheckIntervalRef.current) {
        clearInterval(sessionCheckIntervalRef.current);
      }
      window.removeEventListener("click", updateActivityTime);
      window.removeEventListener("keypress", updateActivityTime);
      window.removeEventListener("scroll", updateActivityTime);
      window.removeEventListener("mousemove", updateActivityTime);
    };
  }, [router]);

  // Cleanup the hover timeout when component unmounts
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const handleLogoutConfirmation = () => {
    // Show SweetAlert2 confirmation dialog
    Swal.fire({
      title: '로그아웃',
      text: '로그아웃 하시겠습니까?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '예',
      cancelButtonText: '아니오',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33'
    }).then((result) => {
      if (result.isConfirmed) {
        handleLogout();
      }
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("lastActivityTime");
    router.push("/");
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleNavigation = (page) => {
    setActivePage(page);
    setMobileMenuOpen(false);
  };

  // Function to render the active tab component
  const renderActiveTab = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardTab userName={userName} />;
      case 'users':
        return <UsersTab userName={userName} />;
      case 'products':
        return <StudentsTab userName={userName} />;
      case 'orders':
        return <DocsTab userName={userName} />;
      case 'settings':
        return <UpdateLogsTab userName={userName} />;
      default:
        return <DashboardTab userName={userName} />;
    }
  };

  // If still loading or not authenticated, don't render anything
  if (isLoading || !isAuthenticated) {
    return null; // Return nothing while checking authentication
  }

  return (
    <>
      <Head>
        <title>아침 자습 CheckCheck</title>
        <meta name="description" content="관리자 대시보드" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" />
      </Head>
      <div className={styles.container}>
        {/* Top Navigation Bar */}
        <header className={styles.topNav}>
          <div className={styles.topNavLeft}>
            <button className={styles.menuToggle} onClick={toggleMobileMenu}>
              <i className="fas fa-bars"></i>
            </button>
            <h1 className={styles.logo}>아침 자습 CheckCheck</h1>
          </div>
          <div className={styles.topNavRight}>
            <div 
              className={styles.userProfile} 
              onClick={handleLogoutConfirmation}
              onMouseEnter={() => {
                if (hoverTimeoutRef.current) {
                  clearTimeout(hoverTimeoutRef.current);
                }
                setIsProfileHovered(true);
              }}
              onMouseLeave={() => {
                hoverTimeoutRef.current = setTimeout(() => {
                  setIsProfileHovered(false);
                }, 50); // 0.5 second delay
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                backgroundColor: isProfileHovered ? '#e0e0e0' : 'transparent',
                transition: 'background-color 0.3s ease',
              }}
            >
              <span className={styles.userName} style={{
                fontWeight: isProfileHovered ? 'bold' : 'normal'
              }}>
                {isProfileHovered ? "눌러서 로그아웃" : userName}
              </span>
              <div className={styles.userAvatar}>
                <i className="fas fa-user"></i>
              </div>
            </div>
          </div>
        </header>

        <div className={styles.mainContent}>
          {/* Sidebar */}
          <aside className={`${styles.sidebar} ${mobileMenuOpen ? styles.sidebarOpen : ''}`}>
            <nav className={styles.sidebarNav}>
              <ul className={styles.navList}>
                <li
                  className={`${styles.navItem} ${activePage === 'dashboard' ? styles.active : ''}`}
                  onClick={() => handleNavigation('dashboard')}
                >
                  <i className="fas fa-tachometer-alt"></i>
                  <span>대시보드</span>
                </li>
                <li
                  className={`${styles.navItem} ${activePage === 'users' ? styles.active : ''}`}
                  onClick={() => handleNavigation('users')}
                >
                  <i className="fas fa-calendar-check"></i>
                  <span>출결 관리</span>
                </li>
                <li
                  className={`${styles.navItem} ${activePage === 'products' ? styles.active : ''}`}
                  onClick={() => handleNavigation('products')}
                >
                  <i className="fas fa-user-graduate"></i>
                  <span>학생 관리</span>
                </li>
                <li
                  className={`${styles.navItem} ${activePage === 'orders' ? styles.active : ''}`}
                  onClick={() => handleNavigation('orders')}
                >
                  <i className="fas fa-file-alt"></i>
                  <span>문서 관리</span>
                </li>
                <li
                  className={`${styles.navItem} ${activePage === 'settings' ? styles.active : ''}`}
                  onClick={() => handleNavigation('settings')}
                >
                  <i className="fas fa-history"></i>
                  <span>업데이트 기록</span>
                </li>
              </ul>
            </nav>
          </aside>

          {/* Main Content */}
          <main className={styles.content}>
            <div className={styles.pageHeader}>
              <h2 className={styles.pageTitle}>
                {activePage === 'dashboard' && '대시보드'}
                {activePage === 'users' && '출결 관리'}
                {activePage === 'products' && '학생 관리'}
                {activePage === 'orders' && '문서 관리'}
                {activePage === 'settings' && '업데이트 기록'}
              </h2>
            </div>

            <div className={styles.dashboardContent}>
              {renderActiveTab()}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}