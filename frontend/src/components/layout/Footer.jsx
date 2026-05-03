// Location: ConcertHub/frontend/src/components/layout/Footer.jsx
import { Link } from 'react-router-dom';
import { HiTicket } from 'react-icons/hi';
import styles from './Footer.module.css';

const Footer = () => (
  <footer className={styles.footer}>
    <div className={`container ${styles.inner}`}>
      <div className={styles.brand}>
        <Link to="/" className={styles.logo}>
          <HiTicket />
          Concert<span>Hub</span>
        </Link>
        <p className={styles.tagline}>Discover. Book. Experience.</p>
      </div>
      <div className={styles.links}>
        <Link to="/events">Events</Link>
        <Link to="/artists">Artists</Link>
        <Link to="/register">Join</Link>
      </div>
      <p className={styles.copy}>© {new Date().getFullYear()} ConcertHub. All rights reserved.</p>
    </div>
  </footer>
);

export default Footer;