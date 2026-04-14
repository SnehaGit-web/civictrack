import { useState, useEffect } from 'react';
import { getRequests, updateRequestStatus, getAdminStats } from '../api';
import type { ServiceRequest, RequestStatus } from '../types';

const statusOptions: RequestStatus[] = ['in_review', 'resolved', 'rejected'];
const statusLabel: Record<string, string> = {
  submitted: 'Submitted', in_review: 'In Review',
  resolved: 'Resolved',   rejected: 'Rejected',
};

export const AdminDashboard = () => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    byStatus: { status: string; count: string }[];
    byCategory: { category: string; count: string }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [updating, setUpdating] = useState<string | null>(null);
  const [modal, setModal] = useState<ServiceRequest | null>(null);
  const [statusForm, setStatusForm] = useState({ status: 'in_review' as RequestStatus, note: '' });
  const [toast, setToast] = useState('');

  useEffect(() => {
    Promise.all([getRequests(), getAdminStats()])
      .then(([reqRes, statRes]) => {
        setRequests(reqRes.data);
        setStats(statRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const handleStatusUpdate = async () => {
    if (!modal) return;
    setUpdating(modal.id);
    try {
      const { data } = await updateRequestStatus(modal.id, statusForm.status, statusForm.note);
      setRequests((prev) => prev.map((r) => r.id === data.id ? data : r));
      setModal(null);
      showToast(`Status updated to "${statusLabel[statusForm.status]}"`);
    } catch {
      showToast('Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);
  const statCount = (s: string) => stats?.byStatus.find(b => b.status === s)?.count ?? 0;

  return (
    <div className="page-wrapper">
      <div className="main-content">
        {toast && (
          <div className="toast-container">
            <div className="toast toast-success">{toast}</div>
          </div>
        )}

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1>Admin Dashboard</h1>
          <p style={{ color: 'var(--text-3)', marginTop: 4, fontSize: 14 }}>
            Manage all citizen service requests
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
            {[
              { label: 'Total',     value: stats.total,            color: 'var(--brand)' },
              { label: 'Submitted', value: statCount('submitted'),  color: 'var(--submitted)' },
              { label: 'In Review', value: statCount('in_review'),  color: '#b45309' },
              { label: 'Resolved',  value: statCount('resolved'),   color: '#065f46' },
            ].map(({ label, value, color }) => (
              <div key={label} className="stat-card">
                <div className="stat-label">{label}</div>
                <div className="stat-value" style={{ color, fontSize: '1.75rem' }}>{value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {['all', 'submitted', 'in_review', 'resolved', 'rejected'].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className="btn btn-sm"
              style={{
                background: filter === f ? 'var(--brand)' : 'var(--surface)',
                color: filter === f ? '#fff' : 'var(--text-2)',
                border: filter === f ? 'none' : '1px solid var(--border-md)',
              }}>
              {f === 'all' ? 'All' : statusLabel[f]}
              <span style={{
                marginLeft: 4,
                background: filter === f ? 'rgba(255,255,255,0.25)' : 'var(--surface-2)',
                borderRadius: 99, padding: '1px 7px', fontSize: 11,
              }}>
                {f === 'all' ? requests.length : requests.filter(r => r.status === f).length}
              </span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="card" style={{ overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}>
              <div className="spinner" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
              <h3>No requests</h3>
              <p>No requests match the selected filter.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Citizen</th><th>Title</th><th>Category</th>
                  <th>Status</th><th>Submitted</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{r.citizen_name ?? '—'}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{r.citizen_email}</div>
                    </td>
                    <td style={{ fontWeight: 500, color: 'var(--text-1)', maxWidth: 200 }}>{r.title}</td>
                    <td><span className="cat-badge">{r.category}</span></td>
                    <td>
                      <span className={`status-badge status-${r.status}`}>
                        {statusLabel[r.status]}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                      {new Date(r.created_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}
                    </td>
                    <td>
                      {r.status !== 'resolved' && r.status !== 'rejected' && (
                        <button className="btn btn-ghost btn-sm"
                          onClick={() => { setModal(r); setStatusForm({ status: 'in_review', note: '' }); }}>
                          Update
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Status update modal */}
        {modal && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }} onClick={(e) => e.target === e.currentTarget && setModal(null)}>
            <div style={{
              background: 'var(--surface)', borderRadius: 20, padding: 32,
              width: '100%', maxWidth: 460,
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}>
              <h2 style={{ marginBottom: 6 }}>Update Request Status</h2>
              <p style={{ color: 'var(--text-3)', fontSize: 13, marginBottom: 24 }}>{modal.title}</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div className="form-group">
                  <label className="form-label">New Status</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {statusOptions.map((s) => (
                      <button key={s} type="button"
                        onClick={() => setStatusForm(f => ({ ...f, status: s }))}
                        className={`status-badge status-${s}`}
                        style={{
                          cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
                          border: statusForm.status === s ? '2px solid currentColor' : '2px solid transparent',
                          padding: '6px 14px', transition: 'all 0.15s',
                        }}>
                        {statusLabel[s]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Admin Note (optional)</label>
                  <textarea className="form-textarea" style={{ minHeight: 80 }}
                    placeholder="Add a note for the citizen..."
                    value={statusForm.note}
                    onChange={(e) => setStatusForm(f => ({ ...f, note: e.target.value }))} />
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleStatusUpdate} disabled={!!updating}>
                    {updating
                      ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Updating...</>
                      : 'Update Status'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};