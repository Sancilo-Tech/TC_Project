import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTC } from '../lib/tc';
import { TCFormData, FieldConfig } from '../types/tc';
import { useCollege } from '../context/CollegeContext';
import CollegeSelector from '../components/CollegeSelector';
import { getAllDropdowns, DropdownOption } from '../lib/dropdowns';
import SearchableSelect from '../components/SearchableSelect';

const initialState: TCFormData = {
  student_name: '', father_name: '', mother_name: '', guardian_name: '',
  parent_name: '', gender: '',
  nationality: 'Indian', religion: 'Refer Community Certificate', community: 'Refer Community Certificate', caste: 'Refer Community Certificate',
  dob: '', dob_words: '', admission_date: '', study_period: '',
  leaving_date: '', class_at_leaving: '', medium: '',
  promotion_status: 'Refer Mark Sheet', application_date: '', reason: '',
  conduct: '', id_number: '', umis_number: '', college_id: 0,
};

type FormErrors = Partial<Record<keyof TCFormData | 'college', string>>;

const required = new Set<keyof TCFormData>([
  'student_name', 'father_name', 'mother_name', 'gender',
  'dob', 'dob_words', 'admission_date', 'leaving_date',
  'class_at_leaving', 'medium',
  'application_date',
]);

const personalFields: FieldConfig[] = [
  { name: 'student_name',  label: 'Name of the Student (Block Letters)', full: true },
  { name: 'father_name',   label: "Father's Name",                       full: true },
  { name: 'mother_name',   label: "Mother's Name",                       full: true },
  { name: 'guardian_name', label: 'Guardian Name',                       full: true },
  { name: 'id_number',     label: 'ID Number' },
  { name: 'dob',           label: 'Date of Birth (Figures)',             type: 'date' },
  { name: 'dob_words',     label: 'Date of Birth (Words)',               full: true },
];

const academicFields: FieldConfig[] = [
  { name: 'admission_date',   label: 'Date of Admission',                          type: 'date' },
  { name: 'study_period',     label: 'Period of Study' },
  { name: 'leaving_date',     label: 'Date of Completion',                         type: 'date' },
  { name: 'class_at_leaving', label: 'Degree at Time of Completion',               full: true },
  { name: 'medium',           label: 'Medium of Instruction' },
  { name: 'umis_number',      label: 'UMIS Number' },
  { name: 'promotion_status', label: 'Qualified for Promotion to Higher Education', disabled: true },
  { name: 'application_date', label: 'Date of Application for T.C.',               type: 'date' },
  { name: 'reason',           label: 'Reason for Applying T.C.',                   full: true, textarea: true },
  { name: 'conduct',          label: 'Conduct and Character',  disabled: true },
];

const errStyle: React.CSSProperties = { color: '#dc2626', fontSize: 11, marginTop: 2, display: 'block' };
const redBorder: React.CSSProperties = { borderColor: '#dc2626' };
const star = <span style={{ color: '#dc2626' }}> *</span>;

const TCForm: React.FC = () => {
  const [form, setForm]           = useState<TCFormData>(initialState);
  const [errors, setErrors]       = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading]     = useState(false);
  const [opts, setOpts]           = useState<DropdownOption[]>([]);
  const { selected } = useCollege();
  const navigate = useNavigate();

  useEffect(() => { getAllDropdowns().then(setOpts).catch(() => {}); }, []);
  useEffect(() => { if (selected) setErrors(p => { const n = { ...p }; delete n.college; return n; }); }, [selected]);

  const vals = (cat: string, parent?: string) =>
    opts.filter(o => o.category === cat && (parent === undefined || o.parent === parent)).map(o => o.value);

  const clearErr = (name: string) =>
    setErrors(p => { const n = { ...p }; delete (n as any)[name]; return n; });

  const handle = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    clearErr(name);
    setForm(prev => {
      const u = { ...prev, [name]: value };
      if (name === 'religion')  { u.community = ''; u.caste = ''; }
      if (name === 'community') { u.caste = ''; }
      return u;
    });
  };

  const handleSelect = (name: string, value: string) => {
    clearErr(name);
    setForm(prev => {
      const u = { ...prev, [name]: value };
      if (name === 'religion')  { u.community = ''; u.caste = ''; }
      if (name === 'community') { u.caste = ''; }
      return u;
    });
  };

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!selected) e.college = 'Please select a college.';
    if (!form.student_name.trim())     e.student_name     = 'Student name is required.';
    if (!form.father_name.trim())      e.father_name      = "Father's name is required.";
    if (!form.mother_name.trim())      e.mother_name      = "Mother's name is required.";
    if (!form.gender)                  e.gender           = 'Gender is required.';
    if (!form.dob)                     e.dob              = 'Date of birth is required.';
    if (!form.dob_words.trim())        e.dob_words        = 'Date of birth in words is required.';
    if (!form.admission_date)          e.admission_date   = 'Admission date is required.';
    if (!form.leaving_date)            e.leaving_date     = 'Date of completion is required.';
    if (!form.class_at_leaving.trim()) e.class_at_leaving = 'Degree / class is required.';
    if (!form.medium)                  e.medium           = 'Medium of instruction is required.';
    if (!form.application_date)        e.application_date = 'Application date is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setSubmitError('');
    try {
      const rec = await createTC({ ...form, college_id: selected!.id });
      navigate(`/preview/${rec.id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fieldErr = (name: keyof TCFormData) =>
    errors[name] ? <span style={errStyle}>{errors[name]}</span> : null;

  const renderField = (f: FieldConfig) => {
    const isReq = required.has(f.name as keyof TCFormData);
    const hasErr = !!errors[f.name as keyof TCFormData];
    return (
      <div key={f.name} className={`form-group${f.full ? ' full' : ''}`}>
        <label>{f.label}{isReq && star}</label>
        {f.disabled
          ? <input type="text" value={form[f.name] as string || ''} disabled />
          : f.textarea
            ? <textarea name={f.name} value={form[f.name] as string} onChange={handle}
                style={hasErr ? redBorder : {}} />
            : ['medium', 'promotion_status'].includes(f.name)
              ? <SearchableSelect
                  name={f.name} value={form[f.name] as string}
                  options={vals(f.name)} placeholder="-- Select --"
                  onChange={handleSelect}
                />
              : <input type={f.type ?? 'text'} name={f.name} value={form[f.name] as string}
                  onChange={handle} style={hasErr ? redBorder : {}} />
        }
        {fieldErr(f.name as keyof TCFormData)}
      </div>
    );
  };

  return (
    <div className="form-page">
      <div className="page-header">
        <h2>New Transfer Certificate</h2>
        <p>Select a college, fill in student details, and generate an official TC</p>
      </div>

      <CollegeSelector />
      {errors.college && <p className="error-msg">⚠ {errors.college}</p>}

      <div className="card">
        <div className="card-header">
          <div className="card-header-icon">📋</div>
          <div>
            <h3>Student Information</h3>
            <p>Fields marked <span style={{ color: '#dc2626' }}>*</span> are required</p>
          </div>
        </div>

        <div className="card-body">
          <form onSubmit={submit}>
            <div className="form-grid">

              <div className="form-section-title">Personal Details</div>

              <div className="form-group">
                <label>Gender {star}</label>
                <select name="gender" value={form.gender} onChange={handle}
                  style={errors.gender ? redBorder : {}}>
                  <option value="">-- Select --</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Transgender</option>
                </select>
                {fieldErr('gender')}
              </div>

              <div className="form-group">
                <label>Nationality {star}</label>
                <SearchableSelect
                  name="nationality" value={form.nationality}
                  options={vals('nationality')} onChange={handleSelect}
                />
                {fieldErr('nationality')}
              </div>

              <div className="form-group">
                <label>Religion</label>
                <input type="text" value="Refer Community Certificate" readOnly />
              </div>

              <div className="form-group">
                <label>Community</label>
                <input type="text" value="Refer Community Certificate" readOnly />
              </div>

              <div className="form-group">
                <label>Caste</label>
                <input type="text" value="Refer Community Certificate" readOnly />
              </div>

              {personalFields.map(renderField)}

              <div className="form-section-title">Academic Details</div>

              {academicFields.map(renderField)}

            </div>

            {submitError && <p className="error-msg">⚠ {submitError}</p>}
            {Object.keys(errors).length > 0 && !submitError && (
              <p className="error-msg">⚠ Please fix the highlighted fields before submitting.</p>
            )}

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? '⏳ Generating...' : '🎓 Generate Transfer Certificate'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TCForm;
