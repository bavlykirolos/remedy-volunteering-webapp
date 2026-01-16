import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import deLocale from '@fullcalendar/core/locales/de';
import Modal from './Modal';
import './calendar.css';
import Topbar from './Topbar';
import './topbar.css';

function Calendar({ user, onLogout }) {
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    start: '',
    end: '',
    recurring: false,
    recurring_type: 'none'
  });
  const navigate = useNavigate();
  const API = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';

  useEffect(() => {
    document.title = 'Kalender | Remedy';
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch(`${API}/calendar`, { credentials: 'include' });
      if (res.status === 401) return navigate('/');
      const data = await res.json();
      setEvents(expandRecurringEvents(data));
    } catch (err) {
      console.error("Fehler beim Laden der Termine:", err);
    }
  }, [API, navigate]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const expandRecurringEvents = (events) => {
    const expanded = [];
    const now = new Date();
    const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

    events.forEach(event => {
      if (!event.recurring) {
        expanded.push(event);
        return;
      }

      const startDate = new Date(event.start);
      const endDate = event.end ? new Date(event.end) : startDate;
      const duration = endDate.getTime() - startDate.getTime();

      let currentDate = new Date(startDate);
      let instanceCount = 0;
      const maxInstances = 365;
      


      while (currentDate <= oneYearFromNow && instanceCount < maxInstances) {
        const instanceEnd = new Date(currentDate.getTime() + duration);

        expanded.push({
          ...event,
          id: `${event.id}-${instanceCount}`,
          start: currentDate.toISOString(),
          end: instanceEnd.toISOString(),
          title: `${event.title} (wiederkehrend)`
        });

        switch (event.recurring_type) {
          case 'daily':
            currentDate.setDate(currentDate.getDate() + 1);
            break;
          case 'weekly':
            currentDate.setDate(currentDate.getDate() + 7);
            break;
          case 'monthly':
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
          default:
            return;
        }
        instanceCount++;
      }


    });

    return expanded;
  };

  const handleDateClick = (clickInfo) => {
    const date = clickInfo.date; // JS Date
    const isoDate = clickInfo.dateStr; // "YYYY-MM-DD"
    setNewEvent({
      title: '',
      date: isoDate,
      start: "",
      end:   '',
      recurring: false,
      recurring_type: 'none'
    });
   setShowModal(true);
  };

  const handleDateSelect = ( selectInfo ) => {
    const dt = new Date(selectInfo.start);
    const isoDate = selectInfo.startStr.slice(0,10);
    setNewEvent({
      title: '',
      date: isoDate,
      start: '',
      end:   '',
      recurring: false,
      recurring_type: 'none'
    });
    setShowModal(true);
  };

  const handleEventSubmit = async (e) => {
    e.preventDefault();
    if (!newEvent.title.trim()) {
    alert("Bitte geben Sie einen Titel ein.");
    return;
  }
  if (!newEvent.date || !newEvent.start || !newEvent.end) {
    alert("Bitte Datum, Start- und Endzeit ausfüllen.");
    return;
  }
  const startISO = `${newEvent.date}T${newEvent.start}`;
  const endISO   = `${newEvent.date}T${newEvent.end}`;
  const payload = {
    title: newEvent.title,
    start: startISO,
    end:   endISO,
    recurring: newEvent.recurring,
    recurring_type: newEvent.recurring_type

  };
  try {
    const res = await fetch(`${API}/calendar`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)

    });
    if (res.ok) {
      setShowModal(false);
      console.log("Payload being sent:", payload);

      setNewEvent({
        title: '',
        date: '',
        start: '',
        end: '',
        recurring: false,
        recurring_type: 'none'
      });
      fetchEvents();
    } else {
      const error = await res.json();
      alert(error.message);
    }
  } catch (err) {
    console.error("Fehler beim Erstellen des Termins:", err);
    alert("Termin konnte nicht erstellt werden.");
  }
};

  const handleEventClick = (clickInfo) => {
    const evt = clickInfo.event;
    setSelectedEvent({
      id: evt.id.split('-')[0],
      title: evt.title,
      start: evt.startStr,
      end: evt.endStr || evt.startStr
    });
    setShowDetailModal(true);
  };

  const deleteEvent = async (eventId) => {
    try {
      const res = await fetch(`${API}/calendar/${eventId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (res.ok) {
        fetchEvents();
      } else {
        alert("Termin konnte nicht gelöscht werden.");
      }
    } catch (err) {
      console.error("Fehler beim Löschen:", err);
    }
  };

  return (
    <div className="calendar-container">
      <Topbar
        title="Mein Kalender"
        actions={[
          {
            label: 'Meine Startseite',
            onClick: () => navigate('/dashboard'),
          },
          {
            label: 'Mein Account',
            onClick: () => navigate('/account'),
          },
          {
            label: 'Abmelden',
            onClick: () => {
              onLogout();
              navigate('/');
            },
            type: 'danger'
          }
        ]}      
      />  

      <div className="calendar-wrapper">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          locale={deLocale}
          initialView="dayGridMonth"
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          events={events}
          allDaySlot={false}
          select={handleDateSelect}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          height="auto"
          eventTextColor="#fff"
          eventBackgroundColor="#69B8B3"
          buttonText={{
            today: 'Heute',
            month: 'Monat',
            week: 'Woche',
            day: 'Tag'
          }}
        />
      </div>

      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <form onSubmit={handleEventSubmit}>
            <h3 style={{ marginTop: 0, fontSize: '20px' }}>Neuer Termin</h3>

            <div className="calendar-form-section">
              <label>Titel:</label>
              <input
                type="text"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                placeholder="z.B. Medikament einnehmen, Arzttermin"
                required
              />
            </div>

            <div className="calendar-form-section">
              <label>Datum:</label>
              <input
                type="date"
                value={newEvent.date}
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                className="calendar-input"
                required
              />
            </div>

            <div className="calendar-form-section">
              <label>Startzeit:</label>
              <input
                type="time"
                value={newEvent.start}
                onChange={e => setNewEvent({...newEvent, start: e.target.value})}
                required
                className="calendar-input"
              />
            </div>

            <div className="calendar-form-section">
              <label>Endzeit:</label>
              <input
                type="time"
                value={newEvent.end}
                onChange={e => setNewEvent({...newEvent, end: e.target.value})}
                required
                className="calendar-input"
              />
            </div>

            <div className="calendar-form-section calendar-form-checkbox">
              <input
                type="checkbox"
                checked={newEvent.recurring}
                onChange={(e) => {
                  const isChecked = e.target.checked;
                  setNewEvent((prev) => ({
                    ...prev,
                    recurring: isChecked,
                    recurring_type: isChecked ? "daily" : ""  // Set to "daily" when checked, clear when unchecked
                  }));
                }}
              />
              Wiederkehrender Termin
            </div>



            {newEvent.recurring && (
              <div className="calendar-form-section">
                <label>Wiederholung:</label>
                
                <select
                    value={newEvent.recurring_type}
                  onChange={(e) => setNewEvent({ ...newEvent, recurring_type: e.target.value })}
                >
                
                  <option value="daily">Täglich</option>
                  <option value="weekly">Wöchentlich</option>
                  <option value="monthly">Monatlich</option>
                </select>
              </div>
            )}

            <div className="calendar-form-actions">
              <button type="submit" className="calendar-button">
                Termin erstellen
              </button>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="calendar-button danger"
              >
                Abbrechen
              </button>
            </div>
          </form>
        </Modal>
      )}
      {showDetailModal && selectedEvent && (
        <Modal onClose={() => setShowDetailModal(false)}>
          <div className="calendar-detail">
            <h3>{selectedEvent.title}</h3>
            <p>
              <strong>Start:</strong> {new Date(selectedEvent.start).toLocaleString()}<br/>
              <strong>Ende:</strong> {new Date(selectedEvent.end).toLocaleString()}
            </p>
            <p>
              <strong>Dauer:</strong>{' '}
              {(() => {
                const s = new Date(selectedEvent.start);
                const e = new Date(selectedEvent.end);
                const diff = e - s;
                const h = Math.floor(diff / 3600000);
                const m = Math.floor((diff % 3600000) / 60000);
                return `${h} h ${m} min`;
              })()}
            </p>
            <button
              onClick={() => {
                deleteEvent(selectedEvent.id);
                setShowDetailModal(false);
              }}
              className="calendar-button danger"
            >
              Termin löschen
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default Calendar;
