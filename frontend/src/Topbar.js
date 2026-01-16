import React from 'react';
import { useNavigate } from 'react-router-dom';
import './topbar.css';

export default function Topbar({ title, actions = [] }) {
  const navigate = useNavigate();
  return (
    <div className="topbar">
      <h1>{title}</h1>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        {actions.map(({ label, onClick, type = 'primary' }, i) => (
          <button
            key={i}
            onClick={onClick}
            className={`btn ${type === 'secondary' ? 'secondary' : ''} ${type === 'danger' ? 'danger' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
