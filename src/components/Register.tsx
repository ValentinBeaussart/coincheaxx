import React, { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabase";
import { Trophy } from "lucide-react";
import Logo from "../assets/icons/ace.svg";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [trigramme, setTrigramme] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!/^[A-Z]{3}$/.test(trigramme)) {
      setError("Le trigramme doit contenir exactement 3 lettres majuscules");
      setLoading(false);
      return;
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("No user data");

      const { error: profileError } = await supabase.from("profiles").insert([
        {
          id: authData.user.id,
          trigramme: trigramme,
        },
      ]);

      if (profileError) {
        throw profileError;
      }
    } catch (error: any) {
      setError(error.message || "Une erreur s'est produite");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0342AF]/10 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-6 sm:p-8">
        <div className="flex items-center justify-center mb-8">
          <img src={Logo} alt="Logo" className="w-11 h-11" />
          <h1 className="text-2xl sm:text-3xl font-bold text-center">
            Axxone Coinche
          </h1>
        </div>

        <h2 className="text-xl sm:text-2xl font-semibold text-center mb-8">
          Inscription
        </h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#0342AF] focus:ring-[#0342AF]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#0342AF] focus:ring-[#0342AF]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Trigramme
              <span className="ml-1 text-xs text-gray-500">
                (3 lettres majuscules)
              </span>
            </label>
            <input
              type="text"
              value={trigramme}
              onChange={(e) => setTrigramme(e.target.value.toUpperCase())}
              maxLength={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#0342AF] focus:ring-[#0342AF]"
              required
              pattern="[A-Z]{3}"
              title="3 lettres majuscules"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0342AF] text-white py-2 px-4 rounded-md hover:bg-[#0342AF]/90 focus:outline-none focus:ring-2 focus:ring-[#0342AF] focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? "Inscription..." : "S'inscrire"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Déjà un compte ?{" "}
          <Link to="/login" className="text-[#0342AF] hover:text-[#0342AF]/80">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
