// Location: ConcertHub/frontend/src/pages/artist/ArtistDashboardPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  HiPlus, HiPencil, HiTrash, HiClock, HiCheckCircle,
  HiXCircle, HiTrendingUp, HiTicket, HiCurrencyDollar, HiCalendar
} from 'react-icons/hi';
import { artistAPI, eventAPI } from '../../services/api';
import Button from '../../components/ui/Button';
import EventFormModal from './EventFormModal';
import { formatCurrency, formatDate, getErrorMessage } from '../../utils/helpers';
import styles from './ArtistPages.module.css';

const STATUS_ICON = {
  pending:  <HiClock style={{ color: 'var(--accent)' }} />,
  approved: <HiCheckCircle style={{ color: 'var(--success)' }} />,
  rejected: <HiXCircle style={{ color: 'var(--danger)' }} />,
};

const ArtistDashboardPage = () => {
  const [artist, setArtist]       = useState(null);
  const [events, setEvents]       = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editEvent, setEditEvent] = useState(null);

  const fetchData = async () => {
    try {
      const [arRes, evRes, anRes] = await Promise.all([
        artistAPI.getMe(),
        eventAPI.getAll({ limit: 50 }),
        artistAPI.getAnalytics(),
      ]);
      setArtist(arRes.data.artist);
      setEvents(evRes.data.events);
      setAnalytics(anRes.data.analytics);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const timeoutId = setTimeout(fetchData, 0);
    return () => clearTimeout(timeoutId);
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this event?')) return;
    try {
      await eventAPI.delete(id);
      setEvents(ev => ev.filter(e => e._id !== id));
      toast.success('Event deleted');
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  const handleSaved = () => {
    setShowModal(false);
    setEditEvent(null);
    fetchData();
  };

  if (loading) return (
    <div className="page-content"><div className="container">
      <div className="skeleton" style={{ height: 40, width: '30%', marginBottom: 24 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        {Array.from({ length: 4 }).map((_,i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 12 }} />)}
      </div>
    </div></div>
  );

  const summary = analytics?.summary || {};
  const needsApproval = artist?.verificationStatus !== 'approved';

  return (
    <div className={`page-content ${styles.page}`}>
      <div className="container">
        {/* Header */}
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>ARTIST PORTAL</p>
            <h1 className={styles.title}>Dashboard</h1>
            <p className={styles.subtitle}>Welcome back, {artist?.stageName}</p>
          </div>
          <div className={styles.headerActions}>
            <Link to="/artist-profile">
              <Button variant="ghost" size="sm" icon={<HiPencil />}>Edit Profile</Button>
            </Link>
            {!needsApproval && (
              <Button variant="primary" size="sm" icon={<HiPlus />} onClick={() => { setEditEvent(null); setShowModal(true); }}>
                New Event
              </Button>
            )}
          </div>
        </div>

        {/* Approval banner */}
        {needsApproval && (
          <div className={`${styles.banner} ${artist?.verificationStatus === 'rejected' ? styles.bannerDanger : styles.bannerWarning}`}>
            {STATUS_ICON[artist?.verificationStatus]}
            <div>
              <p className={styles.bannerTitle}>
                {artist?.verificationStatus === 'pending' && 'Profile Under Review'}
                {artist?.verificationStatus === 'rejected' && 'Profile Rejected'}
              </p>
              <p className={styles.bannerSub}>
                {artist?.verificationStatus === 'pending' && 'An admin will review your profile. You can create events once approved.'}
                {artist?.verificationStatus === 'rejected' && `Reason: ${artist?.rejectionReason || 'Contact support for details.'}`}
              </p>
            </div>
          </div>
        )}

        {/* Stats cards */}
        <div className={styles.statsGrid}>
          {[
            { icon: <HiTicket />, label: 'Tickets Sold', value: summary.totalTicketsSold?.toLocaleString() || 0, color: 'var(--accent)' },
            { icon: <HiCurrencyDollar />, label: 'Total Revenue', value: formatCurrency(summary.totalRevenue || 0), color: 'var(--success)' },
            { icon: <HiCalendar />, label: 'Total Events', value: summary.totalEvents || 0, color: 'var(--electric)' },
            { icon: <HiTrendingUp />, label: 'Upcoming', value: summary.upcomingEvents || 0, color: 'var(--accent)' },
          ].map((s, i) => (
            <div key={i} className={styles.statCard}>
              <div className={styles.statIcon} style={{ color: s.color, background: s.color + '15' }}>{s.icon}</div>
              <p className={styles.statValue}>{s.value}</p>
              <p className={styles.statLabel}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Top events */}
        {analytics?.topEvents?.length > 0 && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Top Events by Revenue</h2>
            <div className={styles.topEventsList}>
              {analytics.topEvents.map((ev, i) => (
                <div key={ev._id} className={styles.topEventRow}>
                  <span className={styles.topEventRank}>#{i + 1}</span>
                  <div className={styles.topEventInfo}>
                    <p className={styles.topEventName}>{ev.title}</p>
                    <p className={styles.topEventDate}>{formatDate(ev.date)}</p>
                  </div>
                  <div className={styles.topEventStats}>
                    <span>{ev.ticketsSold} tickets</span>
                    <span className={styles.topEventRevenue}>{formatCurrency(ev.revenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Events list */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>My Events</h2>
            {!needsApproval && (
              <Button variant="primary" size="sm" icon={<HiPlus />} onClick={() => { setEditEvent(null); setShowModal(true); }}>
                Add Event
              </Button>
            )}
          </div>

          {events.length > 0 ? (
            <div className={styles.eventsList}>
              {events.map((ev, i) => (
                <div key={ev._id} className={styles.eventRow} style={{ animationDelay: `${i*0.05}s` }}>
                  <div className={styles.eventThumb}>
                    {ev.bannerImage
                      ? <img src={ev.bannerImage} alt={ev.title} />
                      : <span className="display">{ev.title.slice(0,2).toUpperCase()}</span>
                    }
                  </div>
                  <div className={styles.eventInfo}>
                    <div className={styles.eventInfoTop}>
                      <p className={styles.eventName}>{ev.title}</p>
                      <div className={styles.eventBadges}>
                        <span className={`${styles.badge} ${styles['badge_' + ev.approvalStatus]}`}>
                          {STATUS_ICON[ev.approvalStatus]} {ev.approvalStatus}
                        </span>
                        <span className={`${styles.badge} ${styles['badge_status_' + ev.status]}`}>
                          {ev.status}
                        </span>
                      </div>
                    </div>
                    <div className={styles.eventMeta}>
                      <span>{formatDate(ev.date)}</span>
                      <span>{ev.venue?.city}</span>
                      <span>{formatCurrency(ev.price)}/ticket</span>
                      <span>{ev.availableSeats}/{ev.totalSeats} seats</span>
                    </div>
                  </div>
                  <div className={styles.eventActions}>
                    <button className={styles.actionIconBtn} onClick={() => { setEditEvent(ev); setShowModal(true); }}>
                      <HiPencil />
                    </button>
                    <button className={`${styles.actionIconBtn} ${styles.actionIconBtnDanger}`} onClick={() => handleDelete(ev._id)}>
                      <HiTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              <HiCalendar className={styles.emptyIcon} />
              <p>{needsApproval ? 'Get approved to create events' : 'No events yet. Create your first event!'}</p>
              {!needsApproval && (
                <Button variant="primary" icon={<HiPlus />} onClick={() => setShowModal(true)}>
                  Create Event
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Event form modal */}
      {showModal && (
        <EventFormModal
          event={editEvent}
          onClose={() => { setShowModal(false); setEditEvent(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
};

export default ArtistDashboardPage;
