import React, { useEffect, useState, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { createRoot } from 'react-dom/client';
import TCCertificate from '../components/TCCertificate';
import { TCRecord, CollegeData, TCFormData, TCDownloadLog } from '../types/tc';
import { getAllTCs, deleteTC, updateTC, incrementDownloadCount, addDownloadLog, getDownloadLogs, printedTCNumber } from '../lib/tc';
import { getAllColleges } from '../lib/college';

const Records: React.FC = () => {
  const [records,  setRecords]  = useState<TCRecord[]>([]);
  const [colleges, setColleges] = useState<Record<number, CollegeData>>({});
  const [search,   setSearch]   = useState('');
  const [editing,  setEditing]  = useState<TCRecord | null>(null);
  const [editForm, setEditForm] = useState<Partial<TCFormData>>({});
  const [editTCNo, setEditTCNo] = useState('');
  const [editError, setEditError] = useState('');
  const [saving,   setSaving]   = useState(false);
  const [dupModal, setDupModal] = useState<TCRecord | null>(null);
  const [dupReason, setDupReason] = useState('');
  const [printDup,  setPrintDup]  = useState(false);
  const [expandedLogs, setExpandedLogs] = useState<Record<number, TCDownloadLog[]>>({});
  const [loadingLogs,  setLoadingLogs]  = useState<Record<number, boolean>>({});
  const navigate = useNavigate();

  useEffect(() => {
    getAllTCs().then(r => setRecords(r));
    getAllColleges().then(r => {
      const map: Record<number, CollegeData> = {};
      r.forEach(c => { map[c.id] = c; });
      setColleges(map);
    });
  }, []);

  const filtered = records.filter(r =>
    r.student_name.toLowerCase().includes(search.toLowerCase()) ||
    r.tc_number.toLowerCase().includes(search.toLowerCase())
  );

  const waitForImages = (el: HTMLElement): Promise<void> => {
    const imgs = Array.from(el.querySelectorAll('img'));
    if (!imgs.length) return Promise.resolve();
    return Promise.all(imgs.map(img => img.complete
      ? Promise.resolve()
      : new Promise<void>(res => { img.onload = () => res(); img.onerror = () => res(); })
    )).then(() => {});
  };

  const waitForElement = (container: HTMLElement): Promise<HTMLElement> =>
    new Promise(res => {
      const check = () => {
        const el = container.firstElementChild as HTMLElement | null;
        if (el) { res(el); } else { requestAnimationFrame(check); }
      };
      requestAnimationFrame(check);
    });

  const downloadPDF = async (rec: TCRecord, isDuplicate = false): Promise<void> => {
    const college = rec.college_id ? colleges[rec.college_id] : undefined;
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;left:-9999px;top:0;';
    document.body.appendChild(container);
    const root = createRoot(container);
    root.render(<TCCertificate data={rec} college={college} isDuplicate={isDuplicate} />);
    const el = await waitForElement(container);
    await waitForImages(el);
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a3' });
    // Fit the capture inside the page without stretching it
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const fit   = Math.min(pageW / canvas.width, pageH / canvas.height);
    const imgW  = canvas.width * fit;
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', (pageW - imgW) / 2, 0, imgW, canvas.height * fit);
    pdf.save(`TC_${rec.tc_number.replace(/\//g, '_')}.pdf`);
    root.unmount();
    document.body.removeChild(container);
    const newCount = (rec.download_count ?? 0) + 1;
    await incrementDownloadCount(rec.id, newCount);
    setRecords(prev => prev.map(r => r.id === rec.id ? { ...r, download_count: newCount } : r));
  };

  const handleDownloadClick = (rec: TCRecord) => {
    if ((rec.download_count ?? 0) === 0) {
      downloadPDF(rec, false);
    } else {
      setDupReason('');
      setPrintDup(false);
      setDupModal(rec);
    }
  };

  const handleDupConfirm = async () => {
    if (!dupModal) return;
    const newCount = (dupModal.download_count ?? 0) + 1;
    await downloadPDF(dupModal, printDup);
    await addDownloadLog(dupModal.id, newCount, dupReason);
    // refresh logs if already expanded
    if (expandedLogs[dupModal.id]) {
      const logs = await getDownloadLogs(dupModal.id);
      setExpandedLogs(prev => ({ ...prev, [dupModal.id]: logs }));
    }
    setDupModal(null);
  };

  const toggleLogs = async (rec: TCRecord) => {
    if (expandedLogs[rec.id]) {
      setExpandedLogs(prev => { const n = { ...prev }; delete n[rec.id]; return n; });
      return;
    }
    setLoadingLogs(prev => ({ ...prev, [rec.id]: true }));
    const logs = await getDownloadLogs(rec.id);
    setExpandedLogs(prev => ({ ...prev, [rec.id]: logs }));
    setLoadingLogs(prev => ({ ...prev, [rec.id]: false }));
  };

  const handleDelete = async (id: number): Promise<void> => {
    if (!window.confirm('Delete this TC record? This cannot be undone.')) return;
    await deleteTC(id);
    setRecords(prev => prev.filter(r => r.id !== id));
  };

  const openEdit = (rec: TCRecord) => {
    setEditing(rec);
    const { id, tc_number, created_at, ...rest } = rec;
    setEditForm(rest);
    setEditTCNo(printedTCNumber(tc_number, colleges[rec.college_id]?.name));
    setEditError('');
  };

  const handleEditChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setEditForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    if (!editing) return;
    const collegeName = colleges[editing.college_id]?.name;
    const tc_number   = printedTCNumber(editTCNo.trim(), collegeName);
    if (!tc_number) { setEditError('T.C. No. is required.'); return; }
    const tcNoChanged = tc_number !== printedTCNumber(editing.tc_number, collegeName);
    setSaving(true);
    setEditError('');
    try {
      const updated = await updateTC(editing.id, tcNoChanged ? { ...editForm, tc_number } : editForm);
      setRecords(prev => prev.map(r => r.id === updated.id ? updated : r));
      setEditing(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

  const fmt = (d: string): string => d ? new Date(d).toLocaleDateString('en-IN') : '—';
  const thisYear = new Date().getFullYear();

  return (
    <div className="records-page">
      <div className="page-header">
        <h2>TC Records</h2>
        <p>View, edit, download and manage all issued Transfer Certificates</p>
      </div>

      <div className="records-stats">
        <div className="stat-card">
          <div className="stat-icon blue">📄</div>
          <div className="stat-info"><p>Total Issued</p><h3>{records.length}</h3></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">📅</div>
          <div className="stat-info">
            <p>This Year</p>
            <h3>{records.filter(r => r.tc_number.includes(String(thisYear))).length}</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon gold">🎓</div>
          <div className="stat-info">
            <p>Latest TC</p>
            <h3 style={{ fontSize: 14, marginTop: 4 }}>{records[0]?.tc_number ?? '—'}</h3>
          </div>
        </div>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <h3>All Transfer Certificates</h3>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              className="rec-search"
              placeholder="🔍 Search by name or TC no…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <span className="table-count">{filtered.length} records</span>
          </div>
        </div>
        <table className="records-table">
          <thead>
            <tr>
              <th>TC Number</th>
              <th>Student Name</th>
              <th>College</th>
              <th>Class</th>
              <th>Leaving Date</th>
              <th>Duplicate Downloads</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <React.Fragment key={r.id}>
              <tr>
                <td><span className="tc-badge">{r.tc_number}</span></td>
                <td><span className="student-name">{r.student_name}</span></td>
                <td>
                  <div className="college-cell">
                    {r.college_id && colleges[r.college_id]?.logo_url && (
                      <img src={colleges[r.college_id].logo_url} alt="" className="table-logo" />
                    )}
                    <span>{r.college_id ? (colleges[r.college_id]?.name ?? '—') : '—'}</span>
                  </div>
                </td>
                <td><span className="class-badge">{r.class_at_leaving || '—'}</span></td>
                <td>{fmt(r.leaving_date)}</td>
                <td style={{ textAlign: 'center' }}>
                  {(r.download_count ?? 0) === 0 ? (
                    <span className="class-badge">—</span>
                  ) : (
                    <button
                      className="action-btn view"
                      style={{ fontSize: 12 }}
                      onClick={() => toggleLogs(r)}
                      title="View download history"
                    >
                      #{r.download_count} {expandedLogs[r.id] ? '▲' : '▼'}
                    </button>
                  )}
                </td>
                <td>
                  <div className="action-btns-grid">
                    <button className="action-btn view"     onClick={() => navigate(`/preview/${r.id}`)}>👁 View</button>
                    <button className="action-btn edit"     onClick={() => openEdit(r)}>✏ Edit</button>
                    <button className="action-btn download" onClick={() => handleDownloadClick(r)}>⬇ PDF</button>
                    <button className="action-btn delete"   onClick={() => handleDelete(r.id)}>🗑 Delete</button>
                  </div>
                </td>
              </tr>
              {expandedLogs[r.id] && (
                <tr key={`log-${r.id}`}>
                  <td colSpan={7} style={{ background: '#f8f9fa', padding: '8px 16px' }}>
                    {loadingLogs[r.id] ? (
                      <span style={{ fontSize: 12, color: '#888' }}>Loading…</span>
                    ) : expandedLogs[r.id].length === 0 ? (
                      <span style={{ fontSize: 12, color: '#888' }}>No re-download logs yet.</span>
                    ) : (
                      <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ color: '#555' }}>
                            <th style={{ textAlign: 'left', padding: '2px 8px', width: 80 }}>Download #</th>
                            <th style={{ textAlign: 'left', padding: '2px 8px' }}>Reason</th>
                            <th style={{ textAlign: 'left', padding: '2px 8px', width: 160 }}>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {expandedLogs[r.id].map(log => (
                            <tr key={log.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                              <td style={{ padding: '3px 8px' }}>#{log.download_count}</td>
                              <td style={{ padding: '3px 8px' }}>{log.reason || '—'}</td>
                              <td style={{ padding: '3px 8px' }}>{new Date(log.downloaded_at).toLocaleString('en-IN')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </td>
                </tr>
              )}
              </React.Fragment>
            ))}
            {!filtered.length && (
              <tr><td colSpan={7}>
                <div className="empty-state">
                  <div className="empty-state-icon">📭</div>
                  <p>{search ? 'No matching records.' : 'No records found. Generate your first TC.'}</p>
                </div>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Duplicate Download Modal */}
      {dupModal && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 420 }}>
            <div className="modal-head">
              <h3>Re-download TC — {dupModal.tc_number}</h3>
              <button className="modal-close" onClick={() => setDupModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: 12, color: '#555', fontSize: 13 }}>
                This TC has been downloaded <strong>{dupModal.download_count}</strong> time(s) before.
              </p>
              <div className="edit-field full">
                <label>Reason for applying TC again</label>
                <textarea
                  rows={3}
                  value={dupReason}
                  onChange={e => setDupReason(e.target.value)}
                  placeholder="Enter reason…"
                  style={{ width: '100%', marginTop: 4 }}
                />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, cursor: 'pointer', fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={printDup}
                  onChange={e => setPrintDup(e.target.checked)}
                />
                Print <strong>DUPLICATE</strong> watermark on certificate
              </label>
            </div>
            <div className="modal-foot">
              <button className="action-btn view" onClick={() => setDupModal(null)}>Cancel</button>
              <button className="action-btn download" onClick={handleDupConfirm}>⬇ Download PDF</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-head">
              <h3>Edit TC — {editing.tc_number}</h3>
              <button className="modal-close" onClick={() => setEditing(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="edit-grid">
                <div className="edit-field">
                  <label>T.C. No.</label>
                  <input type="text" value={editTCNo} onChange={e => setEditTCNo(e.target.value)} />
                </div>
                {([
                  ['student_name', 'Student Name', 'text'],
                  ['father_name',  "Father's Name", 'text'],
                  ['mother_name',  "Mother's Name", 'text'],
                  ['guardian_name','Guardian Name', 'text'],
                  ['id_number',    'ID Number',    'text'],
                  ['dob',          'Date of Birth','date'],
                  ['dob_words',    'DOB in Words', 'text'],
                  ['admission_date','Admission Date','date'],
                  ['study_period', 'Study Period', 'text'],
                  ['leaving_date', 'Leaving Date', 'date'],
                  ['class_at_leaving','Class at Leaving','text'],
                  ['medium',       'Medium',       'text'],
                  ['umis_number',  'UMIS Number',  'text'],
                  ['promotion_status','Promotion Status','text'],
                  ['application_date','Application Date','date'],
                  ['conduct',      'Conduct',      'text'],
                ] as [keyof TCFormData, string, string][]).map(([key, label, type]) => (
                  <div key={key} className="edit-field">
                    <label>{label}</label>
                    <input
                      type={type}
                      name={key}
                      value={(editForm[key] as string) ?? ''}
                      onChange={handleEditChange}
                    />
                  </div>
                ))}
                <div className="edit-field full">
                  <label>Reason</label>
                  <textarea name="reason" value={editForm.reason ?? ''} onChange={handleEditChange} rows={3} />
                </div>
              </div>
              {editError && <p className="error-msg">⚠ {editError}</p>}
            </div>
            <div className="modal-foot">
              <button className="action-btn view" onClick={() => setEditing(null)}>Cancel</button>
              <button className="action-btn download" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : '💾 Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Records;
