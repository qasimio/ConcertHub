// Location: ConcertHub/frontend/src/pages/auth/RegisterPage.jsx
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HiTicket, HiMail, HiLockClosed, HiUser } from 'react-icons/hi';
import { authAPI } from '../../services/api';
import useAuthStore from '../../store/authStore';
import Button from '../../components/ui/Button';
import { getErrorMessage } from '../../utils/helpers';
import styles from './AuthPage.module.css';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuth } = useAuthStore();
  const defaultRole = searchParams.get('role') === 'artist' ? 'artist' : 'user';

  const [form, setForm] = useState({ name: '', email: '', password: '', role: defaultRole });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const res = await authAPI.register(form);
      setAuth(res.data.user, res.data.token);
      toast.success(`Welcome to ConcertHub, ${res.data.user.name}! 🎉`);
      const role = res.data.user.role;
      if (role === 'artist') navigate('/artist-dashboard');
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
          <h1 className={`display ${styles.bigText}`}>JOIN<br/>THE<br/>SCENE</h1>
          <p className={styles.leftSub}>New users get $1,000 wallet credit to start booking.</p>
        </div>
        <div className={styles.leftGrid} />
      </div>

      <div className={styles.rightPanel}>
        <div className={styles.formBox}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>Create Account</h2>
            <p className={styles.formSub}>
              Already have one?{' '}
              <Link to="/login" className={styles.formLink}>Sign in</Link>
            </p>
          </div>

          {/* Role toggle */}
          <div className={styles.roleToggle}>
            <button
              type="button"
              className={`${styles.roleBtn} ${form.role === 'user' ? styles.roleBtnActive : ''}`}
              onClick={() => setForm(f => ({ ...f, role: 'user' }))}
            >
              🎟️ Fan / Attendee
            </button>
            <button
              type="button"
              className={`${styles.roleBtn} ${form.role === 'artist' ? styles.roleBtnActive : ''}`}
              onClick={() => setForm(f => ({ ...f, role: 'artist' }))}
            >
              🎤 Artist
            </button>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>Full Name</label>
              <div className={styles.inputWrapper}>
                <HiUser className={styles.inputIcon} />
                <input
                  type="text"
                  className={`input ${styles.inputWithIcon}`}
                  placeholder="Your name"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
            </div>

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
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                />
              </div>
            </div>

            {form.role === 'user' && (
              <div className={styles.bonusBadge}>
                🎁 You'll receive <strong>$1,000</strong> wallet credit on signup!
              </div>
            )}

            <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
              Create Account
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;