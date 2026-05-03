// Location: ConcertHub/frontend/src/pages/user/ProfilePage.jsx
import { useState } from 'react';
import toast from 'react-hot-toast';
import { HiCamera, HiUser, HiMail, HiPhone, HiLockClosed } from 'react-icons/hi';
import { userAPI, authAPI } from '../../services/api';
import useAuthStore from '../../store/authStore';
import Button from '../../components/ui/Button';
import { getInitials, getErrorMessage } from '../../utils/helpers';
import styles from './UserPages.module.css';

const ProfilePage = () => {
  const { user, updateUser } = useAuthStore();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '' });
  const [loading, setLoading]   = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [imgFile, setImgFile]   = useState(null);
  const [imgPreview, setImgPreview] = useState(null);

  const handleImgChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImgFile(file);
    setImgPreview(URL.createObjectURL(file));
  };

  const handleProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      if (form.phone) fd.append('phone', form.phone);
      if (imgFile) fd.append('profileImage', imgFile);
      const res = await userAPI.updateProfile(fd);
      updateUser(res.data.user);
      toast.success('Profile updated!');
    } catch (e) { toast.error(getErrorMessage(e)); }
    finally { setLoading(false); }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    if (pwdForm.newPassword.length < 6) { toast.error('Min 6 characters'); return; }
    setPwdLoading(true);
    try {
      await authAPI.updatePassword(pwdForm);
      toast.success('Password changed!');
      setPwdForm({ currentPassword: '', newPassword: '' });
    } catch (e) { toast.error(getErrorMessage(e)); }
    finally { setPwdLoading(false); }
  };

  return (
    <div className={`page-content ${styles.page}`}>
      <div className="container" style={{ maxWidth: 720 }}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>ACCOUNT</p>
          <h1 className={styles.title}>My Profile</h1>
        </div>

        {/* Avatar section */}
        <div className={styles.avatarSection}>
          <div className={styles.avatarLarge}>
            {imgPreview || user?.profileImage
              ? <img src={imgPreview || user?.profileImage} alt="avatar" />
              : <span>{getInitials(user?.name)}</span>
            }
            <label className={styles.avatarUpload} htmlFor="avatar-upload">
              <HiCamera />
            </label>
            <input id="avatar-upload" type="file" accept="image/*" hidden onChange={handleImgChange} />
          </div>
          <div>
            <p className={styles.avatarName}>{user?.name}</p>
            <p className={styles.avatarRole}>{user?.role}</p>
          </div>
        </div>

        {/* Profile form */}
        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Personal Information</h2>
          <form onSubmit={handleProfile} className={styles.form}>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label className={styles.label}><HiUser /> Full Name</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}><HiMail /> Email</label>
                <input className="input" value={user?.email} disabled style={{ opacity: 0.5 }} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}><HiPhone /> Phone</label>
                <input
                  className="input"
                  placeholder="+1 (555) 000-0000"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                />
              </div>
            </div>
            <Button type="submit" variant="primary" size="md" loading={loading}>Save Changes</Button>
          </form>
        </div>

        {/* Password form */}
        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Change Password</h2>
          <form onSubmit={handlePassword} className={styles.form}>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label className={styles.label}><HiLockClosed /> Current Password</label>
                <input
                  type="password" className="input"
                  placeholder="••••••••"
                  value={pwdForm.currentPassword}
                  onChange={e => setPwdForm(f => ({ ...f, currentPassword: e.target.value }))}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}><HiLockClosed /> New Password</label>
                <input
                  type="password" className="input"
                  placeholder="Min. 6 characters"
                  value={pwdForm.newPassword}
                  onChange={e => setPwdForm(f => ({ ...f, newPassword: e.target.value }))}
                />
              </div>
            </div>
            <Button type="submit" variant="secondary" size="md" loading={pwdLoading}>Update Password</Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
