import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getRequests, createRequest } from '../api';
import type { ServiceRequest, RequestCategory } from '../types';

const CATEGORIES: { value: RequestCategory; label: string; icon: string }[] = [
  { value: 'pothole', label: 'Pothole / Road',  icon: '🚧' },
  { value: 'permit',  label: 'Permit Request',  icon: '📋' },
  { value: 'noise',   label: 'Noise Complaint', icon: '🔊' },
  { value: 'other',   label: 'Other',           icon: '📌' },
];

const statusLabel: Record<string, string> = {
  submitted: 'Submitted', in_review: 'In Review',
  resolved: 'Resolved',   rejected: 'Rejected',
};

export const CitizenDashboard = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: 'pothole' as RequestCategory, title: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    getRequests()
      .then(({ data }) => setRequests(data))
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await createRequest(form);
      setRequests((prev) => [data, ...prev]);
      setForm({ category: 'pothole', title: '', description: '' });
      setShowForm(false);
      showToast('Request submitted successfully!');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      showToast(axiosErr.response?.data?.error ?? 'Failed to submit');
    } finally { setSubmitting(false); }
  };

  const counts = {
    submitted: requests.filter(r => r.status === 'submitted').length,
    in_review: requests.filter(r => r.status === 'in_review').length,
    resolved:  requests.filter(r => r.status === 'resolved').length,
  };

  return (
    <div className="page-wrapper">
      <div className="main-content">
        {toast && (
          <div className="toast-container">
            <div className="toast toast-success">{toast}</div>
          </div>
        )}

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1>My Requests</h1>
            <p style={{ color: 'var(--text-3)', marginTop: 4, fontSize: 14 }}>
              Welcome back, {user?.name}. Track your service requests below.
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Cancel' : '+ New Request'}
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Submitted', value: counts.submitted, color: 'var(--submitted)' },
            { label: 'In Review', value: counts.in_review, color: '#b45309' },
            { label: 'Resolved',  value: counts.resolved,  color: '#065f46' },
          ].map(({ label, value, color }) => (
            <div key={label} className="stat-card">
              <div className="stat-label">{label}</div>
              <div className="stat-value" style={{ color, fontSize: '1.75rem' }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Submit form */}
        {showForm && (
          <div className="card" style={{ padding: 28, marginBottom: 28 }}>
            <h2 style={{ marginBottom: 20 }}>Submit a New Request</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div className="form-group">
                <label className="form-label">Category</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                  {CATEGORIES.map((cat) => (
                    <button key={cat.value} type="button"
                      onClick={() => setForm(f => ({ ...f, category: cat.value }))}
                      style={{
                        padding: '12px 16px',
                        border: `2px solid ${form.category === cat.value ? 'var(--brand)' : 'var(--border-md)'}`,
                        borderRadius: 'var(--radius-md)',
                        background: form.category === cat.value ? 'var(--brand-light)' : 'var(--surface)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                        fontSize: 14, fontFamily: 'inherit',
                        color: form.category === cat.value ? 'var(--brand)' : 'var(--text-2)',
                        fontWeight: form.category === cat.value ? 500 : 400,
                        transition: 'all 0.15s',
                      }}>
                      <span style={{ fontSize: 20 }}>{cat.icon}</span>{cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="form-input" placeholder="Brief description of the issue"
                  value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} required />
              </div>

              <div className="form-group">
                <label className="form-label">Details</label>
                <textarea className="form-textarea" placeholder="Location, severity, any relevant details..."
                  value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting
                    ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Submitting...</>
                    : 'Submit Request'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Requests table */}
        <div className="card" style={{ overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div>
          ) : requests.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
              <h3>No requests yet</h3>
              <p>Submit your first service request using the button above.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th><th>Category</th><th>Status</th><th>Admin Note</th><th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 500, color: 'var(--text-1)', maxWidth: 220 }}>{r.title}</td>
                    <td><span className="cat-badge">{r.category}</span></td>
                    <td><span className={`status-badge status-${r.status}`}>{statusLabel[r.status]}</span></td>
                    <td style={{ fontSize: 13, color: 'var(--text-3)', maxWidth: 200 }}>{r.admin_note ?? '—'}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                      {new Date(r.created_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};