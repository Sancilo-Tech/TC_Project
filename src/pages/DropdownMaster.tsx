import React, { useEffect, useState, useCallback } from 'react';
import {
  getAllDropdowns, addDropdown, deleteDropdown,
  DropdownOption, DropdownCategory,
} from '../lib/dropdowns';
import './DropdownMaster.css';

interface TabConfig {
  key: DropdownCategory;
  label: string;
  icon: string;
  parentCategory?: DropdownCategory;
  hint?: string;
}

const TABS: TabConfig[] = [
  { key: 'nationality',       label: 'Nationality',       icon: '🌍' },
  { key: 'religion',          label: 'Religion',          icon: '🕌' },
  { key: 'community',         label: 'Community',         icon: '👥', parentCategory: 'religion',  hint: 'Select a Religion to filter' },
  { key: 'caste',             label: 'Caste',             icon: '📋', parentCategory: 'community', hint: 'Select a Community to filter' },
  { key: 'medium',            label: 'Medium',            icon: '📚' },
  { key: 'promotion_status',  label: 'Promotion Status',  icon: '🎓' },
  { key: 'conduct',           label: 'Conduct',           icon: '⭐' },
  { key: 'reason',            label: 'Reason',            icon: '📝' },
  { key: 'tc_prefix',         label: 'TC No. Prefix',     icon: '🔢', hint: 'e.g. PAC/TC/2026/ — the number entered in New TC is added after it' },
];

const DropdownMaster: React.FC = () => {
  const [activeTab, setActiveTab]   = useState<DropdownCategory>('nationality');
  const [all, setAll]               = useState<DropdownOption[]>([]);
  const [loading, setLoading]       = useState(true);
  const [newValue, setNewValue]     = useState('');
  const [parentFilter, setParentFilter] = useState('');
  const [adding, setAdding]         = useState(false);
  const [error, setError]           = useState('');
  const [info, setInfo]             = useState('');

  const load = useCallback(() => {
    setLoading(true);
    getAllDropdowns().then(d => { setAll(d); setLoading(false); }).catch(e => { setError(e.message); setLoading(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  // reset parent filter when tab changes
  useEffect(() => { setParentFilter(''); setNewValue(''); setError(''); setInfo(''); }, [activeTab]);

  const tab = TABS.find(t => t.key === activeTab)!;

  // items for current tab, filtered by parent if applicable
  const items = all.filter(o => {
    if (o.category !== activeTab) return false;
    if (tab.parentCategory && parentFilter) return o.parent === parentFilter;
    return true;
  });

  // parent options for the filter dropdown
  const parentOptions = tab.parentCategory
    ? all.filter(o => o.category === tab.parentCategory).map(o => o.value).filter((v, i, a) => a.indexOf(v) === i)
    : [];

  const handleAdd = async () => {
    if (!newValue.trim()) return;
    if (tab.parentCategory && !parentFilter) { setError(`Please select a ${tab.parentCategory} first`); return; }
    setAdding(true); setError(''); setInfo('');
    try {
      await addDropdown(activeTab, newValue.trim(), parentFilter || undefined);
      setInfo(`"${newValue.trim()}" added.`);
      setNewValue('');
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (item: DropdownOption) => {
    if (!window.confirm(`Delete "${item.value}"?`)) return;
    setError(''); setInfo('');
    try {
      await deleteDropdown(item.id);
      setInfo(`"${item.value}" deleted.`);
      load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="dm-wrap">
      <div className="dm-header">
        <div>
          <h2 className="dm-title">⚙ Dropdown Master</h2>
          <p className="dm-sub">Manage all dropdown options used in the New TC form</p>
        </div>
      </div>

      {error && <div className="dm-error">⚠ {error}</div>}
      {info  && <div className="dm-info">✓ {info}</div>}

      {/* Tabs */}
      <div className="dm-tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`dm-tab${activeTab === t.key ? ' active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Panel */}
      <div className="dm-panel">
        <div className="dm-panel-head">
          <div>
            <h3>{tab.icon} {tab.label}</h3>
            {tab.hint && <p>{tab.hint}</p>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Parent filter for community / caste */}
            {tab.parentCategory && (
              <div className="dm-parent-filter">
                <label>{tab.parentCategory.charAt(0).toUpperCase() + tab.parentCategory.slice(1)}:</label>
                <select
                  className="dm-parent-select"
                  value={parentFilter}
                  onChange={e => setParentFilter(e.target.value)}
                >
                  <option value="">All</option>
                  {parentOptions.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            )}
            <span className="dm-count">{items.length} items</span>
          </div>
        </div>

        {/* Add row */}
        <div className="dm-add-row">
          <input
            className="dm-add-input"
            placeholder={`Add new ${tab.label.toLowerCase()}${tab.parentCategory && parentFilter ? ` under "${parentFilter}"` : ''}…`}
            value={newValue}
            onChange={e => setNewValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <button className="dm-add-btn" onClick={handleAdd} disabled={adding || !newValue.trim()}>
            {adding ? 'Adding…' : '+ Add'}
          </button>
        </div>

        {/* List */}
        <div className="dm-list">
          {loading ? (
            <div className="dm-loading">Loading…</div>
          ) : items.length === 0 ? (
            <div className="dm-empty">
              No items yet.{tab.parentCategory && !parentFilter ? ` Select a ${tab.parentCategory} to filter, or add items above.` : ' Add one above.'}
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="dm-item">
                <span className="dm-item-label">{item.value}</span>
                {item.parent && !parentFilter && (
                  <span className="dm-item-parent">{item.parent}</span>
                )}
                <button className="dm-del-btn" onClick={() => handleDelete(item)}>🗑 Delete</button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DropdownMaster;
