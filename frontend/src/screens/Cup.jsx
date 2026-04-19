import React, { useState } from "react";
import { useGame } from "../lib/gameContext";
import { CUP_ROUND_NAMES, getUserCupMatch } from "../lib/tournaments";
import { simulateMatch } from "../lib/gameEngine";
import { Trophy, Play } from "lucide-react";

function BracketMatch({ home, away, result, isUser }) {
  return (
    <div
      className={`flex items-center justify-between p-3 rounded border ${
        isUser ? "border-[#00E676]/60 bg-[#00E676]/10" : "border-white/10 bg-white/[0.02]"
      }`}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-lg">{home?.logo}</span>
        <span className={`truncate text-sm ${result && result.homeGoals > result.awayGoals ? "font-bold" : ""}`}>
          {home?.short}
        </span>
      </div>
      <div className="font-mono font-bold px-2" style={{ color: result ? "#00E676" : "#555" }}>
        {result ? `${result.homeGoals}-${result.awayGoals}` : "vs"}
      </div>
      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
        <span className={`truncate text-sm text-right ${result && result.awayGoals > result.homeGoals ? "font-bold" : ""}`}>
          {away?.short}
        </span>
        <span className="text-lg">{away?.logo}</span>
      </div>
    </div>
  );
}

export default function Cup({ type = "cup" }) {
  const { state, playCupRoundAction, playEuropeRoundAction } = useGame();
  const bracket = type === "cup" ? state.cup : state.europe;
  const playAction = type === "cup" ? playCupRoundAction : playEuropeRoundAction;
  const [simulating, setSimulating] = useState(false);

  if (!bracket) return <div>Yüklənir...</div>;

  const userMatch = getUserCupMatch(bracket, state.teamId);
  const teamById = Object.fromEntries(state.teams.map((t) => [t.id, t]));

  const playCurrentRound = async () => {
    setSimulating(true);
    // If user has a match, simulate it; otherwise just auto-play
    let userResult = null;
    if (userMatch) {
      const h = teamById[userMatch.home];
      const a = teamById[userMatch.away];
      userResult = simulateMatch(h, a);
      // Force winner on draw (penalty simulation inside playCupRound)
    }
    playAction(userResult);
    setTimeout(() => setSimulating(false), 500);
  };

  return (
    <div className="space-y-6">
      <div className="fade-in-up">
        <div className="label-tiny" style={{ color: "#FFD700" }}>TURNIR</div>
        <h1 className="font-heading text-4xl">{bracket.name}</h1>
        <div className="text-sm mt-1" style={{ color: "#A0A0A0" }}>
          Sezon {state.season} ·{" "}
          {bracket.winnerId
            ? `Qalib: ${teamById[bracket.winnerId]?.name}`
            : `Cari mərhələ: ${CUP_ROUND_NAMES[bracket.currentRound] || "Final"}`}
        </div>
      </div>

      {bracket.winnerId ? (
        <div className="glass rounded-md p-10 text-center">
          <Trophy size={60} style={{ color: "#FFD700" }} className="mx-auto mb-4" />
          <div className="label-tiny">ÇEMPION</div>
          <div className="text-7xl mt-3">{teamById[bracket.winnerId]?.logo}</div>
          <h2 className="font-heading text-4xl mt-3">{teamById[bracket.winnerId]?.name}</h2>
          {bracket.winnerId === state.teamId && (
            <div className="mt-4 badge" style={{ background: "#FFD700", color: "#000" }}>
              SIZ QAZANDINIZ! +€{type === "cup" ? "5M" : "20M"}
            </div>
          )}
        </div>
      ) : (
        <div className="flex justify-center">
          <button
            data-testid={`play-${type}-round-btn`}
            onClick={playCurrentRound}
            disabled={simulating}
            className="btn-primary flex items-center gap-2"
          >
            <Play size={18} /> {userMatch ? "Öz Matçını + Bütün Mərhələni Oyna" : "Mərhələni Simulyasiya Et"}
          </button>
        </div>
      )}

      {/* Bracket Display */}
      <div className="space-y-6">
        {bracket.rounds.map((round, rIdx) => (
          <div key={rIdx}>
            <div className="label-tiny mb-2">{CUP_ROUND_NAMES[rIdx] || `Mərhələ ${rIdx + 1}`}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
              {round.map((m, i) => {
                const r = bracket.results[rIdx]?.[i];
                const isUser = m.home === state.teamId || m.away === state.teamId;
                return (
                  <BracketMatch
                    key={i}
                    home={teamById[m.home]}
                    away={teamById[m.away]}
                    result={r}
                    isUser={isUser}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Trophies earned */}
      {state.trophies && state.trophies.length > 0 && (
        <div className="surface rounded-md p-5">
          <div className="label-tiny mb-3">Sizin Kuboklarınız</div>
          <div className="flex flex-wrap gap-2">
            {state.trophies.map((t, i) => (
              <div key={i} className="badge" style={{ background: "rgba(255,215,0,0.15)", color: "#FFD700" }}>
                <Trophy size={10} /> {t.title} · S{t.season}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
