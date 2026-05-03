// Location: ConcertHub/frontend/src/pages/auth/LoginPage.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HiTicket, HiMail, HiLockClosed } from 'react-icons/hi';
import { authAPI } from '../../services/api';
import useAuthStore from '../../store/authStore';
import Button from '../../components/ui/Button';
import { getErrorMessage } from '../../utils/helpers';
import styles from './AuthPage.module.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.login(form);
      setAuth(res.data.user, res.data.token);
      toast.success(`Welcome back, ${res.data.user.name}!`);
      const role = res.data.user.role;
      if (role === 'admin') navigate('/admin');
      else if (role === 'artist') navigate('/artist-dashboard');
      else navigate('/events');
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.leftPanel}>
        <div className={styles.leftContent}>
          <Link to="/" className={styles.logoLink}>
            <HiTicket />
            ConcertHub
          </Link>
          <h1 className={`display ${styles.bigText}`}>LIVE<br/>MUSIC<br/>AWAITS</h1>
          <p className={styles.leftSub}>Thousands of concerts. One platform.</p>
        </div>
        <div className={styles.leftGrid} />
      </div>

      <div className={styles.rightPanel}>
        <div className={styles.formBox}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>Sign In</h2>
            <p className={styles.formSub}>
              Don't have an account?{' '}
              <Link to="/register" className={styles.formLink}>Create one</Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>Email</label>
              <div className={styles.inputWrapper}>
                <HiMail className={styles.inputIcon} />
                <input
                  type="email"
                  className={`input ${styles.inputWithIcon}`}
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Password</label>
              <div className={styles.inputWrapper}>
                <HiLockClosed className={styles.inputIcon} />
                <input
                  type="password"
                  className={`input ${styles.inputWithIcon}`}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                />
              </div>
            </div>

            <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
              Sign In
            </Button>
          </form>

          {/* Quick fills for dev */}
          <div className={styles.devHints}>
            <p className={styles.devLabel}>Quick login (dev)</p>
            <div className={styles.devBtns}>
              {[
                { label: 'Admin', email: 'admin@concerthub.com', pwd: 'Admin@123' },
                { label: 'Artist', email: 'luna@concerthub.com', pwd: 'Artist@123' },
                { label: 'User', email: 'alice@example.com', pwd: 'User@123' },
              ].map(d => (
                <button
                  key={d.label}
                  className={styles.devBtn}
                  onClick={() => setForm({ email: d.email, password: d.pwd })}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;