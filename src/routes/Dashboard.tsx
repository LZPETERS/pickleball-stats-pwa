import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type FaultKey = "serve" | "return" | "net" | "long" | "setup";

type Faults = {
  serve: number;
  return: number;
  net: number;
  long: number;
  setup: number;
};

type GameRow = {
  id: number;
  played_at: string;
  my_points: number;
  opp_points: number;
  location: string | null;
  serve_faults: number;
  return_faults: number;
  into_net: number;
  too_long: number;
  setup_kill: number;
};

function toPlayedAt(dateStr: string, timeStr: string) {
  const [h = "00", m = "00"] = (timeStr || "").split(":");
  const d = new Date(dateStr);
  d.setHours(Number(h), Number(m), 0, 0);
  return d.toISOString();
}

export default function Dashboard() {
  const now = new Date();
  const [date, setDate] = useState(now.toISOString().slice(0, 10)); // YYYY-MM-DD
  const [time, setTime] = useState(now.toTimeString().slice(0, 5)); // HH:MM

  const [myPoints, setMyPoints] = useState<number>(11);
  const [oppPoints, setOppPoints] = useState<number>(8);
  const [location, setLocation] = useState<string>("");

  const [faults, setFaults] = useState<Faults>({
    serve: 0,
    return: 0,
    net: 0,
    long: 0,
    setup: 0,
  });

  const [editingFault, setEditingFault] = useState<FaultKey | null>(null);

  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [games, setGames] = useState<GameRow[]>([]);
  const [loadingGames, setLoadingGames] = useState(false);

  // Load recent games for the signed-in user
  async function loadGames() {
    setLoadingGames(true);
    setError(null);

    try {
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      if (!user) throw new Error("Not signed in");

      const { data, error: dbErr } = await supabase
        .from("games")
        .select(
          `
          id,
          played_at,
          my_points,
          opp_points,
          location,
          serve_faults,
          return_faults,
          into_net,
          too_long,
          setup_kill
        `
        )
        .eq("user_id", user.id)
        .order("played_at", { ascending: false })
        .limit(25);

      if (dbErr) throw dbErr;

      setGames(data ?? []);
    } catch (e: any) {
      console.error(e);
      setError(e.message ?? "Failed to load games");
    } finally {
      setLoadingGames(false);
    }
  }

  useEffect(() => {
    loadGames();
  }, []);

  async function addGame() {
    setError(null);
    setAdding(true);
    try {
      const {
        data: { user },
        error: authErr,
      } = await supabase.auth.getUser();
      if (authErr) throw authErr;
      if (!user) throw new Error("Not signed in");

      const played_at = toPlayedAt(date, time);

      const { error: dbErr } = await supabase.from("games").insert({
        user_id: user.id,
        played_at,
        my_points: Number(myPoints),
        opp_points: Number(oppPoints),
        location: location?.trim() || null,

        // 🔗 IMPORTANT: map our local keys → your actual DB column names
        serve_faults: faults.serve,
        return_faults: faults.return,
        into_net: faults.net,
        too_long: faults.long,
        setup_kill: faults.setup,
      });

      if (dbErr) throw dbErr;

      // Reset just the faults for the next game
      setFaults({
        serve: 0,
        return: 0,
        net: 0,
        long: 0,
        setup: 0,
      });

      await loadGames();
    } catch (e: any) {
      console.error(e);
      setError(e.message ?? "Failed to add game");
    } finally {
      setAdding(false);
    }
  }

  function openFaultEditor(key: FaultKey) {
    setEditingFault(key);
  }

  function changeFault(key: FaultKey, delta: number) {
    setFaults((prev) => {
      const next = Math.max(0, (prev[key] ?? 0) + delta);
      return { ...prev, [key]: next };
    });
  }

  const editingLabel =
    editingFault === "serve"
      ? "Serve errors"
      : editingFault === "return"
      ? "Return errors"
      : editingFault === "net"
      ? "Net shots"
      : editingFault === "long"
      ? "Long / deep shots"
      : editingFault === "setup"
      ? "Setup / kill shots"
      : "";

  // Helper to display faults per game from DB row
  function rowFaults(g: GameRow): Faults {
    return {
      serve: g.serve_faults ?? 0,
      return: g.return_faults ?? 0,
      net: g.into_net ?? 0,
      long: g.too_long ?? 0,
      setup: g.setup_kill ?? 0,
    };
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">PB Stats</h1>
            <p className="text-sm text-slate-400">
              Track games, faults, and improvement over time
            </p>
          </div>
        </header>

        {/* Error banner */}
        {error && (
          <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
            {error}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* LEFT: New game form */}
          <section className="rounded-2xl bg-slate-900/80 border border-slate-800/80 p-5 space-y-4">
            <h2 className="text-lg font-semibold mb-1">New Game</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wide text-slate-400">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wide text-slate-400">
                  Time
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wide text-slate-400">
                Location
              </label>
              <input
                type="text"
                placeholder="Court, club, etc."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* My points */}
              <div className="rounded-xl bg-slate-900 border border-slate-700 p-3 flex flex-col items-center gap-2">
                <span className="text-xs uppercase tracking-wide text-slate-400">
                  My Points
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMyPoints((p) => Math.max(0, p - 1))}
                    className="h-8 w-8 rounded-full border border-slate-600 flex items-center justify-center text-lg"
                  >
                    –
                  </button>
                  <span className="text-2xl font-semibold">{myPoints}</span>
                  <button
                    type="button"
                    onClick={() => setMyPoints((p) => p + 1)}
                    className="h-8 w-8 rounded-full border border-slate-600 flex items-center justify-center text-lg"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Opponent points */}
              <div className="rounded-xl bg-slate-900 border border-slate-700 p-3 flex flex-col items-center gap-2">
                <span className="text-xs uppercase tracking-wide text-slate-400">
                  Opponent Points
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setOppPoints((p) => Math.max(0, p - 1))}
                    className="h-8 w-8 rounded-full border border-slate-600 flex items-center justify-center text-lg"
                  >
                    –
                  </button>
                  <span className="text-2xl font-semibold">{oppPoints}</span>
                  <button
                    type="button"
                    onClick={() => setOppPoints((p) => p + 1)}
                    className="h-8 w-8 rounded-full border border-slate-600 flex items-center justify-center text-lg"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={adding}
              onClick={addGame}
              className="mt-2 w-full rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-60 px-4 py-2 font-semibold text-white shadow-lg shadow-sky-500/25 transition"
            >
              {adding ? "Saving..." : "Add Game"}
            </button>
          </section>

          {/* RIGHT: faults editor */}
          <section className="rounded-2xl bg-slate-900/80 border border-slate-800/80 p-5 space-y-3">
            <h2 className="text-lg font-semibold mb-1">Faults this game</h2>
            <p className="text-xs text-slate-400 mb-2">
              Tap any box to open a large editor with big + / – buttons.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {/* Serve errors */}
              <button
                type="button"
                onClick={() => openFaultEditor("serve")}
                className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-3 text-left hover:border-sky-500/70 transition"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Serve Errors</span>
                  <span className="text-xl font-semibold">
                    {faults.serve}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Missed or illegal serves
                </p>
              </button>

              {/* Return errors */}
              <button
                type="button"
                onClick={() => openFaultEditor("return")}
                className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-3 text-left hover:border-sky-500/70 transition"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Return Errors</span>
                  <span className="text-xl font-semibold">
                    {faults.return}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Missed or poor returns
                </p>
              </button>

              {/* Net shots */}
              <button
                type="button"
                onClick={() => openFaultEditor("net")}
                className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-3 text-left hover:border-sky-500/70 transition"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Net Shots</span>
                  <span className="text-xl font-semibold">{faults.net}</span>
                </div>
                <p className="text-xs text-slate-400">
                  Balls hit into the net
                </p>
              </button>

              {/* Long shots */}
              <button
                type="button"
                onClick={() => openFaultEditor("long")}
                className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-3 text-left hover:border-sky-500/70 transition"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Long Shots</span>
                  <span className="text-xl font-semibold">{faults.long}</span>
                </div>
                <p className="text-xs text-slate-400">
                  Balls hit long / out
                </p>
              </button>

              {/* Setup / kill shots */}
              <button
                type="button"
                onClick={() => openFaultEditor("setup")}
                className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-3 text-left hover:border-sky-500/70 transition col-span-2"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Setup Kill Shots</span>
                  <span className="text-xl font-semibold">
                    {faults.setup}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Balls that gave opponent an easy put-away
                </p>
              </button>
            </div>
          </section>
        </div>

        {/* Recent games list */}
        <section className="rounded-2xl bg-slate-900/80 border border-slate-800/80 p-5 space-y-3">
          <h2 className="text-lg font-semibold">Recent Games</h2>
          {loadingGames ? (
            <p className="text-sm text-slate-400">Loading games…</p>
          ) : games.length === 0 ? (
            <p className="text-sm text-slate-400">
              No games logged yet. Add your first one above.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-xs uppercase tracking-wide text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2 pr-3 text-left">Date</th>
                    <th className="py-2 px-3 text-center">Score</th>
                    <th className="py-2 px-3 text-center">Serve</th>
                    <th className="py-2 px-3 text-center">Return</th>
                    <th className="py-2 px-3 text-center">Net</th>
                    <th className="py-2 px-3 text-center">Long</th>
                    <th className="py-2 px-3 text-center">Setup</th>
                    <th className="py-2 pl-3 text-left">Location</th>
                  </tr>
                </thead>
                <tbody>
                  {games.map((g) => {
                    const f = rowFaults(g);
                    const d = new Date(g.played_at);
                    return (
                      <tr
                        key={g.id}
                        className="border-b border-slate-850/40 last:border-0"
                      >
                        <td className="py-1.5 pr-3 whitespace-nowrap text-slate-200">
                          {d.toLocaleDateString()}{" "}
                          <span className="text-slate-500 text-xs">
                            {d.toLocaleTimeString([], {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </span>
                        </td>
                        <td className="py-1.5 px-3 text-center">
                          {g.my_points}–{g.opp_points}
                        </td>
                        <td className="py-1.5 px-3 text-center">{f.serve}</td>
                        <td className="py-1.5 px-3 text-center">{f.return}</td>
                        <td className="py-1.5 px-3 text-center">{f.net}</td>
                        <td className="py-1.5 px-3 text-center">{f.long}</td>
                        <td className="py-1.5 px-3 text-center">{f.setup}</td>
                        <td className="py-1.5 pl-3 text-slate-300">
                          {g.location ?? "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Full-screen fault editor modal */}
      {editingFault && (
        <div className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 px-5 py-6 text-center shadow-2xl">
            <h3 className="text-lg font-semibold mb-2">{editingLabel}</h3>
            <p className="text-xs text-slate-400 mb-4">
              Tap + / – or swipe the number spinner.
            </p>
            <div className="flex items-center justify-center gap-4 mb-5">
              <button
                type="button"
                onClick={() => changeFault(editingFault, -1)}
                className="h-12 w-12 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-2xl"
              >
                –
              </button>
              <div className="text-5xl font-semibold tabular-nums">
                {faults[editingFault]}
              </div>
              <button
                type="button"
                onClick={() => changeFault(editingFault, +1)}
                className="h-12 w-12 rounded-full bg-sky-500 hover:bg-sky-400 flex items-center justify-center text-2xl text-white shadow-lg shadow-sky-500/40"
              >
                +
              </button>
            </div>
            <button
              type="button"
              onClick={() => setEditingFault(null)}
              className="mt-1 inline-flex items-center justify-center rounded-xl border border-slate-600 px-4 py-2 text-sm text-slate-100 hover:bg-slate-800"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
