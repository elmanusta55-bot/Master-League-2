import React, { useMemo } from "react";
import { useGame } from "../lib/gameContext";
import { FORMATIONS } from "../data/teams";

const POS_COLOR = {
  GK: "#FFD700",
  DEF: "#007AFF",
  MID: "#00E676",
  FWD: "#FF3B30",
};

function PlayerDot({ player, slot, onClick }) {
  return (
    <button
      data-testid={`pitch-player-${player.id}`}
      onClick={onClick}
      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
      style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
    >
      <div
        className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 flex items-center justify-center text-xs font-bold shadow-lg"
        style={{
          background: "#0A0A0A",
          borderColor: POS_COLOR[player.pos],
          color: POS_COLOR[player.pos],
        }}
      >
        {player.overall}
      </div>
      <div className="mt-1 text-[10px] font-semibold text-white bg-black/70 px-2 py-0.5 rounded whitespace-nowrap max-w-[100px] truncate">
        {player.name.split(" ").slice(-1)[0]}
      </div>
    </button>
  );
}

export default function Squad() {
  const { state, updateFormation, setStarters } = useGame();
  const myTeam = state.teams.find((t) => t.id === state.teamId);
  const formation = FORMATIONS[state.formation];

  const starters = myTeam.players.filter((p) => p.starter);
  const bench = myTeam.players.filter((p) => !p.starter);

  // Map players to slots by role greedy
  const slotPlayers = useMemo(() => {
    const remaining = [...starters];
    return formation.positions.map((slot) => {
      // Prefer same role
      let idx = remaining.findIndex((p) => p.pos === slot.role);
      if (idx === -1) idx = 0;
      return remaining.splice(idx, 1)[0];
    }).filter(Boolean);
  }, [formation, starters]);

  const swapPlayer = (pitchPlayerId) => {
    const benchName = window.prompt("Əvəz etmək üçün yedək oyunçu ID/adını daxil edin:");
    if (!benchName) return;
    const benchPlayer = bench.find((p) => p.name.toLowerCase().includes(benchName.toLowerCase()));
    if (!benchPlayer) return;
    const newStarterIds = [...starters.filter((p) => p.id !== pitchPlayerId).map((p) => p.id), benchPlayer.id];
    setStarters(myTeam.id, newStarterIds);
  };

  const togglePlayer = (playerId) => {
    const p = myTeam.players.find((x) => x.id === playerId);
    if (!p) return;
    let newStarters;
    if (p.starter) {
      newStarters = starters.filter((x) => x.id !== playerId).map((x) => x.id);
    } else {
      if (starters.length >= 11) {
        alert("11 oyunçu artıq seçilib. Əvvəlcə birini çıxarın.");
        return;
      }
      newStarters = [...starters.map((x) => x.id), playerId];
    }
    setStarters(myTeam.id, newStarters);
  };

  return (
    <div className="space-y-6">
      <div className="fade-in-up">
        <div className="label-tiny" style={{ color: "#00E676" }}>HEYƏT & TAKTIKA</div>
        <h1 className="font-heading text-4xl">{myTeam.name}</h1>
        <div className="text-sm mt-1" style={{ color: "#A0A0A0" }}>
          Formasiya: <span className="text-white font-semibold">{state.formation}</span> · Başlanğıc: {starters.length}/11
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Pitch */}
        <div className="lg:col-span-7">
          <div className="surface rounded-md p-4 md:p-6">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <div className="label-tiny mr-2">Formasiya</div>
              {Object.keys(FORMATIONS).map((f) => (
                <button
                  key={f}
                  data-testid={`formation-${f}`}
                  onClick={() => updateFormation(f)}
                  className={`text-xs px-3 py-1.5 rounded border font-semibold ${
                    state.formation === f
                      ? "bg-[#00E676] text-black border-[#00E676]"
                      : "bg-transparent border-white/20 text-white hover:border-white"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="pitch-bg rounded aspect-[3/4] relative overflow-hidden">
              {slotPlayers.map((p, i) => (
                <PlayerDot key={p.id} player={p} slot={formation.positions[i]} onClick={() => togglePlayer(p.id)} />
              ))}
            </div>
            <div className="flex gap-4 mt-3 text-xs" style={{ color: "#A0A0A0" }}>
              {Object.entries(POS_COLOR).map(([k, c]) => (
                <div key={k} className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: c }} /> {k}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bench & Players List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="surface rounded-md p-4">
            <div className="label-tiny mb-3">Bütün Heyət ({myTeam.players.length})</div>
            <div className="space-y-1 max-h-[550px] overflow-y-auto">
              {myTeam.players
                .slice()
                .sort((a, b) => b.overall - a.overall)
                .map((p) => (
                  <button
                    key={p.id}
                    data-testid={`squad-row-${p.id}`}
                    onClick={() => togglePlayer(p.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded text-left transition-colors ${
                      p.starter ? "bg-[#00E676]/10 border border-[#00E676]/40" : "bg-white/[0.02] border border-white/5 hover:bg-white/5"
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded flex items-center justify-center font-mono text-sm font-bold"
                      style={{ background: POS_COLOR[p.pos] + "20", color: POS_COLOR[p.pos], border: `1px solid ${POS_COLOR[p.pos]}60` }}
                    >
                      {p.overall}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{p.name}</div>
                      <div className="text-xs" style={{ color: "#A0A0A0" }}>
                        {p.pos} · {p.age}y · ⚡{p.energy}
                      </div>
                    </div>
                    <div className="text-xs font-heading tracking-wider" style={{ color: p.starter ? "#00E676" : "#555" }}>
                      {p.starter ? "BAŞLA" : "EHT"}
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
