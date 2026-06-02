// Location: ConcertHub/frontend/src/pages/artist/ArtistProfilePage.jsx
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { HiCamera, HiSave } from 'react-icons/hi';
import { artistAPI } from '../../services/api';
import Button from '../../components/ui/Button';
import { GENRES, getErrorMessage } from '../../utils/helpers';
import styles from './ArtistPages.module.css';

const ArtistProfilePage = () => {
  const [artist, setArtist]           = useState(null);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [profileFile, setProfileFile] = useState(null);
  const [bannerFile, setBannerFile]   = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [bannerPreview, setBannerPreview]   = useState(null);
  const [form, setForm] = useState({
    stageName: '', bio: '', genres: [],
    instagram: '', twitter: '', spotify: '', youtube: '', website: '',
  });

  useEffect(() => {
    artistAPI.getMe().then(res => {
      const a = res.data.artist;
      setArtist(a);
      setForm({
        stageName: a.stageName || '',
        bio: a.bio || '',
        genres: a.genre || [],
        instagram: a.socialLinks?.instagram || '',
        twitter: a.socialLinks?.twitter || '',
        spotify: a.socialLinks?.spotify || '',
        youtube: a.socialLinks?.youtube || '',
        website: a.socialLinks?.website || '',
      });
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const toggleGenre = (g) => {
    setForm(f => ({
      ...f,
      genres: f.genres.includes(g) ? f.genres.filter(x => x !== g) : [...f.genres, g],
    }));
  };

  const handleImgChange = (type, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    if (type === 'profile') { setProfileFile(file); setProfilePreview(preview); }
    else { setBannerFile(file); setBannerPreview(preview); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.stageName) { toast.error('Stage name required'); return; }
    if (form.genres.length === 0) { toast.error('Select at least one genre'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('stageName', form.stageName);
      fd.append('bio', form.bio);
      form.genres.forEach(g => fd.append('genre', g));
      const social = { instagram: form.instagram, twitter: form.twitter, spotify: form.spotify, youtube: form.youtube, website: form.website };
      fd.append('socialLinks', JSON.stringify(social));
      if (profileFile) fd.append('profileImage', profileFile);
      if (bannerFile)  fd.append('bannerImage', bannerFile);
      const res = await artistAPI.updateMe(fd);
      setArtist(res.data.artist);
      toast.success('Profile updated!');
    } catch (e) { toast.error(getErrorMessage(e)); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="page-content"><div className="container"><div className="skeleton" style={{ height: 40, width: '30%' }} /></div></div>;

  return (
    <div className={`page-content ${styles.page}`}>
      <div className="container" style={{ maxWidth: 760 }}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>ARTIST PORTAL</p>
          <h1 className={styles.title}>Edit Profile</h1>
        </div>

        <form onSubmit={handleSave} className={styles.profileForm}>
          {/* Banner */}
          <div className={styles.bannerSection}>
            <label htmlFor="banner-inp" className={styles.bannerEditArea}>
              {bannerPreview || artist?.bannerImage
                ? <img src={bannerPreview || artist?.bannerImage} alt="" className={styles.bannerImg} />
                : <div className={styles.bannerEmpty}>Click to upload banner</div>
              }
              <div className={styles.bannerEditOverlay}><HiCamera /> Change Banner</div>
            </label>
            <input id="banner-inp" type="file" accept="image/*" hidden onChange={e => handleImgChange('banner', e)} />

            {/* Profile avatar over banner */}
            <div className={styles.profileAvatarEdit}>
              <div className={styles.profileAvatarInner}>
                {profilePreview || artist?.profileImage
                  ? <img src={profilePreview || artist?.profileImage} alt="" />
                  : <span className="display">{form.stageName?.slice(0,2).toUpperCase()}</span>
                }
                <label htmlFor="profile-inp" className={styles.avatarEditOverlay}><HiCamera /></label>
                <input id="profile-inp" type="file" accept="image/*" hidden onChange={e => handleImgChange('profile', e)} />
              </div>
            </div>
          </div>

          <div className={styles.formSection}>
            <div className={styles.formGrid2}>
              <div className={styles.field}>
                <label className={styles.label}>Stage Name *</label>
                <input className="input" value={form.stageName} onChange={e => setForm(f => ({ ...f, stageName: e.target.value }))} required />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Bio</label>
              <textarea className="input" rows={5} value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} style={{ resize: 'vertical' }} placeholder="Tell fans about yourself…" />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Genres *</label>
              <div className={styles.genrePicker}>
                {GENRES.map(g => (
                  <button
                    key={g} type="button"
                    className={`${styles.genrePickerBtn} ${form.genres.includes(g) ? styles.genrePickerBtnActive : ''}`}
                    onClick={() => toggleGenre(g)}
                  >{g}</button>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.formSection}>
            <h3 className={styles.subheading}>Social Links</h3>
            <div className={styles.formGrid2}>
              {['instagram','twitter','spotify','youtube','website'].map(k => (
                <div key={k} className={styles.field}>
                  <label className={styles.label}>{k.charAt(0).toUpperCase() + k.slice(1)}</label>
                  <input className="input" placeholder={`https://…`} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" variant="primary" size="lg" icon={<HiSave />} loading={saving}>
            Save Profile
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ArtistProfilePage;