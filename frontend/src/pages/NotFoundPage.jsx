// Location: ConcertHub/frontend/src/pages/NotFoundPage.jsx
import { Link } from 'react-router-dom';
import { HiArrowLeft, HiTicket } from 'react-icons/hi';
import styles from './NotFoundPage.module.css';

const NotFoundPage = () => (
  <div className={styles.page}>
    <div className={styles.bg1} />
    <div className={styles.bg2} />
    <div className={styles.content}>
      <div className={styles.code}>
        <span className="display">4</span>
        <HiTicket className={styles.codeIcon} />
        <span className="display">4</span>
      </div>
      <h1 className={styles.title}>Page Not Found</h1>
      <p className={styles.sub}>
        Looks like this show has been cancelled — or never existed.
      </p>
      <Link to="/" className={styles.btn}>
        <HiArrowLeft /> Back to Home
      </Link>
    </div>
  </div>
);

export default NotFoundPage;