import React from 'react';

interface SessionExpiredModalProps {
    onDismiss: () => void;
}

/**
 * SessionExpiredModal
 *
 * Shown when the api.ts response interceptor fires an `auth:session-expired` event
 * (i.e., a 401 comes back on a non-/me endpoint while the user is actively in a session).
 *
 * Instead of a jarring full-page redirect, this presents a clean modal overlay so the
 * user knows exactly what happened.
 */
const SessionExpiredModal: React.FC<SessionExpiredModalProps> = ({ onDismiss }) => {
    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                {/* Icon */}
                <div style={styles.iconWrap}>
                    <span style={styles.icon}>🔒</span>
                </div>

                {/* Content */}
                <h2 style={styles.title}>Session Expired</h2>
                <p style={styles.body}>
                    Your admin session has expired or was signed out from another location.
                    Please sign in again to continue.
                </p>

                {/* CTA */}
                <button style={styles.btn} onClick={onDismiss}>
                    Sign In Again →
                </button>
            </div>
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    overlay: {
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
        animation: 'fadeIn 0.2s ease',
    },
    modal: {
        background: '#fff',
        borderRadius: 18,
        padding: '40px 36px 32px',
        maxWidth: 400, width: '100%',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        animation: 'slideUp 0.25s cubic-bezier(0.4,0,0.2,1)',
    },
    iconWrap: {
        width: 64, height: 64,
        background: 'linear-gradient(135deg,#fef9c3,#fde047)',
        borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 20px',
    },
    icon: { fontSize: 30 },
    title: {
        margin: '0 0 10px', fontSize: 22, fontWeight: 700, color: '#111827',
        fontFamily: '"Inter","Segoe UI",sans-serif', letterSpacing: '-0.4px',
    },
    body: {
        margin: '0 0 28px', fontSize: 14, color: '#6b7280', lineHeight: 1.65,
        fontFamily: '"Inter","Segoe UI",sans-serif',
    },
    btn: {
        width: '100%', padding: '14px',
        background: 'linear-gradient(135deg,#1f2937 0%,#3b82f6 100%)',
        color: '#fff', border: 'none', borderRadius: 10,
        fontSize: 16, fontWeight: 700, cursor: 'pointer',
        fontFamily: '"Inter","Segoe UI",sans-serif',
        boxShadow: '0 4px 16px rgba(59,130,246,0.35)',
        transition: 'opacity 0.15s',
    },
};

export default SessionExpiredModal;
