import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllTCs } from '../lib/tc';
import { getAllColleges } from '../lib/college';
import { useAuth } from '../context/AuthContext';
import { TCRecord, CollegeData } from '../types/tc';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [tcs, setTcs] = useState<TCRecord[]>([]);
  const [colleges, setColleges] = useState<CollegeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAllTCs(), getAllColleges()]).then(([t, c]) => {
      setTcs(t); setColleges(c); setLoading(false);
    });
  }, []);

  const thisYear = new Date().getFullYear();
  const thisYearTCs = tcs.filter(r => r.tc_number.includes(String(thisYear)));
  const thisMonthTCs = tcs.filter(r => {
    const d = new Date(r.created_at);
    return d.getFullYear() === thisYear && d.getMonth() === new Date().getMonth();
  });
  const recent = tcs.slice(0, 5);
  const collegeMap: Record<number, CollegeData> = {};
  colleges.forEach(c => { collegeMap[c.id] = c; });

  return (
    <div className="dash-wrap">
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Welcome back{profile?.username ? `, ${profile.username}` : ''}! 👋</h1>
          <p className="dash-sub">Here's what's happening with your Transfer Certificate system</p>
        </div>
        <button className="dash-new-btn" onClick={() => navigate('/new-tc')}>
          + New TC
        </button>
      </div>

      {/* Stats */}
      <div className="dash-stats">
        <div className="dash-stat-card blue">
          <div className="dsc-icon">📄</div>
          <div className="dsc-info">
            <span>Total TCs Issued</span>
            <strong>{loading ? '…' : tcs.length}</strong>
          </div>
        </div>
        <div className="dash-stat-card green">
          <div className="dsc-icon">📅</div>
          <div className="dsc-info">
            <span>This Year ({thisYear})</span>
            <strong>{loading ? '…' : thisYearTCs.length}</strong>
          </div>
        </div>
        <div className="dash-stat-card gold">
          <div className="dsc-icon">🗓</div>
          <div className="dsc-info">
            <span>This Month</span>
            <strong>{loading ? '…' : thisMonthTCs.length}</strong>
          </div>
        </div>
        <div className="dash-stat-card purple">
          <div className="dsc-icon">🏫</div>
          <div className="dsc-info">
            <span>Colleges</span>
            <strong>{loading ? '…' : colleges.length}</strong>
          </div>
        </div>
      </div>

      <div className="dash-grid">
        {/* Recent TCs */}
        <div className="dash-card">
          <div className="dash-card-head">
            <h3>Recent Transfer Certificates</h3>
            <button className="dash-link" onClick={() => navigate('/records')}>View all →</button>
          </div>
          {loading ? <div className="dash-loading">Loading…</div> : (
            <table className="dash-table">
              <thead>
                <tr><th>TC No.</th><th>Student</th><th>College</th><th>Date</th></tr>
              </thead>
              <tbody>
                {recent.map(r => (
                  <tr key={r.id} onClick={() => navigate(`/preview/${r.id}`)} className="dash-row">
                    <td><span className="dash-badge">{r.tc_number}</span></td>
                    <td>{r.student_name}</td>
                    <td>{r.college_id ? (collegeMap[r.college_id]?.name ?? '—') : '—'}</td>
                    <td>{new Date(r.created_at).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
                {!recent.length && (
                  <tr><td colSpan={4} className="dash-empty">No TCs yet. <button className="dash-link" onClick={() => navigate('/new-tc')}>Create one →</button></td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Colleges */}
        <div className="dash-card">
          <div className="dash-card-head">
            <h3>Registered Colleges</h3>
          </div>
          {loading ? <div className="dash-loading">Loading…</div> : (
            <div className="dash-college-list">
              {colleges.map(c => (
                <div key={c.id} className="dash-college-item">
                  {c.logo_url
                    ? <img src={c.logo_url} alt="" className="dash-college-logo" />
                    : <div className="dash-college-logo-placeholder">🏫</div>
                  }
                  <div>
                    <div className="dash-college-name">{c.name}</div>
                    <div className="dash-college-sub">{c.affiliation || c.trust_name || '—'}</div>
                  </div>
                  <span className="dash-college-count">
                    {tcs.filter(t => t.college_id === c.id).length} TCs
                  </span>
                </div>
              ))}
              {!colleges.length && <div className="dash-empty">No colleges registered yet.</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
