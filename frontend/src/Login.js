import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./App.css";

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const navigate = useNavigate();
  const API = process.env.REACT_APP_API_URL || "http://127.0.0.1:5000";

  useEffect(() => {
    document.title = "Anmelden | Remedy";
  }, []);

  // Fake progress bar while backend wakes up
  useEffect(() => {
    if (!loading) return;

    setProgress(10);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [loading]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API}/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setProgress(100);
        onLogin(data.user);
        navigate("/dashboard");
      } else {
        alert(data.message);
        setLoading(false);
        setProgress(0);
      }
    } catch (err) {
      alert("Server is waking up. Please try again.");
      setLoading(false);
      setProgress(0);
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
          disabled={loading}
        />

        <input
          className="form-input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          disabled={loading}
        />

        <button
          className="form-button"
          type="submit"
          disabled={loading}
        >
          {loading ? "Loading, This might take a minute..." : "Login"}
        </button>

        {loading && (
          <div className="progress-wrapper">
            <div
              className="progress-bar"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </form>

      <p className="register-link">
        Noch keinen Account?{" "}
        <Link to="/register">Hier einen Account erstellen</Link>
      </p>
    </div>
  );
}

export default Login;
