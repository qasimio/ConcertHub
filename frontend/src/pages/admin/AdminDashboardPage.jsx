// Location: ConcertHub/frontend/src/pages/admin/AdminDashboardPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  HiUsers, HiMusicNote, HiTicket, HiCurrencyDollar,
  HiCheckCircle, HiXCircle, HiClock, HiEye
} from 'react-icons/hi';
import { adminAPI, artistAPI, eventAPI, userAPI } from '../../services/api';
import Button from '../../components/ui/Button';
import { formatCurrency, formatDate, formatRelative, getErrorMessage } from '../../utils/helpers';
import styles from './AdminPages.module.css';

const AdminDashboardPage = () => {
  const [dashboard, setDashboard] = useState(null);
  const [pendingArtists, setPendingArtists] = useState([]);
  const [pendingEvents, setPendingEvents]   = useState([]);
  const [allUsers, setAllUsers]             = useState([]);
  const [loading, setLoading]               = useState(true);
  const [tab, setTab]                       = useState('overview');

  const fetchData = async () => {
    try {
      const [dashRes, artRes, evRes, usrRes] = await Promise.all([
        adminAPI.getDashboard(),
        artistAPI.getAll({ verificationStatus: 'pending', limit: 20 }),
        eventAPI.getAll({ approvalStatus: 'pending', limit: 20 }),
        userAPI.getAll({ limit: 30 }),
      ]);
      setDashboard(dashRes.data.dashboard);
      setPendingArtists(artRes.data.artists);
      setPendingEvents(evRes.data.events);
      setAllUsers(usrRes.data.users);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchData();
    };

    void loadData();
  }, []);

  const approveArtist = async (id, status, reason = '') => {
    try {
      await artistAPI.approve(id, { status, rejectionReason: reason });
      toast.success(`Artist ${status}`);
      setPendingArtists(a => a.filter(x => x._id !== id));
      fetchData();
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  const approveEvent = async (id, status) => {
    try {
      await eventAPI.approve(id, { status });
      toast.success(`Event ${status}`);
      setPendingEvents(e => e.filter(x => x._id !== id));
      fetchData();
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  const toggleUser = async (id) => {
    try {
      const res = await adminAPI.toggleUser(id);
      setAllUsers(u => u.map(x => x._id === id ? { ...x, isActive: !x.isActive } : x));
      toast.success(res.data.message);
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  if (loading) return (
    <div className="page-content"><div className="container">
      <div className="skeleton" style={{ height: 36, width: '25%', marginBottom: 24 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        {Array.from({ length: 4 }).map((_,i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 12 }} />)}
      </div>
    </div></div>
  );

  const d = dashboard || {};

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'artists', label: `Artists ${d.alerts?.pendingArtists > 0 ? `(${d.alerts.pendingArtists})` : ''}` },
    { id: 'events', label: `Events ${d.alerts?.pendingEvents > 0 ? `(${d.alerts.pendingEvents})` : ''}` },
    { id: 'users', label: 'Users' },
  ];

  return (
    <div className={`page-content ${styles.page}`}>
      <div className="container">
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>ADMIN PANEL</p>
            <h1 className={styles.title}>Dashboard</h1>
          </div>
          {(d.alerts?.pendingArtists > 0 || d.alerts?.pendingEvents > 0) && (
            <div className={styles.alertBadge}>
              <HiClock />
              {(d.alerts.pendingArtists + d.alerts.pendingEvents)} pending approvals
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {TABS.map(t => (
            <button key={t.id} className={`${styles.tab} ${tab === t.id ? styles.tabActive : ''}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Overview ───────────────────────────────────────────────────────── */}
        {tab === 'overview' && (
          <div className={styles.tabContent}>
            {/* KPI cards */}
            <div className={styles.kpiGrid}>
              {[
                { icon: <HiUsers />, label: 'Total Users', value: d.users?.total, sub: `+${d.users?.newLast30Days} this month`, color: 'var(--electric)' },
                { icon: <HiMusicNote />, label: 'Artists', value: d.artists?.approved, sub: `${d.artists?.pending} pending`, color: 'var(--accent)' },
                { icon: <HiTicket />, label: 'Confirmed Bookings', value: d.bookings?.confirmed, sub: `${d.bookings?.newLast7Days} this week`, color: 'var(--success)' },
                { icon: <HiCurrencyDollar />, label: 'Net Revenue', value: formatCurrency(d.revenue?.net || 0), sub: `${formatCurrency(d.revenue?.refunds || 0)} refunded`, color: 'var(--accent)' },
              ].map((k, i) => (
                <div key={i} className={styles.kpiCard}>
                  <div className={styles.kpiIcon} style={{ color: k.color, background: k.color + '15' }}>{k.icon}</div>
                  <p className={styles.kpiValue}>{k.value ?? '—'}</p>
                  <p className={styles.kpiLabel}>{k.label}</p>
                  <p className={styles.kpiSub}>{k.sub}</p>
                </div>
              ))}
            </div>

            {/* Recent bookings + top artists */}
            <div className={styles.twoCol}>
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Recent Bookings</h3>
                {d.recentBookings?.map(b => (
                  <div key={b._id} className={styles.listRow}>
                    <div className={styles.listInfo}>
                      <p className={styles.listName}>{b.event?.title || '—'}</p>
                      <p className={styles.listSub}>{b.user?.name} · {formatRelative(b.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Top Artists</h3>
                {d.topArtists?.map((a, i) => (
                  <div key={a._id} className={styles.listRow}>
                    <span className={styles.listRank}>#{i+1}</span>
                    <div className={styles.listInfo}>
                      <p className={styles.listName}>{a.stageName}</p>
                      <p className={styles.listSub}>{a.totalTicketsSold} tickets · {formatCurrency(a.totalEarnings)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Artists ─────────────────────────────────────────────────────────── */}
        {tab === 'artists' && (
          <div className={styles.tabContent}>
            <h2 className={styles.sectionTitle}>Pending Artist Approvals</h2>
            {pendingArtists.length === 0 ? (
              <div className={styles.empty}><HiCheckCircle className={styles.emptyIcon} /><p>All caught up!</p></div>
            ) : (
              <div className={styles.approvalList}>
                {pendingArtists.map(artist => (
                  <div key={artist._id} className={styles.approvalCard}>
                    <div className={styles.approvalAvatar}>
                      {artist.profileImage ? <img src={artist.profileImage} alt="" /> : <span>{artist.stageName?.slice(0,2).toUpperCase()}</span>}
                    </div>
                    <div className={styles.approvalInfo}>
                      <p className={styles.approvalName}>{artist.stageName}</p>
                      <p className={styles.approvalSub}>{artist.user?.email} · {artist.genre?.join(', ')}</p>
                      {artist.bio && <p className={styles.approvalBio}>{artist.bio?.slice(0,120)}…</p>}
                    </div>
                    <div className={styles.approvalActions}>
                      <Button variant="primary" size="sm" icon={<HiCheckCircle />} onClick={() => approveArtist(artist._id, 'approved')}>Approve</Button>
                      <Button variant="danger" size="sm" icon={<HiXCircle />} onClick={() => { const r = prompt('Rejection reason:'); if (r !== null) approveArtist(artist._id, 'rejected', r); }}>Reject</Button>
                      <Link to={`/artists/${artist._id}`} target="_blank"><Button variant="ghost" size="sm" icon={<HiEye />}>View</Button></Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Events ──────────────────────────────────────────────────────────── */}
        {tab === 'events' && (
          <div className={styles.tabContent}>
            <h2 className={styles.sectionTitle}>Pending Event Approvals</h2>
            {pendingEvents.length === 0 ? (
              <div className={styles.empty}><HiCheckCircle className={styles.emptyIcon} /><p>All caught up!</p></div>
            ) : (
              <div className={styles.approvalList}>
                {pendingEvents.map(event => (
                  <div key={event._id} className={styles.approvalCard}>
                    <div className={styles.approvalThumb}>
                      {event.bannerImage ? <img src={event.bannerImage} alt="" /> : <span className="display">{event.title?.slice(0,2)}</span>}
                    </div>
                    <div className={styles.approvalInfo}>
                      <p className={styles.approvalName}>{event.title}</p>
                      <p className={styles.approvalSub}>{event.artist?.stageName} · {formatDate(event.date)} · {event.venue?.city}</p>
                      <p className={styles.approvalSub}>{formatCurrency(event.price)}/ticket · {event.totalSeats} seats</p>
                    </div>
                    <div className={styles.approvalActions}>
                      <Button variant="primary" size="sm" icon={<HiCheckCircle />} onClick={() => approveEvent(event._id, 'approved')}>Approve</Button>
                      <Button variant="danger" size="sm" icon={<HiXCircle />} onClick={() => approveEvent(event._id, 'rejected')}>Reject</Button>
                      <Link to={`/events/${event._id}`} target="_blank"><Button variant="ghost" size="sm" icon={<HiEye />}>View</Button></Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Users ───────────────────────────────────────────────────────────── */}
        {tab === 'users' && (
          <div className={styles.tabContent}>
            <h2 className={styles.sectionTitle}>User Management</h2>
            <div className={styles.usersTable}>
              <div className={styles.tableHeader}>
                <span>User</span>
                <span>Role</span>
                <span>Wallet</span>
                <span>Joined</span>
                <span>Status</span>
                <span>Action</span>
              </div>
              {allUsers.map(u => (
                <div key={u._id} className={styles.tableRow}>
                  <div className={styles.userCell}>
                    <div className={styles.userAvatar}>{u.name?.slice(0,2).toUpperCase()}</div>
                    <div>
                      <p className={styles.userName}>{u.name}</p>
                      <p className={styles.userEmail}>{u.email}</p>
                    </div>
                  </div>
                  <span className={`${styles.roleBadge} ${styles['role_' + u.role]}`}>{u.role}</span>
                  <span className={styles.walletCell}>{formatCurrency(u.walletBalance)}</span>
                  <span className={styles.dateCell}>{formatDate(u.createdAt)}</span>
                  <span className={`${styles.statusDot} ${u.isActive ? styles.statusActive : styles.statusInactive}`}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {u.role !== 'admin' && (
                    <Button
                      variant={u.isActive ? 'danger' : 'secondary'}
                      size="sm"
                      onClick={() => toggleUser(u._id)}
                    >
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
