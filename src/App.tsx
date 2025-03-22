import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import Game from "./components/Game";
import Login from "./components/Login";
import Register from "./components/Register";
import Profile from "./components/Profile";
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import AllPlayers from "./components/AllPlayers";

function App() {
  const { session } = useAuth();

  return (
    <Router>
      <div className="min-h-screen bg-[#0342AF]/10">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/game"
              element={session ? <Game /> : <Navigate to="/login" replace />}
            />
            <Route path="/profile/:trigramme" element={<Profile />} />
            <Route
              path="/profile"
              element={session ? <Profile /> : <Navigate to="/login" replace />}
            />
            <Route path="/joueurs" element={<AllPlayers />} />
            <Route
              path="/login"
              element={!session ? <Login /> : <Navigate to="/" replace />}
            />
            <Route
              path="/register"
              element={!session ? <Register /> : <Navigate to="/" replace />}
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
