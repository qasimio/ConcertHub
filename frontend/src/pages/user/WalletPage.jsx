// Location: ConcertHub/frontend/src/pages/user/WalletPage.jsx
import { useState, useEffect } from 'react';
import { HiCurrencyDollar, HiArrowUp, HiArrowDown, HiRefresh } from 'react-icons/hi';
import { userAPI } from '../../services/api';
import { formatCurrency, formatDateTime } from '../../utils/helpers';
import styles from './UserPages.module.css';

const TYPE_CONFIG = {
  payment: { icon: <HiArrowUp />, color: 'var(--danger)',  label: 'Payment' },
  refund:  { icon: <HiArrowDown />, color: 'var(--success)', label: 'Refund' },
  topup:   { icon: <HiArrowDown />, color: 'var(--electric)', label: 'Top-Up' },
};

const WalletPage = () => {
  const [wallet, setWallet]   = useState({ walletBalance: 0, transactions: [] });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await userAPI.getWallet();
        setWallet(res.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const filtered = filter
    ? wallet.transactions.filter(t => t.type === filter)
    : wallet.transactions;

  const totalSpent   = wallet.transactions.filter(t => t.type === 'payment').reduce((s,t) => s + t.amount, 0);
  const totalRefunds = wallet.transactions.filter(t => t.type === 'refund').reduce((s,t) => s + t.amount, 0);

  return (
    <div className={`page-content ${styles.page}`}>
      <div className="container">
        <div className={styles.header}>
          <p className={styles.eyebrow}>FINANCES</p>
          <h1 className={styles.title}>My Wallet</h1>
        </div>

        {/* Balance cards */}
        <div className={styles.walletCards}>
          <div className={`${styles.walletCard} ${styles.walletCardMain}`}>
            <HiCurrencyDollar className={styles.walletCardIcon} />
            <p className={styles.walletCardLabel}>Current Balance</p>
            <p className={styles.walletCardAmount}>
              {loading ? '—' : formatCurrency(wallet.walletBalance)}
            </p>
            <p className={styles.walletCardSub}>Available to spend</p>
          </div>
          <div className={styles.walletCard}>
            <p className={styles.walletCardLabel}>Total Spent</p>
            <p className={styles.walletCardAmountSm} style={{ color: 'var(--danger)' }}>
              {loading ? '—' : formatCurrency(totalSpent)}
            </p>
          </div>
          <div className={styles.walletCard}>
            <p className={styles.walletCardLabel}>Total Refunded</p>
            <p className={styles.walletCardAmountSm} style={{ color: 'var(--success)' }}>
              {loading ? '—' : formatCurrency(totalRefunds)}
            </p>
          </div>
        </div>

        {/* Transactions */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Transaction History</h2>
            <div className={styles.tabs} style={{ marginBottom: 0 }}>
              {['', 'payment', 'refund', 'topup'].map(f => (
                <button
                  key={f}
                  className={`${styles.tab} ${filter === f ? styles.tabActive : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f === '' ? 'All' : TYPE_CONFIG[f]?.label || f}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 64, borderRadius: 8 }} />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className={styles.txList}>
              {filtered.map((tx, i) => {
                const cfg = TYPE_CONFIG[tx.type] || TYPE_CONFIG.payment;
                const isCredit = tx.type !== 'payment';
                return (
                  <div key={tx._id} className={styles.txRow} style={{ animationDelay: `${i*0.04}s` }}>
                    <div className={styles.txIcon} style={{ color: cfg.color, background: cfg.color + '15' }}>
                      {cfg.icon}
                    </div>
                    <div className={styles.txDetails}>
                      <p className={styles.txDesc}>{tx.description || cfg.label}</p>
                      <p className={styles.txDate}>{formatDateTime(tx.createdAt)}</p>
                    </div>
                    <div className={styles.txRight}>
                      <p className={styles.txAmount} style={{ color: isCredit ? 'var(--success)' : 'var(--danger)' }}>
                        {isCredit ? '+' : '-'}{formatCurrency(tx.amount)}
                      </p>
                      <p className={styles.txBalance}>Balance: {formatCurrency(tx.walletBalanceAfter)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.empty}>
              <HiRefresh className={styles.emptyIcon} />
              <p className={styles.emptyTitle}>No transactions yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletPage;