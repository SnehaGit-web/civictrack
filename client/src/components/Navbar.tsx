import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';

export const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const { notifications, unreadCount, clearAll } = useNotifications();
  const [showNotifs, setShowNotifs] = useState(false);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <nav style={{
      background: 'var(--brand)', color: '#fff',
      position: 'sticky', top: 0, zIndex: 100,
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    }}>
      <div style={{
        maxWidth: 1100, margin: '0 auto', padding: '0 24px',
        height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, background: 'rgba(255,255,255,0.15)',
            borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
          }}>🏛</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 16, letterSpacing: '-0.3px' }}>CivicTrack</div>
            <div style={{ fontSize: 10, opacity: 0.65, marginTop: -2 }}>City of Ottawa</div>
          </div>
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>

          {/* Notification Bell — citizens only */}
          {!isAdmin && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                style={{
                  background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 8,
                  width: 38, height: 38, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, color: '#fff', position: 'relative',
                }}
                aria-label="Notifications"
              >
                🔔
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: 4, right: 4,
                    background: 'var(--accent)', color: '#fff',
                    borderRadius: 99, fontSize: 10, fontWeight: 700,
                    minWidth: 16, height: 16,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
                  }}>{unreadCount}</span>
                )}
              </button>

              {showNotifs && (
                <div style={{
                  position: 'absolute', top: 48, right: 0, width: 340,
                  background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-md)', boxShadow: 'var(--shadow-md)',
                  overflow: 'hidden', zIndex: 999,
                }}>
                  <div style={{
                    padding: '12px 16px', borderBottom: '1px solid var(--border)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-1)' }}>Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={clearAll} style={{ fontSize: 12, color: 'var(--brand-mid)', background: 'none', border: 'none', cursor: 'pointer' }}>
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} style={{
                          padding: '12px 16px', borderBottom: '1px solid var(--border)',
                          background: n.read ? 'transparent' : 'var(--brand-light)',
                        }}>
                          <div style={{ fontSize: 13, color: 'var(--text-1)', lineHeight: 1.5 }}>{n.message}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>{formatTime(n.created_at)}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User avatar + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, background: 'rgba(255,255,255,0.2)',
              borderRadius: '50%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontWeight: 600, fontSize: 13,
            }}>
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ lineHeight: 1.3 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{user?.name}</div>
              <div style={{ fontSize: 11, opacity: 0.65, textTransform: 'capitalize' }}>{user?.role}</div>
            </div>
          </div>

          <button onClick={logout} className="btn btn-ghost btn-sm"
            style={{ color: 'rgba(255,255,255,0.8)', borderColor: 'rgba(255,255,255,0.25)' }}>
            Sign out
          </button>
        </div>
      </div>

      {showNotifs && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 998 }} onClick={() => setShowNotifs(false)} />
      )}
    </nav>
  );
};