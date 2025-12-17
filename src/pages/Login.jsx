// src/pages/Login.js
import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { Link, useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // After login → go to dashboard
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Invalid email or password.");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f172a",
        color: "white",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          padding: 24,
          borderRadius: 16,
          background: "#020617",
          width: 360,
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: 8 }}>Login</h2>
        <p
          style={{
            textAlign: "center",
            marginBottom: 16,
            fontSize: 13,
            opacity: 0.8,
          }}
        >
          Login to your Stock Dashboard
        </p>

        <form onSubmit={handleLogin}>
          <label style={{ fontSize: 14 }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: 8,
              marginBottom: 12,
              borderRadius: 8,
              border: "1px solid #1e293b",
              background: "#020617",
              color: "white",
            }}
            placeholder="you@example.com"
          />

          <label style={{ fontSize: 14 }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              padding: 8,
              marginBottom: 16,
              borderRadius: 8,
              border: "1px solid #1e293b",
              background: "#020617",
              color: "white",
            }}
            placeholder="Your password"
          />

          {error && (
            <div
              style={{
                background: "#7f1d1d",
                color: "#fecaca",
                padding: 8,
                borderRadius: 8,
                fontSize: 13,
                marginBottom: 12,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 999,
              border: "none",
              background: "#22c55e",
              color: "black",
              fontWeight: 600,
              cursor: "pointer",
              marginBottom: 8,
            }}
          >
            Login
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            fontSize: 13,
            marginTop: 12,
            opacity: 0.8,
          }}
        >
          New user?{" "}
          <Link to="/signup" style={{ color: "#38bdf8" }}>
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
