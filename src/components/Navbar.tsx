import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Trophy,
  Home,
  LogOut,
  User,
  PlayCircle,
  PieChart,
  Menu,
  X,
  Users,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../supabase";
import Logo from "../assets/icons/ace.svg";

export default function Navbar() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
    setIsMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <img src={Logo} alt="Logo" className="w-11 h-11" />
            <span className="ml-2 text-xl font-bold hidden sm:block">
              AxeoCOINCHE
            </span>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-[#0342AF]"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Desktop menu */}
          <div className="hidden sm:flex items-center space-x-4">
            {session ? (
              <>
                <Link
                  to="/"
                  className="flex items-center px-3 py-2 text-gray-700 hover:text-[#0342AF]"
                >
                  <Home className="h-5 w-5 mr-1" />
                  Accueil
                </Link>
                {/* <Link
                  to="/game"
                  className="flex items-center px-3 py-2 text-gray-700 hover:text-[#0342AF]"
                >
                  <PlayCircle className="h-5 w-5 mr-1" />
                  Nouvelle Partie
                </Link> */}
                <Link
                  to="/joueurs"
                  className="flex items-center px-3 py-2 text-gray-700 hover:text-[#0342AF]"
                >
                  <Users className="h-5 w-5 mr-1" />
                  Les Coincheurs
                </Link>
                <Link
                  to="/stats"
                  className="flex items-center px-3 py-2 text-gray-700 hover:text-[#0342AF]"
                >
                  <PieChart className="h-5 w-5 mr-1" />
                  Statistiques
                </Link>
                <Link
                  to="/profile"
                  className="flex items-center px-3 py-2 text-gray-700 hover:text-[#0342AF]"
                >
                  <User className="h-5 w-5 mr-1" />
                  Profil
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center px-3 py-2 text-red-600 hover:text-red-700"
                >
                  <LogOut className="h-5 w-5 mr-1" />
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/"
                  className="flex items-center px-2 py-4 text-gray-700 hover:text-[#0342AF]"
                >
                  <Home className="h-5 w-5 mr-1" />
                  Accueil
                </Link>
                <Link
                  to="/joueurs"
                  className="flex items-center px-3 py-2 text-gray-700 hover:text-[#0342AF]"
                >
                  <Users className="h-5 w-5 mr-1" />
                  Les Coincheurs
                </Link>
                <Link
                  to="/stats"
                  className="flex items-center px-3 py-2 text-gray-700 hover:text-[#0342AF]"
                >
                  <PieChart className="h-5 w-5 mr-1" />
                  Statistiques
                </Link>
                <Link
                  to="/login"
                  className="flex items-center px-3 py-2 text-gray-700 hover:text-[#0342AF]"
                >
                  Connexion
                </Link>
                {/* <Link
                  to="/register"
                  className="flex items-center px-4 py-2 bg-[#0342AF] text-white rounded-md hover:bg-[#0342AF]/90"
                >
                  Inscription
                </Link> */}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden bg-white border-t">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {session ? (
              <>
                <Link
                  to="/"
                  className="block px-3 py-2 text-gray-700 hover:text-[#0342AF]"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <Home className="h-5 w-5 mr-2" />
                    Accueil
                  </div>
                </Link>
                {/* <Link
                  to="/game"
                  className="block px-3 py-2 text-gray-700 hover:text-[#0342AF]"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <PlayCircle className="h-5 w-5 mr-2" />
                    Nouvelle Partie
                  </div>
                </Link> */}
                <Link
                  to="/joueurs"
                  className="flex items-center px-3 py-2 text-gray-700 hover:text-[#0342AF]"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Users className="h-5 w-5 mr-1" />
                  Les Coincheurs
                </Link>
                <Link
                  to="/stats"
                  className="flex items-center px-3 py-2 text-gray-700 hover:text-[#0342AF]"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <PieChart className="h-5 w-5 mr-1" />
                  Statistiques
                </Link>
                <Link
                  to="/profile"
                  className="block px-3 py-2 text-gray-700 hover:text-[#0342AF]"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Profil
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 text-red-600 hover:text-red-700"
                >
                  <div className="flex items-center">
                    <LogOut className="h-5 w-5 mr-2" />
                    Déconnexion
                  </div>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/"
                  className="flex items-center px-3 py-2 text-gray-700 hover:text-[#0342AF]"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Home className="h-5 w-5 mr-1" />
                  Accueil
                </Link>
                <Link
                  to="/joueurs"
                  className="flex items-center px-3 py-2 text-gray-700 hover:text-[#0342AF]"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Users className="h-5 w-5 mr-1" />
                  Les Coincheurs
                </Link>
                <Link
                  to="/stats"
                  className="flex items-center px-3 py-2 text-gray-700 hover:text-[#0342AF]"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <PieChart className="h-5 w-5 mr-1" />
                  Statistiques
                </Link>
                <Link
                  to="/login"
                  className="block px-3 py-2 text-gray-700 hover:text-[#0342AF]"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Connexion
                </Link>
                {/* <Link
                  to="/register"
                  className="flex items-center px-4 py-2 bg-[#0342AF] text-white rounded-md hover:bg-[#0342AF]/90"
                >
                  Inscription
                </Link> */}
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
