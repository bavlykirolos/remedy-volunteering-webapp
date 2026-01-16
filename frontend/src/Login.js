import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import './App.css';


function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const API = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';

  useEffect(() => {
    document.title = 'Anmelden | Remedy';
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    const res = await fetch(`${API}/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (res.ok) {
      onLogin(data.user);
      navigate("/dashboard");
    } else {
      alert(data.message);
    }
  };

  return (
  <div className="login-container">
    <form className="login-form" onSubmit={handleLogin}>
      <img
        src="/Logo.png"
        alt="Remedy Logo"
        className="login-logo"
      />
      <h2 className="form-title">Login</h2>

      <input
        className="form-input"
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
        required
      />

      <input
        className="form-input"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />

      <button className="form-button" type="submit">
        Login
      </button>
    </form>

    <p className="register-link">
      Noch keinen Account?{" "}
      <Link to="/register">
        Hier einen Account erstellen
      </Link>
    </p>
  </div>
);
}

export default Login;