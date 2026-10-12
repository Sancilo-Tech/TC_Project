import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import TCCertificate from '../components/TCCertificate';
import { TCRecord, CollegeData } from '../types/tc';
import { getTCById, incrementDownloadCount, addDownloadLog } from '../lib/tc';
import { getCollegeById } from '../lib/college';

const TCPreview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData]       = useState<TCRecord | null>(null);
  const [college, setCollege] = useState<CollegeData | null>(null);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [showDupModal, setShowDupModal] = useState(false);
  const [dupReason, setDupReason]       = useState('');
  const [printDup, setPrintDup]         = useState(false);
  const certRef  = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    getTCById(parseInt(id, 10)).then(async rec => {
      setData(rec);
      if (rec.college_id) {
        const col = await getCollegeById(rec.college_id);
        setCollege(col);
      }
    });
  }, [id]);

  const doPDF = async (isDuplicate: boolean): Promise<void> => {
    const el = certRef.current;
    if (!el || !data) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(el, {
        scale: 2, useCORS: true, backgroundColor: '#ffffff',
        width: el.offsetWidth, height: el.offsetHeight,
      });
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a3' });
      // Fit the capture inside the page without stretching it
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const fit   = Math.min(pageW / canvas.width, pageH / canvas.height);
      const imgW  = canvas.width * fit;
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', (pageW - imgW) / 2, 0, imgW, canvas.height * fit);
      pdf.save(`TC_${data.tc_number.replace(/\//g, '_')}.pdf`);
      const newCount = (data.download_count ?? 0) + 1;
      await incrementDownloadCount(data.id, newCount);
      setData(prev => prev ? { ...prev, download_count: newCount } : prev);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadClick = () => {
    if (!data) return;
    if ((data.download_count ?? 0) === 0) {
      doPDF(false);
    } else {
      setDupReason('');
      setPrintDup(false);
      setShowDupModal(true);
    }
  };

  const handleDupConfirm = async () => {
    if (!data) return;
    const newCount = (data.download_count ?? 0) + 1;
    await doPDF(printDup);
    await addDownloadLog(data.id, newCount, dupReason);
    setShowDupModal(false);
  };

  if (!data) return (
    <div className="loading-screen">
      <div className="spinner" />
      <p>Loading certificate...</p>
    </div>
  );

  return (
    <div className="tc-page-wrapper">
      <div className="preview-toolbar">
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
        <div style={{ flex: 1, paddingLeft: 8 }}>
          <div className="preview-toolbar-title">Transfer Certificate — {data.tc_number}</div>
          <div className="preview-toolbar-sub">{data.student_name} {college ? `· ${college.name}` : ''}</div>
        </div>
        <button className="download-btn" onClick={handleDownloadClick} disabled={downloading}>
          {downloading ? '⏳ Preparing...' : '⬇ Download PDF'}
        </button>
      </div>

      <TCCertificate data={data} college={college} isDuplicate={printDup} ref={certRef} />

      {/* Duplicate Download Modal */}
      {showDupModal && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 420 }}>
            <div className="modal-head">
              <h3>Re-download TC — {data.tc_number}</h3>
              <button className="modal-close" onClick={() => setShowDupModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: 12, color: '#555', fontSize: 13 }}>
                This TC has been downloaded <strong>{data.download_count}</strong> time(s) before.
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
              <button className="action-btn view" onClick={() => setShowDupModal(false)}>Cancel</button>
              <button className="action-btn download" onClick={handleDupConfirm} disabled={downloading}>
                {downloading ? '⏳ Preparing...' : '⬇ Download PDF'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TCPreview;
