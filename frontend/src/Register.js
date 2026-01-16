import { useState } from "react";
import { useNavigate } from "react-router-dom";
import './App.css';


function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const navigate = useNavigate();

  const API = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${API}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          first_name: firstName,
          last_name: lastName,
          age: Number(age),
          gender
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Account erstellt! Du kannst dich jetzt einloggen.");
        navigate("/"); 
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error("Fehler beim Registrieren:", err);
      alert("Registrierung fehlgeschlagen – bitte Konsole prüfen.");
    }
  };

  return (
  <div className="login-container">
    <form className="login-form" onSubmit={handleRegister}>
      <h2 className="form-title">Registrieren</h2>
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
      <label htmlFor="username" className="form-label">Benutzername</label>
      <input
        className="form-input"
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="z.B. leo"
        required
      />

      <label htmlFor="age" className="form-label">Alter</label>
      <input
        id="age"
        className="form-input"
        type="number"
        min="0"
        value={age}
        onChange={e => setAge(e.target.value)}
        placeholder="z.B. 29"
        required
      />
 
      <label htmlFor="gender" className="form-label">Geschlecht</label>
      <select
        id="gender"
        className="form-input"
        value={gender}
        onChange={e => setGender(e.target.value)}
        required
      >
        <option value="">Bitte wählen</option>
        <option value="männlich">Männlich</option>
        <option value="weiblich">Weiblich</option>
        <option value="divers">Divers</option>
      </select>
      <label htmlFor="password" className="form-label">Passwort</label>
      <input
        className="form-input"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Passwort"
        required
      />

      <button className="form-button" type="submit">
        Account erstellen
      </button>
    </form>

    <p className="register-link">
      Bereits registriert?{" "}
      <button
        onClick={() => navigate("/")}
        className="link-button"
      >
        Hier einloggen
      </button>
    </p>
  </div>
);
}

export default Register;