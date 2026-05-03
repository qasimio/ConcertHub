// Location: ConcertHub/frontend/src/pages/artist/EventFormModal.jsx
import { useState } from 'react';
import toast from 'react-hot-toast';
import { HiX } from 'react-icons/hi';
import { eventAPI } from '../../services/api';
import Button from '../../components/ui/Button';
import { GENRES, getErrorMessage } from '../../utils/helpers';
import styles from './ArtistPages.module.css';

const EventFormModal = ({ event, onClose, onSaved }) => {
  const isEdit = !!event;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: event?.title || '',
    description: event?.description || '',
    genre: event?.genre || '',
    date: event?.date ? event.date.slice(0, 16) : '',
    venueName: event?.venue?.name || '',
    venueCity: event?.venue?.city || '',
    venueAddress: event?.venue?.address || '',
    venueCountry: event?.venue?.country || '',
    price: event?.price || '',
    totalSeats: event?.totalSeats || '',
    cancellationDeadlineHours: event?.cancellationDeadlineHours || 24,
  });
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(event?.bannerImage || null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleBanner = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.date || !form.price || !form.totalSeats || !form.venueName || !form.venueCity) {
      toast.error('Please fill in all required fields');
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries({
        title: form.title,
        description: form.description,
        genre: form.genre,
        date: form.date,
        price: form.price,
        totalSeats: form.totalSeats,
        cancellationDeadlineHours: form.cancellationDeadlineHours,
        'venue[name]': form.venueName,
        'venue[city]': form.venueCity,
        'venue[address]': form.venueAddress,
        'venue[country]': form.venueCountry,
      }).forEach(([k, v]) => fd.append(k, v));

      if (bannerFile) fd.append('bannerImage', bannerFile);

      if (isEdit) await eventAPI.update(event._id, fd);
      else        await eventAPI.create(fd);

      toast.success(isEdit ? 'Event updated!' : 'Event created! Pending admin approval.');
      onSaved();
    } catch (e) { toast.error(getErrorMessage(e)); }
    finally { setLoading(false); }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{isEdit ? 'Edit Event' : 'Create New Event'}</h2>
          <button className={styles.modalClose} onClick={onClose}><HiX /></button>
        </div>

        <div className={styles.modalBody}>
          <form onSubmit={handleSubmit} className={styles.modalForm}>
            {/* Banner upload */}
            <div className={styles.bannerUpload}>
              <label htmlFor="banner-upload" className={styles.bannerLabel}>
                {bannerPreview
                  ? <img src={bannerPreview} alt="banner" className={styles.bannerPreview} />
                  : <div className={styles.bannerPlaceholder}>
                      <span>+ Upload Banner Image</span>
                      <small>Recommended: 1600×900px</small>
                    </div>
                }
              </label>
              <input id="banner-upload" type="file" accept="image/*" hidden onChange={handleBanner} />
            </div>

            <div className={styles.formGrid2}>
              <div className={styles.field}>
                <label className={styles.label}>Event Title *</label>
                <input className="input" value={form.title} onChange={e => set('title', e.target.value)} required />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Genre</label>
                <select className="input" value={form.genre} onChange={e => set('genre', e.target.value)}>
                  <option value="">Select genre</option>
                  {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Description</label>
              <textarea className="input" rows={3} value={form.description} onChange={e => set('description', e.target.value)} style={{ resize: 'vertical' }} />
            </div>

            <div className={styles.formGrid2}>
              <div className={styles.field}>
                <label className={styles.label}>Date & Time *</label>
                <input type="datetime-local" className="input" value={form.date} onChange={e => set('date', e.target.value)} required />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Ticket Price (USD) *</label>
                <input type="number" min="0" step="0.01" className="input" value={form.price} onChange={e => set('price', e.target.value)} required />
              </div>
            </div>

            <div className={styles.formGrid2}>
              <div className={styles.field}>
                <label className={styles.label}>Total Seats *</label>
                <input type="number" min="1" className="input" value={form.totalSeats} onChange={e => set('totalSeats', e.target.value)} required />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Cancellation Deadline (hours)</label>
                <input type="number" min="0" className="input" value={form.cancellationDeadlineHours} onChange={e => set('cancellationDeadlineHours', e.target.value)} />
              </div>
            </div>

            <p className={styles.subheading}>Venue Details</p>

            <div className={styles.formGrid2}>
              <div className={styles.field}>
                <label className={styles.label}>Venue Name *</label>
                <input className="input" value={form.venueName} onChange={e => set('venueName', e.target.value)} required />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>City *</label>
                <input className="input" value={form.venueCity} onChange={e => set('venueCity', e.target.value)} required />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Address</label>
                <input className="input" value={form.venueAddress} onChange={e => set('venueAddress', e.target.value)} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Country</label>
                <input className="input" value={form.venueCountry} onChange={e => set('venueCountry', e.target.value)} />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
              <Button type="submit" variant="primary" loading={loading}>
                {isEdit ? 'Update Event' : 'Create Event'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EventFormModal;
