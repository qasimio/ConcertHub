// Location: ConcertHub/frontend/src/pages/ArtistsPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { HiSearch, HiStar, HiMusicNote } from 'react-icons/hi';
import { artistAPI } from '../services/api';
import { GENRES, genreColors } from '../utils/helpers';
import styles from './ArtistsPage.module.css';

const ArtistsPage = () => {
  const [artists, setArtists] = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [pages, setPages]     = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [genre, setGenre]     = useState('');

  const fetchArtists = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const params = { page: pg, limit: 12 };
      if (search) params.search = search;
      if (genre)  params.genre  = genre;
      const res = await artistAPI.getAll(params);
      setArtists(res.data.artists);
      setTotal(res.data.total);
      setPages(res.data.pages);
      setPage(pg);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search, genre]);

  useEffect(() => { fetchArtists(1); }, [fetchArtists]);

  return (
    <div className={`page-content ${styles.page}`}>
      <div className="container">
        <div className={styles.header}>
          <p className={styles.eyebrow}>MUSICIANS & PERFORMERS</p>
          <h1 className={styles.title}>Artists</h1>
          <p className={styles.subtitle}>{total} artists on ConcertHub</p>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.searchField}>
            <HiSearch className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder="Search artists…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchArtists(1)}
            />
          </div>
          <select className={styles.select} value={genre} onChange={e => setGenre(e.target.value)}>
            <option value="">All Genres</option>
            {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        {/* Genre pills */}
        <div className={styles.genreRow}>
          <button
            className={`${styles.genrePill} ${genre === '' ? styles.genrePillActive : ''}`}
            onClick={() => setGenre('')}
          >All</button>
          {GENRES.slice(0,8).map(g => {
            const c = genreColors[g];
            return (
              <button
                key={g}
                className={styles.genrePill}
                style={genre === g ? { background: c.bg, color: c.color, borderColor: c.color + '50' } : {}}
                onClick={() => setGenre(g === genre ? '' : g)}
              >
                {g}
              </button>
            );
          })}
        </div>

        {/* Grid */}
        {loading ? (
          <div className={styles.grid}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className={styles.skeletonCard}>
                <div className="skeleton" style={{ width: 80, height: 80, borderRadius: '50%', margin: '0 auto' }} />
                <div className="skeleton" style={{ height: 16, width: '60%', margin: '14px auto 6px' }} />
                <div className="skeleton" style={{ height: 12, width: '40%', margin: '0 auto' }} />
                <div className="skeleton" style={{ height: 12, width: '50%', margin: '6px auto 0' }} />
              </div>
            ))}
          </div>
        ) : artists.length > 0 ? (
          <>
            <div className={styles.grid}>
              {artists.map((artist, i) => (
                <ArtistCard key={artist._id} artist={artist} index={i} />
              ))}
            </div>
            {pages > 1 && (
              <div className={styles.pagination}>
                <button className={styles.pageBtn} disabled={page <= 1} onClick={() => fetchArtists(page - 1)}>← Prev</button>
                <span className={styles.pageInfo}>{page} / {pages}</span>
                <button className={styles.pageBtn} disabled={page >= pages} onClick={() => fetchArtists(page + 1)}>Next →</button>
              </div>
            )}
          </>
        ) : (
          <div className={styles.empty}>
            <HiMusicNote className={styles.emptyIcon} />
            <p>No artists found</p>
          </div>
        )}
      </div>
    </div>
  );
};

const ArtistCard = ({ artist, index }) => {
  const primaryGenre = artist.genre?.[0] || 'Other';
  const gc = genreColors[primaryGenre] || genreColors['Other'];

  return (
    <Link
      to={`/artists/${artist._id}`}
      className={styles.card}
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      <div className={styles.avatarWrapper}>
        {artist.profileImage
          ? <img src={artist.profileImage} alt={artist.stageName} className={styles.avatar} />
          : <span className={`display ${styles.avatarInitials}`}>{artist.stageName.slice(0,2).toUpperCase()}</span>
        }
        <div className={styles.avatarRing} />
      </div>
      <h3 className={styles.cardName}>{artist.stageName}</h3>
      <div className={styles.cardGenres}>
        {artist.genre?.slice(0,2).map(g => (
          <span
            key={g}
            className={styles.genreTag}
            style={{ background: (genreColors[g] || genreColors['Other']).bg, color: (genreColors[g] || genreColors['Other']).color }}
          >{g}</span>
        ))}
      </div>
      {artist.totalTicketsSold > 0 && (
        <p className={styles.cardStat}>{artist.totalTicketsSold.toLocaleString()} tickets sold</p>
      )}
    </Link>
  );
};

export default ArtistsPage;
