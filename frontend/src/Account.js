import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import './App.css';
import Topbar from './Topbar';
import './topbar.css';

function Account({ user, onLogout }) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');

  const navigate = useNavigate();

  const API = process.env.REACT_APP_API_URL || "http://127.0.0.1:5000";

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API}/user`, {
          method: "GET",
          credentials: "include",
        });
        if (res.status === 401) {
          navigate("/");
          return;
        }
        const data = await res.json();
        if (data.email) setEmail(data.email);
        if (data.first_name) setFirstName(data.first_name);
        if (data.last_name)  setLastName(data.last_name);
        if (data.age !== undefined) setAge(data.age);
        if (data.gender) setGender(data.gender);
        setLoading(false);
      } catch (err) {
        console.error("Fehler beim Laden des Profils:", err);
        alert("Konnte Profil nicht laden.");
      }
    };
    fetchProfile();
  }, [API, navigate]);

  useEffect(() => {
    document.title = "Mein Account | Remedy";
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {};
      if (email) payload.email = email;
      if (firstName)  payload.first_name = firstName;
      if (lastName)   payload.last_name = lastName;
      if (password) payload.password = password;
      if (age) payload.age = age;
      if (gender) payload.gender = gender;

      const res = await fetch(`${API}/user`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      const data = await res.json();
      alert(data.message); 

      if (password) {
        onLogout();
        navigate("/"); 
      }
    } catch (err) {
      console.error("Fehler beim Speichern des Profils:", err);
      alert("Profil konnte nicht gespeichert werden: " + err.message);
    }
  };

  if (loading) return <p style={{ textAlign: 'center' }}>Lade Profil…</p>;

  return (

      <div className="account-container">
      <Topbar
        title="Mein Account"
        actions={[
          {
            label: 'Meine Startseite',
            onClick: () => navigate('/dashboard'),
          },
          { 
            label: 'Kalender',
            onClick: () => navigate('/calendar'),
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

    <div className="login-container">
      <form className="login-form" onSubmit={handleSave}>
        <h2 className="form-title">Mein Account</h2>

        <input
          className="form-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />

        <label htmlFor="firstName" className="form-label">Vorname</label>
        <input
          id="firstName"
          className="form-input"
          type="text"
          value={firstName}
          onChange={e => setFirstName(e.target.value)}
          placeholder="z.B. Max"
          required
        />

        {/* Nachname */}
        <label htmlFor="lastName" className="form-label">Nachname</label>
        <input
          id="lastName"
          className="form-input"
          type="text"
          value={lastName}
          onChange={e => setLastName(e.target.value)}
          placeholder="z.B. Mustermann"
          required
        />

        <label htmlFor="age" className="form-label">Alter</label>
        <input
          id="age"
          type="number"
          min="0"
          className="form-input"
          value={age}
          onChange={e => setAge(e.target.value)}
          placeholder="z.B. 29"
        />
        <label htmlFor="gender" className="form-label">Geschlecht</label>
        <select
          id="gender"
          className="form-input"
          value={gender}
          onChange={e => setGender(e.target.value)}
        >
          <option value="">Bitte wählen</option>
          <option value="männlich">Männlich</option>
          <option value="weiblich">Weiblich</option>
          <option value="divers">Divers</option>
        </select>
        <input
          className="form-input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Neues Passwort (leer lassen, wenn nicht ändern)"
        />

        <button className="form-button" type="submit">
          Änderungen speichern
        </button>

        <button
          type="button"
          onClick={() => {
            onLogout();
            navigate("/");
          }}
          className="link-button"
          style={{ marginTop: "1rem" }}
        >
          Abmelden
        </button>
      </form>
    </div>
    </div>
  );
}

export default Account;
