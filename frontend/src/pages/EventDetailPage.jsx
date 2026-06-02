// Location: ConcertHub/frontend/src/pages/EventDetailPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  HiCalendar, HiLocationMarker, HiTicket, HiStar,
  HiHeart, HiShare, HiClock, HiUser, HiArrowLeft
} from 'react-icons/hi';
import { eventAPI, bookingAPI, reviewAPI, userAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import Button from '../components/ui/Button';
import { formatDateTime, formatCurrency, genreColors, isEventPast, getErrorMessage } from '../utils/helpers';
import styles from './EventDetailPage.module.css';

const StarRating = ({ rating }) => (
  <div className={styles.stars}>
    {[1,2,3,4,5].map(s => (
      <HiStar key={s} style={{ color: s <= rating ? '#f5c518' : 'var(--text-muted)', fontSize: 16 }} />
    ))}
  </div>
);

const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isLoggedIn, updateUser } = useAuthStore();

  const [event, setEvent]       = useState(null);
  const [reviews, setReviews]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [bookLoading, setBookLoading] = useState(false);
  const [ticketCount, setTicketCount] = useState(1);
  const [isFav, setIsFav]       = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [evRes, rvRes] = await Promise.all([
          eventAPI.getById(id),
          reviewAPI.getEventReviews(id, { limit: 5 }),
        ]);
        setEvent(evRes.data.event);
        setReviews(rvRes.data.reviews);
        if (user?.favoriteEvents?.includes(id)) setIsFav(true);
      } catch { navigate('/events'); }
      finally { setLoading(false); }
    };
    fetch();
  }, [id]);

  const handleBook = async () => {
    if (!isLoggedIn()) { navigate('/login'); return; }
    if (user.role !== 'user') { toast.error('Only users can book tickets'); return; }
    setBookLoading(true);
    try {
      const res = await bookingAPI.create({ eventId: id, ticketCount });
      toast.success(`🎟️ Booked ${ticketCount} ticket(s)!`);
      updateUser({ walletBalance: res.data.newWalletBalance });
      setEvent(ev => ({ ...ev, availableSeats: ev.availableSeats - ticketCount }));
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBookLoading(false);
    }
  };

  const handleFav = async () => {
    if (!isLoggedIn()) { navigate('/login'); return; }
    try {
      await userAPI.favEvent(id);
      setIsFav(f => !f);
      toast.success(isFav ? 'Removed from favorites' : 'Added to favorites');
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  const handleReview = async (e) => {
    e.preventDefault();
    if (!isLoggedIn()) { navigate('/login'); return; }
    setReviewLoading(true);
    try {
      const res = await reviewAPI.reviewEvent(id, { rating: reviewRating, comment: reviewText });
      setReviews(rv => [res.data.review, ...rv]);
      setReviewText('');
      toast.success('Review submitted!');
    } catch (e) { toast.error(getErrorMessage(e)); }
    finally { setReviewLoading(false); }
  };

  if (loading) return (
    <div className="page-content">
      <div className="container">
        <div className={styles.heroSkeleton}>
          <div className="skeleton" style={{ width: '100%', height: '100%', borderRadius: 0 }} />
        </div>
        <div className={styles.bodySkeleton}>
          <div className="skeleton" style={{ height: 40, width: '60%', marginBottom: 16 }} />
          <div className="skeleton" style={{ height: 16, width: '40%', marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 16, width: '55%' }} />
        </div>
      </div>
    </div>
  );

  if (!event) return null;

  const past      = isEventPast(event.date);
  const sold      = event.availableSeats === 0;
  const canBook   = !past && !sold && isLoggedIn() && user?.role === 'user';
  const totalCost = event.price * ticketCount;
  const genre     = event.genre || 'Other';
  const genreStyle = genreColors[genre] || genreColors['Other'];

  return (
    <div className={styles.page}>
      {/* Hero image */}
      <div className={styles.hero}>
        {event.bannerImage ? (
          <img src={event.bannerImage} alt={event.title} className={styles.heroImg} />
        ) : (
          <div className={styles.heroPlaceholder}>
            <span className={`display ${styles.heroPlaceholderText}`}>
              {event.title.slice(0,4).toUpperCase()}
            </span>
          </div>
        )}
        <div className={styles.heroOverlay} />
        <div className={`container ${styles.heroContent}`}>
          <Link to="/events" className={styles.back}>
            <HiArrowLeft /> Back to Events
          </Link>
          <span className={styles.heroGenre} style={{ background: genreStyle.bg, color: genreStyle.color }}>
            {genre}
          </span>
          <h1 className={styles.heroTitle}>{event.title}</h1>
          {event.artist && (
            <Link to={`/artists/${event.artist._id}`} className={styles.heroArtist}>
              {event.artist.stageName}
            </Link>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="container">
        <div className={styles.layout}>
          {/* Left: details */}
          <div className={styles.main}>
            {/* Meta row */}
            <div className={styles.metaRow}>
              <div className={styles.metaItem}>
                <HiCalendar />
                <div>
                  <p className={styles.metaLabel}>Date & Time</p>
                  <p className={styles.metaValue}>{formatDateTime(event.date)}</p>
                </div>
              </div>
              <div className={styles.metaItem}>
                <HiLocationMarker />
                <div>
                  <p className={styles.metaLabel}>Venue</p>
                  <p className={styles.metaValue}>{event.venue?.name}</p>
                  <p className={styles.metaSub}>{event.venue?.city}{event.venue?.country ? `, ${event.venue.country}` : ''}</p>
                </div>
              </div>
              <div className={styles.metaItem}>
                <HiTicket />
                <div>
                  <p className={styles.metaLabel}>Availability</p>
                  <p className={`${styles.metaValue} ${sold ? styles.soldText : ''}`}>
                    {sold ? 'Sold Out' : `${event.availableSeats} of ${event.totalSeats}`}
                  </p>
                </div>
              </div>
              {event.averageRating > 0 && (
                <div className={styles.metaItem}>
                  <HiStar />
                  <div>
                    <p className={styles.metaLabel}>Rating</p>
                    <p className={styles.metaValue}>{event.averageRating.toFixed(1)} / 5 ({event.reviewCount})</p>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            {event.description && (
              <div className={styles.description}>
                <h2 className={styles.sectionTitle}>About This Event</h2>
                <p>{event.description}</p>
              </div>
            )}

            {/* Artist card */}
            {event.artist && (
              <div className={styles.artistCard}>
                <div className={styles.artistAvatar}>
                  {event.artist.profileImage
                    ? <img src={event.artist.profileImage} alt={event.artist.stageName} />
                    : <span className="display">{event.artist.stageName.slice(0,2).toUpperCase()}</span>
                  }
                </div>
                <div className={styles.artistInfo}>
                  <p className={styles.artistLabel}>PERFORMING ARTIST</p>
                  <h3 className={styles.artistName}>{event.artist.stageName}</h3>
                  {event.artist.bio && (
                    <p className={styles.artistBio}>{event.artist.bio.slice(0, 200)}{event.artist.bio.length > 200 ? '…' : ''}</p>
                  )}
                  <Link to={`/artists/${event.artist._id}`} className={styles.artistLink}>
                    View Profile →
                  </Link>
                </div>
              </div>
            )}

            {/* Reviews */}
            <div className={styles.reviews}>
              <h2 className={styles.sectionTitle}>Reviews</h2>
              {past && isLoggedIn() && user?.role === 'user' && (
                <form onSubmit={handleReview} className={styles.reviewForm}>
                  <p className={styles.reviewFormLabel}>Leave a review</p>
                  <div className={styles.starPicker}>
                    {[1,2,3,4,5].map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setReviewRating(s)}
                        className={styles.starBtn}
                        style={{ color: s <= reviewRating ? '#f5c518' : 'var(--text-muted)' }}
                      >
                        <HiStar />
                      </button>
                    ))}
                  </div>
                  <textarea
                    className={`input ${styles.reviewTextarea}`}
                    placeholder="Share your experience…"
                    value={reviewText}
                    onChange={e => setReviewText(e.target.value)}
                    rows={3}
                  />
                  <Button type="submit" variant="primary" size="sm" loading={reviewLoading}>
                    Submit Review
                  </Button>
                </form>
              )}
              {reviews.length > 0 ? (
                <div className={styles.reviewList}>
                  {reviews.map(rv => (
                    <div key={rv._id} className={styles.reviewCard}>
                      <div className={styles.reviewHeader}>
                        <div className={styles.reviewUser}>
                          <div className={styles.reviewAvatar}>
                            {rv.user?.name?.slice(0,2).toUpperCase()}
                          </div>
                          <div>
                            <p className={styles.reviewName}>{rv.user?.name}</p>
                            <StarRating rating={rv.rating} />
                          </div>
                        </div>
                      </div>
                      {rv.comment && <p className={styles.reviewComment}>{rv.comment}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.noReviews}>No reviews yet{past ? ' — be the first!' : ''}</p>
              )}
            </div>
          </div>

          {/* Right: booking widget */}
          <aside className={styles.sidebar}>
            <div className={styles.bookingWidget}>
              <div className={styles.priceDisplay}>
                <span className={styles.priceAmount}>{formatCurrency(event.price)}</span>
                <span className={styles.priceLabel}>per ticket</span>
              </div>

              {!past && !sold && (
                <div className={styles.ticketPicker}>
                  <label className={styles.ticketLabel}>Tickets</label>
                  <div className={styles.ticketRow}>
                    <button
                      className={styles.ticketBtn}
                      onClick={() => setTicketCount(c => Math.max(1, c - 1))}
                    >−</button>
                    <span className={styles.ticketCount}>{ticketCount}</span>
                    <button
                      className={styles.ticketBtn}
                      onClick={() => setTicketCount(c => Math.min(Math.min(10, event.availableSeats), c + 1))}
                    >+</button>
                  </div>
                </div>
              )}

              <div className={styles.totalRow}>
                <span>Total</span>
                <span className={styles.totalAmount}>{formatCurrency(totalCost)}</span>
              </div>

              {isLoggedIn() && user?.role === 'user' && (
                <div className={styles.walletRow}>
                  <span className={styles.walletLabel}>Wallet balance</span>
                  <span className={`${styles.walletAmt} ${user.walletBalance < totalCost ? styles.walletInsufficient : ''}`}>
                    {formatCurrency(user.walletBalance)}
                  </span>
                </div>
              )}

              {past ? (
                <Button variant="secondary" fullWidth disabled>Event Ended</Button>
              ) : sold ? (
                <Button variant="danger" fullWidth disabled>Sold Out</Button>
              ) : canBook ? (
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={bookLoading}
                  onClick={handleBook}
                  disabled={user?.walletBalance < totalCost}
                >
                  {user?.walletBalance < totalCost ? 'Insufficient Balance' : 'Book Now'}
                </Button>
              ) : !isLoggedIn() ? (
                <Button variant="primary" size="lg" fullWidth onClick={() => navigate('/login')}>
                  Sign In to Book
                </Button>
              ) : (
                <Button variant="secondary" fullWidth disabled>Not Available</Button>
              )}

              <div className={styles.widgetActions}>
                <button className={`${styles.actionBtn} ${isFav ? styles.favActive : ''}`} onClick={handleFav}>
                  <HiHeart /> {isFav ? 'Saved' : 'Save'}
                </button>
                <button className={styles.actionBtn} onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); }}>
                  <HiShare /> Share
                </button>
              </div>

              {/* Cancellation policy */}
              <div className={styles.policyNote}>
                <HiClock style={{ color: 'var(--accent)', flexShrink: 0 }} />
                <p>Free cancellation up to {event.cancellationDeadlineHours || 24}h before the event</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;