// Location: ConcertHub/frontend/src/pages/ArtistDetailPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HiArrowLeft, HiHeart, HiStar, HiGlobeAlt, HiMusicNote } from 'react-icons/hi';
import { FaInstagram, FaTwitter, FaSpotify, FaYoutube } from 'react-icons/fa';
import { artistAPI, reviewAPI, userAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import EventCard from '../components/ui/EventCard';
import { genreColors, getErrorMessage } from '../utils/helpers';
import styles from './ArtistDetailPage.module.css';

const ArtistDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuthStore();

  const [artist, setArtist]   = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFav, setIsFav]     = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [arRes, rvRes] = await Promise.all([
          artistAPI.getById(id),
          reviewAPI.getArtistReviews(id, { limit: 5 }),
        ]);
        setArtist(arRes.data.artist);
        setReviews(rvRes.data.reviews);
        if (user?.favoriteArtists?.includes(id)) setIsFav(true);
      } catch { navigate('/artists'); }
      finally { setLoading(false); }
    };
    fetch();
  }, [id]);

  const handleFav = async () => {
    if (!isLoggedIn()) { navigate('/login'); return; }
    try {
      await userAPI.favArtist(id);
      setIsFav(f => !f);
      toast.success(isFav ? 'Removed from favorites' : 'Added to favorites');
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  if (loading) return (
    <div className="page-content"><div className="container">
      <div className="skeleton" style={{ width: '100%', height: 320, borderRadius: 0, marginTop: -64 }} />
    </div></div>
  );
  if (!artist) return null;

  const socialIcons = {
    instagram: <FaInstagram />,
    twitter: <FaTwitter />,
    spotify: <FaSpotify />,
    youtube: <FaYoutube />,
    website: <HiGlobeAlt />,
  };

  return (
    <div className={styles.page}>
      {/* Banner */}
      <div className={styles.banner}>
        {artist.bannerImage
          ? <img src={artist.bannerImage} alt="" className={styles.bannerImg} />
          : <div className={styles.bannerPlaceholder} />
        }
        <div className={styles.bannerOverlay} />
      </div>

      <div className="container">
        <div className={styles.profileRow}>
          <Link to="/artists" className={styles.back}><HiArrowLeft /> Artists</Link>
          <div className={styles.profileMain}>
            <div className={styles.avatarWrapper}>
              {artist.profileImage
                ? <img src={artist.profileImage} alt={artist.stageName} className={styles.avatar} />
                : <span className={`display ${styles.avatarInitials}`}>{artist.stageName.slice(0,2).toUpperCase()}</span>
              }
            </div>
            <div className={styles.profileInfo}>
              <div className={styles.profileTop}>
                <div>
                  <h1 className={styles.artistName}>{artist.stageName}</h1>
                  <div className={styles.genreRow}>
                    {artist.genre?.map(g => (
                      <span
                        key={g}
                        className={styles.genreTag}
                        style={{ background: (genreColors[g]||genreColors['Other']).bg, color: (genreColors[g]||genreColors['Other']).color }}
                      >{g}</span>
                    ))}
                  </div>
                </div>
                <button
                  className={`${styles.favBtn} ${isFav ? styles.favActive : ''}`}
                  onClick={handleFav}
                >
                  <HiHeart />
                  {isFav ? 'Following' : 'Follow'}
                </button>
              </div>

              {/* Stats */}
              <div className={styles.statsRow}>
                <div className={styles.stat}>
                  <p className={styles.statNum}>{artist.totalTicketsSold?.toLocaleString() || 0}</p>
                  <p className={styles.statLabel}>Tickets Sold</p>
                </div>
                <div className={styles.statDivider} />
                <div className={styles.stat}>
                  <p className={styles.statNum}>{artist.events?.length || 0}</p>
                  <p className={styles.statLabel}>Events</p>
                </div>
                {artist.averageRating > 0 && <>
                  <div className={styles.statDivider} />
                  <div className={styles.stat}>
                    <p className={styles.statNum}>{artist.averageRating?.toFixed(1)}</p>
                    <p className={styles.statLabel}>Avg Rating</p>
                  </div>
                </>}
              </div>

              {/* Socials */}
              {artist.socialLinks && Object.entries(artist.socialLinks).some(([,v]) => v) && (
                <div className={styles.socials}>
                  {Object.entries(artist.socialLinks).map(([k, v]) => v ? (
                    <a key={k} href={v} target="_blank" rel="noreferrer" className={styles.socialLink}>
                      {socialIcons[k]}
                    </a>
                  ) : null)}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.layout}>
          <div className={styles.main}>
            {/* Bio */}
            {artist.bio && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>About</h2>
                <p className={styles.bio}>{artist.bio}</p>
              </section>
            )}

            {/* Events */}
            {artist.events?.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Upcoming Events</h2>
                <div className={styles.eventsGrid}>
                  {artist.events.map((ev, i) => <EventCard key={ev._id} event={ev} index={i} />)}
                </div>
              </section>
            )}

            {/* Reviews */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Fan Reviews</h2>
              {reviews.length > 0 ? (
                <div className={styles.reviewList}>
                  {reviews.map(rv => (
                    <div key={rv._id} className={styles.reviewCard}>
                      <div className={styles.reviewHeader}>
                        <div className={styles.reviewAvatar}>{rv.user?.name?.slice(0,2).toUpperCase()}</div>
                        <div>
                          <p className={styles.reviewName}>{rv.user?.name}</p>
                          <div className={styles.stars}>
                            {[1,2,3,4,5].map(s => (
                              <HiStar key={s} style={{ color: s <= rv.rating ? '#f5c518' : 'var(--text-muted)', fontSize: 14 }} />
                            ))}
                          </div>
                        </div>
                      </div>
                      {rv.comment && <p className={styles.reviewComment}>{rv.comment}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.noReviews}>No reviews yet</p>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtistDetailPage;