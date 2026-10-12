import React, { forwardRef, ReactNode } from 'react';
import './TCCertificate.css';
import { TCRecord, CollegeData } from '../types/tc';

const fmt = (d: string): string => (d ? new Date(d).toLocaleDateString('en-IN') : '');

interface RowProps {
  num: string;
  label: ReactNode;
  children?: ReactNode;
  value?: string;
}
const Row: React.FC<RowProps> = ({ num, label, children, value }) => (
  <div className="tc-row">
    <div className="tc-num-col">{num}.</div>
    <div className="tc-label-col">{label}</div>
    <div className="tc-colon-col">:</div>
    <div className="tc-value-col">{children ?? value}</div>
  </div>
);

interface TCCertificateProps {
  data: TCRecord;
  college?: CollegeData | null;
  isDuplicate?: boolean;
}

const communityReligion: Record<string, string> = {
  'OC': 'Hindu', 'BC': 'Hindu', 'BC(M)': 'Muslim', 'MBC': 'Hindu', 'MBC(V)': 'Hindu',
  'SC': 'Hindu', 'SC(A)': 'Hindu', 'ST': 'Hindu',
  'BC(C)': 'Christian', 'SC(C)': 'Christian',
};

const TCCertificate = forwardRef<HTMLDivElement, TCCertificateProps>(({ data, college, isDuplicate }, ref) => {
  const collegeName = college?.name        ?? 'PALAR AGRICULTURAL COLLEGE';
  const trustName   = college?.trust_name  ?? 'A Unit of R.S Educational and Charitable Trust';
  const address     = college?.address     ?? 'Melpatti-635 805, Vellore (Dt), Tamil Nadu.';
  const logoUrl     = college?.logo_url    ?? '';
  const abbr        = collegeName.split(' ').map((w: string) => w[0]).join('').toUpperCase();
  const fullTCNum   = data.tc_number ? `${abbr}/${data.tc_number}` : '';

  return (
    <div className="tc-cert" ref={ref}>

      {/* Duplicate stamp */}
      {isDuplicate && (
        <div style={{
          position: 'absolute', top: 12, right: 16,
          border: '2.5px solid #c00', color: '#c00',
          fontWeight: 700, fontSize: 13, letterSpacing: 2,
          padding: '2px 10px', transform: 'rotate(0deg)',
          opacity: 0.85, pointerEvents: 'none', zIndex: 10,
          fontFamily: 'serif',
        }}>DUPLICATE</div>
      )}

      {/* Watermark */}
      <div className="watermark">
        {logoUrl
          ? <img src={logoUrl} alt="" className="watermark-img" crossOrigin="anonymous" />
          : <div className="watermark-circle"><span className="watermark-text">{collegeName}</span></div>
        }
      </div>

      {/* Header */}
      <div className="tc-header">
        <div className="header-logo">
          {logoUrl
            ? <img src={logoUrl} alt="college logo" className="logo-img" crossOrigin="anonymous" />
            : (
              <div className="logo-circle">
                <div className="logo-inner">
                  <div className="logo-cross">✛</div>
                  <div className="logo-text">
                    {collegeName.split(' ').map(w => w[0]).slice(0, 3).join('')}
                  </div>
                </div>
              </div>
            )
          }
        </div>
        <div className="header-text">
          <div className="college-name">{collegeName.toUpperCase()}</div>
          <div className="college-trust">({trustName})</div>
          <div className="college-accred">
            Accredited by <strong>INDIAN COUNCIL OF AGRICULTURAL RESEARCH (ICAR-NAEAB, New Delhi)</strong>
          </div>
          <div className="college-affil">
            Permanently Affiliated to <strong>TAMIL NADU AGRICULTURAL UNIVERSITY</strong>, Coimbatore
          </div>
          <div className="college-addr">{address}</div>
        </div>
      </div>

      <hr className="tc-divider" />

      {/* Title */}
      <div className="tc-title-bar">
        <span className="tc-title-text">TRANSFER CERTIFICATE</span>
      </div>

      {/* TC No / ID No */}
      <div className="tc-top-row">
        <div className="tc-top-item">
          <span>T.C.No.:</span>
          <span>{fullTCNum}</span>
        </div>
        <div className="tc-top-item">
          <span>ID No:</span>
          <span>{data.id_number ?? ''}</span>
        </div>
      </div>

      {/* Body */}
      <div className="tc-body">

        {/* 1. Name of the student */}
        <Row num="1" label="Name of the Student (In block letters)">
          <span style={{fontWeight:'bold'}}>{data.student_name?.toUpperCase()}</span>
        </Row>

        {/* 2. Father's Name */}
        <Row num="2" label="Father's Name" value={data.father_name} />

        {/* 3. Mother's Name / Guardian Name */}
        <Row num="3" label="Mother's Name / Guardian Name" value={data.mother_name || data.guardian_name} />

        {/* 4. Gender */}
        <Row num="4" label="Gender" value={data.gender} />

        {/* 5. Nationality and Religion */}
        <Row num="5" label="Nationality and Religion"
          value="Indian & Refer Community Certificate" />

        {/* 6. Community & Caste */}
        <Row num="6" label="Community & Caste" value="Refer Community Certificate" />

        {/* 7. Date of Birth */}
        <Row num="7" label="Date of Birth as entered in the admission Register (In figures and words)">
          <div>
            <div>{fmt(data.dob)}</div>
            <div>{data.dob_words}</div>
          </div>
        </Row>

        {/* 8. Date of Admission */}
        <Row num="8" label="Date of Admission">
          <strong>{fmt(data.admission_date)}</strong>
        </Row>

        {/* 9. Period of Study */}
        <Row num="9" label="Period of Study" value={data.study_period} />

        {/* 10. Date of Completion */}
        <Row num="10" label="Date of Completion">
          <strong>{fmt(data.leaving_date)}</strong>
        </Row>

        {/* 11. Degree in which the student was studying at the time of completion */}
        <Row num="11" label="Degree in which the student was studying at the time of completion"
          value={data.class_at_leaving} />

        {/* 12. Medium of Instruction */}
        <Row num="12" label="Medium of Instruction" value={data.medium} />

        {/* 13. UMIS Number */}
        <Row num="13" label="UMIS Number" value={data.umis_number} />

        {/* 14. Whether qualified for promotion */}
        <Row num="14" label="Whether qualified for promotion to higher education"
          value="Refer Mark Sheet" />

        {/* 15. Date of application for T.C */}
        <Row num="15" label="Date of application for T.C">
          <strong>{fmt(data.application_date)}</strong>
        </Row>

        {/* 16. Reason for applying */}
        <Row num="16" label="Reason for applying for the T.C" value={data.reason} />

        {/* 17. Conduct and Character */}
        <Row num="17" label="Conduct and Character" value="" />

      </div>

      {/* Footer */}
      <div className="tc-footer">
        <div className="footer-left">
          <div>Place:</div>
          <div>Date:</div>
        </div>
        <div className="footer-right">
          <div className="principal-label">Principal</div>
        </div>
      </div>

    </div>
  );
});

TCCertificate.displayName = 'TCCertificate';
export default TCCertificate;
