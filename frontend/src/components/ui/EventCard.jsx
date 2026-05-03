// Location: ConcertHub/frontend/src/components/ui/EventCard.jsx
import { Link } from 'react-router-dom';
import { HiCalendar, HiLocationMarker, HiTicket } from 'react-icons/hi';
import { formatDate, formatCurrency, genreColors, isEventPast } from '../../utils/helpers';
import styles from './EventCard.module.css';

const EventCard = ({ event, index = 0 }) => {
  const genre = event.genre || 'Other';
  const genreStyle = genreColors[genre] || genreColors['Other'];
  const past = isEventPast(event.date);
  const sold = event.availableSeats === 0;

  return (
    <Link
      to={`/events/${event._id}`}
      className={styles.card}
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      {/* Image */}
      <div className={styles.imageWrapper}>
        {event.bannerImage ? (
          <img src={event.bannerImage} alt={event.title} className={styles.image} />
        ) : (
          <div className={styles.imagePlaceholder}>
            <span className={`${styles.placeholderText} display`}>
              {event.title.slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}
        <div className={styles.imageOverlay} />

        {/* Badges */}
        <div className={styles.badges}>
          <span className={styles.genre} style={{ background: genreStyle.bg, color: genreStyle.color }}>
            {genre}
          </span>
          {(past || sold) && (
            <span className={`${styles.statusBadge} ${past ? styles.past : styles.soldOut}`}>
              {past ? 'Past' : 'Sold Out'}
            </span>
          )}
        </div>

        {/* Price */}
        <div className={styles.price}>
          {formatCurrency(event.price)}
        </div>
      </div>

      {/* Body */}
      <div className={styles.body}>
        <h3 className={styles.title}>{event.title}</h3>

        {event.artist && (
          <p className={styles.artist}>{event.artist.stageName}</p>
        )}

        <div className={styles.meta}>
          <span className={styles.metaItem}>
            <HiCalendar />
            {formatDate(event.date)}
          </span>
          <span className={styles.metaItem}>
            <HiLocationMarker />
            {event.venue?.city}
          </span>
        </div>

        {/* Seats bar */}
        {!past && event.totalSeats > 0 && (
          <div className={styles.seatsRow}>
            <div className={styles.seatsBar}>
              <div
                className={styles.seatsFill}
                style={{
                  width: `${Math.min(100, ((event.totalSeats - event.availableSeats) / event.totalSeats) * 100)}%`,
                  background: sold ? 'var(--danger)' : 'var(--accent)',
                }}
              />
            </div>
            <span className={styles.seatsLabel}>
              <HiTicket />
              {sold ? 'Sold out' : `${event.availableSeats} left`}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
};

export default EventCard;