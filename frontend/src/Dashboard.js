import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';
import PostForm from './PostForm';
import './Dashboard.css';
import Topbar from './Topbar';

export default function Dashboard({ user, onLogout }) {
  const [requests, setRequests] = useState([]);
  const [loadingReqs, setLoadingReqs] = useState(true);
  const [answerTexts, setAnswerTexts] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [expandedMy, setExpandedMy] = useState({});
  const [expandedAll, setExpandedAll] = useState({});
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [filterAnliegen, setFilterAnliegen] = useState('');
  const [filterCity, setFilterCity]     = useState('');
  const [filterStreet, setFilterStreet] = useState('');
  const [filterPostcode, setFilterPostcode] = useState('');
  const [filterDatumzeit, setFilterDatumzeit] = useState('');
  const [filteredOthers, setFilteredOthers] = useState([]);
  const navigate = useNavigate();
  const API = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';

  useEffect(() => {
    document.title = 'Startseite | Remedy';
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/calendar`, { credentials: 'include' });
        if (res.status === 401) return navigate('/');
        const data = await res.json();
        setEvents(data);
      } catch (err) {
        console.error("Fehler beim Laden der Termine:", err);
      } finally {
        setLoadingEvents(false);
      }
    })();
  }, [API, navigate]);
  useEffect(() => {
  const others = requests.filter(r => r.username !== user);
  setFilteredOthers(others);
  }, [requests, user]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/requests`, { credentials: 'include' });
        if (res.status === 401) return navigate('/');
        setRequests(await res.json());
      } catch {
        alert('Fehler beim Laden der Anfragen.');
      } finally {
        setLoadingReqs(false);
      }
    })();
  }, [API, navigate]);


  const handleDeleteRequest = async id => {
    if (!window.confirm('Möchtest du diese Anfrage wirklich löschen?')) return;
    try {
      const res = await fetch(`${API}/requests/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) throw new Error();
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch {
      alert('Löschen fehlgeschlagen.');
    }
  };

  const myRequests = requests.filter(r => r.username === user);
  const toggleMy = id => setExpandedMy(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleAll = id => setExpandedAll(prev => ({ ...prev, [id]: !prev[id] }));

  const handleSubmitAnswer = async id => {
    const content = (answerTexts[id] || '').trim();
    if (!content) return alert('Antwort darf nicht leer sein.');
    try {
      const res = await fetch(`${API}/requests/${id}/answers`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      if (!res.ok) throw new Error();
      setRequests(prev =>
        prev.map(r =>
          r.id === id
            ? { ...r, answers: [{ username: user, content, timestamp: new Date().toISOString() }, ...r.answers] }
            : r
        )
      );
      setAnswerTexts(prev => ({ ...prev, [id]: '' }));
    } catch {
      alert('Antwort konnte nicht erstellt werden.');
    }
  };

  const now = new Date();
   const upcoming = events
    .map(e => ({ ...e, startDate: new Date(e.start) }))
    .filter(e => e.startDate >= now)
    .sort((a, b) => a.startDate - b.startDate);

  const renderRequest = (req, expanded, toggleFn, showDelete) => (
    <div key={req.id} className="dashboard-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>{req.anliegen}</h3>
        <button onClick={() => toggleFn(req.id)} className="dashboard-btn-toggle">
          {expanded[req.id] ? '▼' : '▶'}
        </button>
      </div>
      {expanded[req.id] && (
        <div className="dashboard-expanded-box">
          <p><strong>Von:</strong> {req.name}</p>
          <p><strong>Telefon:</strong> {req.telefon}</p>
          <p><strong>Straße:</strong> {req.street}</p>
          <p><strong>PLZ:</strong> {req.postcode}</p>
          <p><strong>Ort:</strong> {req.city}</p>
          <p><strong>Wann:</strong> {new Date(req.datumzeit).toLocaleString()}</p>
          <p style={{ marginTop: '10px' }}>{req.beschreibung}</p>
          <p style={{ marginTop: '8px', fontSize: '12px', color: '#999' }}>Erfasst am {new Date(req.timestamp).toLocaleString()}</p>
          <div style={{ marginTop: '12px' }}>
            <h4 style={{ margin: '0 0 8px 0' }}>Antworten:</h4>
            {req.answers.length ? req.answers.map((ans, i) => (
              <div key={i} className="dashboard-answer">
                <p style={{ margin: 0, fontSize: '14px' }}>
                  <strong>{ans.username}</strong>
                  <span style={{ fontSize: '12px', color: '#888', marginLeft: '8px' }}>
                    {new Date(ans.timestamp).toLocaleString()}
                  </span>
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>{ans.content}</p>
              </div>
            )) : <p style={{ fontSize: '14px', color: '#666' }}>Keine Antworten.</p>}
            <textarea
              value={answerTexts[req.id] || ''}
              onChange={e => setAnswerTexts(prev => ({ ...prev, [req.id]: e.target.value }))}
              placeholder="Deine Antwort…"
              rows={2}
              className="dashboard-textarea"
            />
            <button onClick={() => handleSubmitAnswer(req.id)} className="dashboard-btn-primary" style={{ marginTop: '6px' }}>
              Absenden
            </button>
          </div>
          {showDelete && (
            <button
              onClick={() => handleDeleteRequest(req.id)}
              className="dashboard-delete-btn"
            >
              Löschen
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="dashboard-container">
      <Topbar
        title="Meine Startseite"
        actions={[
          {
            label: 'Kalender',
            onClick: () => navigate('/calendar'),
          },
          {
            label: 'Mein Account',
            onClick: () => navigate('/account'),
          },
          {
            label: 'Abmelden',
            onClick: onLogout,
            type: 'danger'
          }
        ]}
      />
      
      <section className="dashboard-section ledger-section">
       <h2>Anstehende Termine</h2>
       {loadingEvents
         ? <p>Lade Termine…</p>
         : upcoming.length > 0
           ? <ul className="ledger-list">
               {upcoming.map(evt => (
                 <li key={evt.id} className="ledger-item">
                   <strong>{evt.title}</strong><br/>
                   {evt.startDate.toLocaleString('de-DE', {
                     dateStyle: 'short',
                     timeStyle: 'short'
                   })}
                 </li>
               ))}
             </ul>
           : <p style={{ color: '#666' }}>Keine anstehenden Termine.</p>
       }
     </section>
      <section className="dashboard-section">
        <h2 style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: 600 }}>Deine Anfragen</h2>
        {loadingReqs
          ? <p>Lade deine Anfragen…</p>
          : (myRequests.length
              ? myRequests.map(req => renderRequest(req, expandedMy, toggleMy, true))
              : <p style={{ color: '#666' }}>Keine offenen Anfragen.</p>
            )
        }
      </section>

      <section className="dashboard-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>Neue Hilfe-Anfrage</h2>
        <button onClick={() => setShowModal(true)} className="dashboard-btn-primary">Anfrage erstellen</button>
      </section>
      <section className="dashboard-section filters-section">
        <h2 style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: 600 }}>Filter</h2>
        <div className="filters">
          <input
            type="text"
            placeholder="Titel"
            value={filterAnliegen}
            onChange={e => setFilterAnliegen(e.target.value)}
            className="filter-input"
          />
          <input
            type="text"
            placeholder="Stadt"
            value={filterCity}
            onChange={e => setFilterCity(e.target.value)}
            className="filter-input"
          />
          <input
            type="text"
            placeholder="Straße"
            value={filterStreet}
            onChange={e => setFilterStreet(e.target.value)}
            className="filter-input"
          />
          <input
            type="text"
            placeholder="PLZ"
            value={filterPostcode}
            onChange={e => setFilterPostcode(e.target.value)}
            className="filter-input"
          />
          <input
            type="date"
            placeholder="Datum"
            value={filterDatumzeit}
            onChange={e => setFilterDatumzeit(e.target.value)}
            className="filter-input"
          />
        </div>
        <button
          onClick={() => {
            
            const others = requests.filter(r => r.username !== user);
            const df = filterDatumzeit;
            const res = others.filter(req => {
              const reqDate = req.datumzeit.slice(0,10);
              return (
                (!filterAnliegen    || req.anliegen.toLowerCase().includes(filterAnliegen.toLowerCase())) &&
                (!filterCity        || req.city.toLowerCase().includes(filterCity.toLowerCase())) &&
                (!filterStreet      || req.street.toLowerCase().includes(filterStreet.toLowerCase())) &&
                (!filterPostcode    || req.postcode.includes(filterPostcode)) &&
                (!df                || reqDate === df)
              );
            });
            setFilteredOthers(res);
          }}
          className="filter-button"
        >
          Filter anwenden
        </button>
      </section>
      <section className="dashboard-section">
        {loadingReqs
          ? <p>Anfragen laden…</p>
          : (filteredOthers.length
              ? filteredOthers.map(req => renderRequest(req, expandedAll, toggleAll, false))
              : <p style={{ color: '#666' }}>Keine Anfragen vorhanden.</p>
            )
        }
      </section>

      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <PostForm onSubmit={() => setShowModal(false)} setRequests={setRequests} requests={requests} user={user} />
        </Modal>
      )}
    </div>
  );
}
