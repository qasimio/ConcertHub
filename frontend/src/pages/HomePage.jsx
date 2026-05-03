// Location: ConcertHub/frontend/src/pages/HomePage.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiSearch, HiArrowRight, HiLightningBolt, HiMusicNote } from 'react-icons/hi';
import { eventAPI, artistAPI } from '../services/api';
import EventCard from '../components/ui/EventCard';
import { genreColors, GENRES } from '../utils/helpers';
import styles from './HomePage.module.css';

const TICKER_ITEMS = ['ROCK','JAZZ','ELECTRONIC','INDIE','POP','SOUL','HIP-HOP','CLASSICAL','R&B','METAL'];

const HomePage = () => {
  const [events, setEvents]   = useState([]);
  const [artists, setArtists] = useState([]);
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [evRes, arRes] = await Promise.all([
          eventAPI.getAll({ limit: 6, sortBy: 'newest' }),
          artistAPI.getAll({ limit: 6 }),
        ]);
        setEvents(evRes.data.events);
        setArtists(arRes.data.artists);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/events?search=${encodeURIComponent(search)}`);
  };

  return (
    <div className={styles.page}>
      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroBg}>
          <div className={styles.heroGrad1} />
          <div className={styles.heroGrad2} />
          <div className={styles.heroGrid} />
        </div>

        <div className={`container ${styles.heroContent}`}>
          <div className={`${styles.heroBadge} animate-fade-up stagger-1`}>
            <HiLightningBolt />
            <span>Live Music. Real Moments.</span>
          </div>

          <h1 className={`${styles.heroTitle} animate-fade-up stagger-2`}>
            <span className={`display ${styles.heroTitleBig}`}>FIND YOUR</span>
            <span className={`display ${styles.heroTitleAccent}`}>NEXT SHOW</span>
          </h1>

          <p className={`${styles.heroSub} animate-fade-up stagger-3`}>
            Discover thousands of live concerts, from intimate jazz nights
            to stadium rock spectacles.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className={`${styles.searchForm} animate-fade-up stagger-4`}>
            <div className={styles.searchWrapper}>
              <HiSearch className={styles.searchIcon} />
              <input
                className={styles.searchInput}
                placeholder="Search artists, venues, genres…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <button type="submit" className={styles.searchBtn}>
                Search <HiArrowRight />
              </button>
            </div>
          </form>

          {/* Genre pills */}
          <div className={`${styles.genrePills} animate-fade-up stagger-5`}>
            {GENRES.slice(0, 8).map(g => {
              const c = genreColors[g];
              return (
                <Link
                  key={g}
                  to={`/events?genre=${g}`}
                  className={styles.genrePill}
                  style={{ background: c.bg, color: c.color, borderColor: c.color + '40' }}
                >
                  {g}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Scrolling ticker */}
        <div className={styles.ticker}>
          <div className={styles.tickerTrack}>
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((t, i) => (
              <span key={i} className={styles.tickerItem}>
                <HiMusicNote /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Events ─────────────────────────────────────────────────── */}
      <section className={`container ${styles.section}`}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionEye}>WHAT'S ON</p>
            <h2 className={styles.sectionTitle}>Upcoming Shows</h2>
          </div>
          <Link to="/events" className={styles.sectionLink}>
            View all <HiArrowRight />
          </Link>
        </div>

        {loading ? (
          <div className={styles.skeletonGrid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={styles.skeletonCard}>
                <div className={`skeleton ${styles.skeletonImg}`} />
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="skeleton" style={{ height: 18, width: '70%' }} />
                  <div className="skeleton" style={{ height: 14, width: '40%' }} />
                  <div className="skeleton" style={{ height: 14, width: '55%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : events.length > 0 ? (
          <div className={styles.eventGrid}>
            {events.map((ev, i) => <EventCard key={ev._id} event={ev} index={i} />)}
          </div>
        ) : (
          <div className={styles.empty}>
            <HiMusicNote className={styles.emptyIcon} />
            <p>No upcoming events yet. Check back soon!</p>
          </div>
        )}
      </section>

      {/* ── Artists ─────────────────────────────────────────────────────────── */}
      <section className={styles.artistSection}>
        <div className={`container ${styles.section}`}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionEye}>WHO'S PERFORMING</p>
              <h2 className={styles.sectionTitle}>Featured Artists</h2>
            </div>
            <Link to="/artists" className={styles.sectionLink}>
              All artists <HiArrowRight />
            </Link>
          </div>

          <div className={styles.artistGrid}>
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className={styles.artistCardSkeleton}>
                    <div className="skeleton" style={{ width: 72, height: 72, borderRadius: '50%', margin: '0 auto' }} />
                    <div className="skeleton" style={{ height: 14, width: '60%', margin: '12px auto 0' }} />
                    <div className="skeleton" style={{ height: 11, width: '40%', margin: '6px auto 0' }} />
                  </div>
                ))
              : artists.map((artist, i) => (
                  <Link
                    key={artist._id}
                    to={`/artists/${artist._id}`}
                    className={styles.artistCard}
                    style={{ animationDelay: `${i * 0.07}s` }}
                  >
                    <div className={styles.artistAvatar}>
                      {artist.profileImage
                        ? <img src={artist.profileImage} alt={artist.stageName} />
                        : <span className="display">{artist.stageName.slice(0,2).toUpperCase()}</span>
                      }
                    </div>
                    <h3 className={styles.artistName}>{artist.stageName}</h3>
                    <p className={styles.artistGenre}>{artist.genre?.join(', ')}</p>
                  </Link>
                ))
            }
          </div>
        </div>
      </section>

      {/* ── CTA Banner ─────────────────────────────────────────────────────── */}
      <section className={`container ${styles.section}`}>
        <div className={styles.ctaBanner}>
          <div className={styles.ctaBannerBg} />
          <div className={styles.ctaContent}>
            <p className={styles.sectionEye} style={{ color: 'var(--text-inverse)' }}>FOR ARTISTS</p>
            <h2 className={styles.ctaTitle}>Share Your Music With The World</h2>
            <p className={styles.ctaSub}>Create your artist profile, list your events, and sell tickets directly to fans.</p>
            <Link to="/register?role=artist" className={styles.ctaBtn}>
              Join as Artist <HiArrowRight />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;