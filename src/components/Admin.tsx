import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";

interface Game {
  id?: string;
  score_nous: number;
  score_eux: number;
  winning_team_player1_id: string;
  winning_team_player2_id: string;
  losing_team_player1_id: string;
  losing_team_player2_id: string;
}

interface PlayerMap {
  [id: string]: string;
}

interface PlayerOption {
  id: string;
  trigramme: string;
}

export default function AdminGameEditor() {
  const { session } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [playerMap, setPlayerMap] = useState<PlayerMap>({});
  const [playerOptions, setPlayerOptions] = useState<PlayerOption[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 10;

  const [newGame, setNewGame] = useState<Game>({
    score_nous: 0,
    score_eux: 0,
    winning_team_player2_id: "",
    losing_team_player1_id: "",
    losing_team_player2_id: "",
  });
  const isAdmin =
    session?.user &&
    ["valentin.beaussart@gmail.com", "marc-etienne.barrut@axxone.fr"].includes(
      session.user.user_metadata.trigramme
    );

  useEffect(() => {
    fetchGames();
    fetchPlayerMap();
  }, [page]);

  async function fetchGames() {
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from("games")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      toast.error("Erreur lors du chargement des parties");
      return;
    }

    setGames((prev) => (page === 1 ? data : [...prev, ...data]));
    if (data.length < PAGE_SIZE) setHasMore(false);
  }

  async function fetchPlayerMap() {
    const { data } = await supabase.from("profiles").select("id, trigramme");
    if (data) {
      const map: PlayerMap = {};
      setPlayerOptions(data);
      data.forEach((p) => {
        map[p.id] = p.trigramme;
      });
      setPlayerMap(map);
    }
  }

  async function updateStats() {
    const { data: profiles } = await supabase.from("profiles").select("id");
    if (!profiles) return;

    for (const profile of profiles) {
      const { data: games } = await supabase
        .from("games")
        .select("*")
        .or(
          `winning_team_player1_id.eq.${profile.id},winning_team_player2_id.eq.${profile.id},losing_team_player1_id.eq.${profile.id},losing_team_player2_id.eq.${profile.id}`
        );

      if (!games) continue;

      let games_played = 0;
      let games_won = 0;
      let games_lost = 0;

      games.forEach((game) => {
        const isWinner =
          game.winning_team_player1_id === profile.id ||
          game.winning_team_player2_id === profile.id;
        const isLoser =
          game.losing_team_player1_id === profile.id ||
          game.losing_team_player2_id === profile.id;

        if (isWinner || isLoser) {
          games_played++;
          if (isWinner) games_won++;
          if (isLoser) games_lost++;
        }
      });

      const win_percentage =
        games_played > 0 ? (games_won / games_played) * 100 : 0;

      await supabase
        .from("profiles")
        .update({
          games_played,
          games_won,
          games_lost,
          win_percentage,
        })
        .eq("id", profile.id);
    }
  }

  function hasDuplicatePlayers(game: Game): boolean {
    const all = [
      game.winning_team_player1_id,
      game.winning_team_player2_id,
      game.losing_team_player1_id,
      game.losing_team_player2_id,
    ];
    return new Set(all).size !== all.length;
  }

  async function handleCreateGame() {
    if (hasDuplicatePlayers(newGame))
      return toast.error("Un joueur ne peut apparaître qu'une seule fois.");
    const { data: user } = await supabase.auth.getUser();
    const { error } = await supabase.from("games").insert([
      {
        ...newGame,
        player_id: user?.id,
      },
    ]);
    if (!error) {
      toast.success("Partie ajoutée");
      resetForm();
      setPage(1);
      fetchGames();
      updateStats();
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Êtes-vous sûr de vouloir supprimer cette partie ?"
    );
    if (!confirmed) return;
    const { error } = await supabase.from("games").delete().eq("id", id);
    if (!error) {
      toast.success("Partie supprimée");
      setGames((prev) => prev.filter((g) => g.id !== id));
      updateStats();
      resetForm();
    }
  }

  async function handleEdit(id: string) {
    const gameToEdit = games.find((g) => g.id === id);
    if (gameToEdit) {
      setNewGame({ ...gameToEdit });
      setEditId(id);
    }
  }

  async function handleUpdateGame() {
    if (!editId) return;
    if (hasDuplicatePlayers(newGame))
      return toast.error("Un joueur ne peut apparaître qu'une seule fois.");
    const { error } = await supabase
      .from("games")
      .update(newGame)
      .eq("id", editId);
    if (!error) {
      toast.success("Partie mise à jour");
      resetForm();
      setPage(1);
      fetchGames();
      updateStats();
    }
  }

  function resetForm() {
    setNewGame({
      score_nous: 0,
      score_eux: 0,
      winning_team_player1_id: "",
      winning_team_player2_id: "",
      losing_team_player1_id: "",
      losing_team_player2_id: "",
    });
    setEditId(null);
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-10 text-red-600 font-semibold">
        Accès refusé
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Admin - Gérer les parties
      </h1>

      <div className="bg-white p-6 rounded shadow mb-10">
        <h2 className="text-lg font-semibold mb-4">
          {editId ? "Modifier une partie" : "Créer une partie"}
        </h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <input
            type="number"
            placeholder="Score équipe gagnante"
            className="border p-2 rounded"
            value={newGame.score_nous}
            onChange={(e) =>
              setNewGame({ ...newGame, score_nous: +e.target.value })
            }
          />
          <input
            type="number"
            placeholder="Score équipe perdante"
            className="border p-2 rounded"
            value={newGame.score_eux}
            onChange={(e) =>
              setNewGame({ ...newGame, score_eux: +e.target.value })
            }
          />

          {["winning_team_player1_id", "winning_team_player2_id"].map(
            (key, i) => (
              <select
                key={key}
                className="border p-2 rounded"
                value={newGame[key as keyof Game]}
                onChange={(e) =>
                  setNewGame({ ...newGame, [key]: e.target.value })
                }
              >
                <option value="">-- Gagnant {i + 1} --</option>
                {playerOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.trigramme}
                  </option>
                ))}
              </select>
            )
          )}

          {["losing_team_player1_id", "losing_team_player2_id"].map(
            (key, i) => (
              <select
                key={key}
                className="border p-2 rounded"
                value={newGame[key as keyof Game]}
                onChange={(e) =>
                  setNewGame({ ...newGame, [key]: e.target.value })
                }
              >
                <option value="">-- Perdant {i + 1} --</option>
                {playerOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.trigramme}
                  </option>
                ))}
              </select>
            )
          )}
        </div>
        <div className="flex gap-4 items-center">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={editId ? handleUpdateGame : handleCreateGame}
          >
            {editId ? "Mettre à jour" : "Ajouter la partie"}
          </button>
          {editId && (
            <button
              className="text-gray-600 hover:underline text-sm"
              onClick={resetForm}
            >
              Annuler l'édition
            </button>
          )}
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4">Parties existantes</h2>
      <div className="space-y-4">
        {games.map((game) => (
          <div
            key={game.id}
            className="bg-gray-100 p-4 rounded shadow flex justify-between items-center"
          >
            <div>
              <p className="text-sm font-semibold mb-1">
                {playerMap[game.winning_team_player1_id]} &{" "}
                {playerMap[game.winning_team_player2_id]} vs{" "}
                {playerMap[game.losing_team_player1_id]} &{" "}
                {playerMap[game.losing_team_player2_id]}
              </p>
              <p className="text-sm text-gray-600">
                Score : {game.score_nous} - {game.score_eux}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleEdit(game.id!)}
                className="text-blue-600 hover:underline text-sm"
              >
                Modifier
              </button>
              <button
                onClick={() => handleDelete(game.id!)}
                className="text-red-600 hover:underline text-sm"
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}
        {hasMore && (
          <div className="text-center mt-4">
            <button
              onClick={() => setPage((prev) => prev + 1)}
              className="text-blue-600 font-medium hover:underline"
            >
              Charger plus
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
