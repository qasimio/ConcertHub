// Location: ConcertHub/frontend/src/pages/user/MyBookingsPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HiCalendar, HiLocationMarker, HiTicket, HiX } from 'react-icons/hi';
import { userAPI, bookingAPI } from '../../services/api';
import useAuthStore from '../../store/authStore';
import Button from '../../components/ui/Button';
import { formatDateTime, formatCurrency, getErrorMessage, isEventFuture } from '../../utils/helpers';
import styles from './UserPages.module.css';

const STATUS_COLORS = {
  confirmed: { bg: 'rgba(77,255,180,0.1)', color: 'var(--success)' },
  cancelled:  { bg: 'rgba(74,81,104,0.2)', color: 'var(--text-muted)' },
  refunded:   { bg: 'rgba(77,244,255,0.1)', color: 'var(--electric)' },
  pending:    { bg: 'rgba(232,255,71,0.1)', color: 'var(--accent)' },
};

const MyBookingsPage = () => {
  const { updateUser } = useAuthStore();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('');
  const [cancelLoading, setCancelLoading] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await userAPI.getMyBookings({ limit: 50 });
        setBookings(res.data.bookings);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const handleCancel = async (bookingId) => {
    if (!confirm('Cancel this booking? You will receive a full refund.')) return;
    setCancelLoading(bookingId);
    try {
      const res = await bookingAPI.cancel(bookingId, { reason: 'User cancelled' });
      setBookings(bk => bk.map(b => b._id === bookingId ? { ...b, status: 'cancelled' } : b));
      updateUser({ walletBalance: res.data.newWalletBalance });
      toast.success(`Booking cancelled. ${formatCurrency(res.data.booking.totalPrice)} refunded!`);
    } catch (e) { toast.error(getErrorMessage(e)); }
    finally { setCancelLoading(null); }
  };

  const filtered = filter ? bookings.filter(b => b.status === filter) : bookings;

  return (
    <div className={`page-content ${styles.page}`}>
      <div className="container">
        <div className={styles.header}>
          <p className={styles.eyebrow}>YOUR TICKETS</p>
          <h1 className={styles.title}>My Bookings</h1>
        </div>

        {/* Filter tabs */}
        <div className={styles.tabs}>
          {['', 'confirmed', 'cancelled', 'refunded'].map(s => (
            <button
              key={s}
              className={`${styles.tab} ${filter === s ? styles.tabActive : ''}`}
              onClick={() => setFilter(s)}
            >
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              <span className={styles.tabCount}>
                {s === '' ? bookings.length : bookings.filter(b => b.status === s).length}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className={styles.list}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={styles.skeletonCard}>
                <div className="skeleton" style={{ width: 120, height: 80, borderRadius: 8 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="skeleton" style={{ height: 18, width: '50%' }} />
                  <div className="skeleton" style={{ height: 13, width: '35%' }} />
                  <div className="skeleton" style={{ height: 13, width: '45%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className={styles.list}>
            {filtered.map((booking, i) => {
              const event = booking.event;
              const sc = STATUS_COLORS[booking.status] || STATUS_COLORS.pending;
              const canCancel = booking.status === 'confirmed' && event && isEventFuture(event.date);
              return (
                <div key={booking._id} className={styles.bookingCard} style={{ animationDelay: `${i*0.06}s` }}>
                  {/* Thumbnail */}
                  <div className={styles.bookingThumb}>
                    {event?.bannerImage
                      ? <img src={event.bannerImage} alt={event.title} />
                      : <span className="display">{event?.title?.slice(0,2).toUpperCase()}</span>
                    }
                  </div>

                  {/* Details */}
                  <div className={styles.bookingDetails}>
                    <div className={styles.bookingTop}>
                      <div>
                        <h3 className={styles.bookingTitle}>
                          {event ? <Link to={`/events/${event._id}`}>{event.title}</Link> : 'Event Unavailable'}
                        </h3>
                        <p className={styles.bookingArtist}>{event?.artist?.stageName}</p>
                      </div>
                      <span className={styles.bookingStatus} style={{ background: sc.bg, color: sc.color }}>
                        {booking.status}
                      </span>
                    </div>

                    <div className={styles.bookingMeta}>
                      {event?.date && (
                        <span className={styles.metaChip}><HiCalendar />{formatDateTime(event.date)}</span>
                      )}
                      {event?.venue?.city && (
                        <span className={styles.metaChip}><HiLocationMarker />{event.venue.name}, {event.venue.city}</span>
                      )}
                      <span className={styles.metaChip}><HiTicket />{booking.ticketCount} ticket{booking.ticketCount > 1 ? 's' : ''}</span>
                    </div>

                    <div className={styles.bookingFooter}>
                      <div>
                        <p className={styles.bookingId}>#{booking.booking_id}</p>
                        <p className={styles.bookingTotal}>{formatCurrency(booking.totalPrice)}</p>
                      </div>
                      {canCancel && (
                        <Button
                          variant="danger"
                          size="sm"
                          icon={<HiX />}
                          loading={cancelLoading === booking._id}
                          onClick={() => handleCancel(booking._id)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.empty}>
            <HiTicket className={styles.emptyIcon} />
            <p className={styles.emptyTitle}>No bookings yet</p>
            <p className={styles.emptySub}>Find an event and grab your tickets!</p>
            <Link to="/events">
              <Button variant="primary">Browse Events</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookingsPage;
