// Location: ConcertHub/frontend/src/pages/EventsPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HiSearch, HiAdjustments, HiX } from 'react-icons/hi';
import { eventAPI } from '../services/api';
import EventCard from '../components/ui/EventCard';
import Button from '../components/ui/Button';
import { GENRES } from '../utils/helpers';
import styles from './EventsPage.module.css';

const SORT_OPTIONS = [
  { value: '', label: 'Upcoming' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low–High' },
  { value: 'price_desc', label: 'Price: High–Low' },
  { value: 'rating', label: 'Top Rated' },
];

const EventsPage = () => {
  const [searchParams] = useSearchParams();
  const [events, setEvents]   = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [pages, setPages]     = useState(1);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    genre: searchParams.get('genre') || '',
    city: '',
    minPrice: '',
    maxPrice: '',
    sortBy: '',
  });

  const fetchEvents = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const params = { page: pg, limit: 12 };
      if (filters.search)   params.search   = filters.search;
      if (filters.genre)    params.genre    = filters.genre;
      if (filters.city)     params.city     = filters.city;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      if (filters.sortBy)   params.sortBy   = filters.sortBy;

      const res = await eventAPI.getAll(params);
      setEvents(res.data.events);
      setTotal(res.data.total);
      setPages(res.data.pages);
      setPage(pg);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(() => fetchEvents(1), 0);
    return () => clearTimeout(timer);
  }, [fetchEvents]);

  const handleFilter = (key, val) => setFilters(f => ({ ...f, [key]: val }));
  const clearFilters = () => setFilters({ search: '', genre: '', city: '', minPrice: '', maxPrice: '', sortBy: '' });
  const hasFilters = filters.search || filters.genre || filters.city || filters.minPrice || filters.maxPrice;

  return (
    <div className={`page-content ${styles.page}`}>
      <div className="container">
        {/* Header */}
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>LIVE MUSIC</p>
            <h1 className={styles.title}>Browse Events</h1>
            <p className={styles.subtitle}>{total} events found</p>
          </div>
        </div>

        {/* Search + filter bar */}
        <div className={styles.searchBar}>
          <div className={styles.searchField}>
            <HiSearch className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder="Search events, artists, venues…"
              value={filters.search}
              onChange={e => handleFilter('search', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchEvents(1)}
            />
            {filters.search && (
              <button className={styles.clearSearch} onClick={() => handleFilter('search', '')}>
                <HiX />
              </button>
            )}
          </div>

          <select
            className={styles.select}
            value={filters.genre}
            onChange={e => handleFilter('genre', e.target.value)}
          >
            <option value="">All Genres</option>
            {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>

          <select
            className={styles.select}
            value={filters.sortBy}
            onChange={e => handleFilter('sortBy', e.target.value)}
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <Button
            variant="ghost"
            size="sm"
            icon={<HiAdjustments />}
            onClick={() => setShowFilters(!showFilters)}
          >
            More Filters
          </Button>

          {hasFilters && (
            <Button variant="ghost" size="sm" icon={<HiX />} onClick={clearFilters}>
              Clear
            </Button>
          )}
        </div>

        {/* Extended filters */}
        {showFilters && (
          <div className={styles.extFilters}>
            <input
              className={`input ${styles.filterInput}`}
              placeholder="City"
              value={filters.city}
              onChange={e => handleFilter('city', e.target.value)}
            />
            <input
              className={`input ${styles.filterInput}`}
              type="number"
              placeholder="Min price ($)"
              value={filters.minPrice}
              onChange={e => handleFilter('minPrice', e.target.value)}
            />
            <input
              className={`input ${styles.filterInput}`}
              type="number"
              placeholder="Max price ($)"
              value={filters.maxPrice}
              onChange={e => handleFilter('maxPrice', e.target.value)}
            />
            <Button variant="primary" size="sm" onClick={() => fetchEvents(1)}>
              Apply
            </Button>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className={styles.grid}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className={styles.skeletonCard}>
                <div className="skeleton" style={{ aspectRatio: '16/9', borderRadius: 0 }} />
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="skeleton" style={{ height: 18, width: '70%' }} />
                  <div className="skeleton" style={{ height: 13, width: '40%' }} />
                  <div className="skeleton" style={{ height: 13, width: '55%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : events.length > 0 ? (
          <>
            <div className={styles.grid}>
              {events.map((ev, i) => <EventCard key={ev._id} event={ev} index={i} />)}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className={styles.pagination}>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => fetchEvents(page - 1)}
                >
                  ← Previous
                </Button>
                <span className={styles.pageInfo}>Page {page} of {pages}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page >= pages}
                  onClick={() => fetchEvents(page + 1)}
                >
                  Next →
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className={styles.empty}>
            <p className={`display ${styles.emptyBig}`}>NO SHOWS</p>
            <p className={styles.emptySub}>Try adjusting your filters</p>
            <Button variant="ghost" onClick={clearFilters}>Clear All Filters</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsPage;