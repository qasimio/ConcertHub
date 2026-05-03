// Location: ConcertHub/frontend/src/components/layout/Navbar.jsx
import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { HiMenuAlt3, HiX, HiTicket } from 'react-icons/hi';
import useAuthStore from '../../store/authStore';
import { getInitials, formatCurrency } from '../../utils/helpers';
import styles from './Navbar.module.css';

const Navbar = () => {
  const { user, logout, isLoggedIn, isAdmin, isArtist } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setUserMenuOpen(false);
  };

  const navLinks = [
    { to: '/events', label: 'Events' },
    { to: '/artists', label: 'Artists' },
  ];

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}>
      <div className={`container ${styles.inner}`}>
        {/* Logo */}
        <Link to="/" className={styles.logo}>
          <HiTicket className={styles.logoIcon} />
          <span className={styles.logoText}>Concert<span className={styles.logoAccent}>Hub</span></span>
        </Link>

        {/* Desktop Nav Links */}
        <div className={styles.links}>
          {navLinks.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => `${styles.link} ${isActive ? styles.linkActive : ''}`}
            >
              {l.label}
            </NavLink>
          ))}
          {isAdmin() && (
            <NavLink to="/admin" className={({ isActive }) => `${styles.link} ${isActive ? styles.linkActive : ''}`}>
              Admin
            </NavLink>
          )}
          {isArtist() && (
            <NavLink to="/artist-dashboard" className={({ isActive }) => `${styles.link} ${isActive ? styles.linkActive : ''}`}>
              Dashboard
            </NavLink>
          )}
        </div>

        {/* Right side */}
        <div className={styles.right}>
          {isLoggedIn() ? (
            <div className={styles.userMenu}>
              {/* Wallet badge */}
              {user?.role === 'user' && (
                <span className={styles.walletBadge}>
                  {formatCurrency(user?.walletBalance)}
                </span>
              )}
              {/* Avatar */}
              <button
                className={styles.avatar}
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-label="User menu"
              >
                {getInitials(user?.name)}
              </button>

              {/* Dropdown */}
              {userMenuOpen && (
                <div className={styles.dropdown}>
                  <div className={styles.dropdownHeader}>
                    <p className={styles.dropdownName}>{user?.name}</p>
                    <p className={styles.dropdownRole}>{user?.role}</p>
                  </div>
                  <Link to="/profile" className={styles.dropdownItem} onClick={() => setUserMenuOpen(false)}>Profile</Link>
                  {user?.role === 'user' && (
                    <Link to="/my-bookings" className={styles.dropdownItem} onClick={() => setUserMenuOpen(false)}>My Bookings</Link>
                  )}
                  {user?.role === 'user' && (
                    <Link to="/wallet" className={styles.dropdownItem} onClick={() => setUserMenuOpen(false)}>Wallet</Link>
                  )}
                  <button className={`${styles.dropdownItem} ${styles.dropdownLogout}`} onClick={handleLogout}>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.authButtons}>
              <Link to="/login" className={styles.btnLogin}>Sign In</Link>
              <Link to="/register" className={styles.btnRegister}>Get Started</Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button className={styles.hamburger} onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <HiX /> : <HiMenuAlt3 />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className={styles.mobileMenu}>
          {navLinks.map(l => (
            <NavLink key={l.to} to={l.to} className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
              {l.label}
            </NavLink>
          ))}
          {isAdmin() && <NavLink to="/admin" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Admin</NavLink>}
          {isArtist() && <NavLink to="/artist-dashboard" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Dashboard</NavLink>}
          {!isLoggedIn() && (
            <>
              <Link to="/login" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Sign In</Link>
              <Link to="/register" className={`${styles.mobileLink} ${styles.mobileLinkAccent}`} onClick={() => setMenuOpen(false)}>Get Started</Link>
            </>
          )}
          {isLoggedIn() && (
            <button className={`${styles.mobileLink} ${styles.mobileLinkDanger}`} onClick={handleLogout}>Sign Out</button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;