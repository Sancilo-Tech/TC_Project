import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { changeMyPassword } from '../lib/auth';
import './Login.css';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true); setError('');
    try {
      await changeMyPassword(password);
      navigate('/');
    } catch (err: any) {
      setError(err.message); setLoading(false);
    }
  };

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="login-logo">TC</div>
        <h2>Set New Password</h2>
        <p className="login-sub">Transfer Certificate System</p>
        {error && <div className="login-error">{error}</div>}
        <form onSubmit={handleReset}>
          <label>New Password</label>
          <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          <label>Confirm Password</label>
          <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" />
          <button type="submit" disabled={loading} className="login-btn">
            {loading ? 'Saving…' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
