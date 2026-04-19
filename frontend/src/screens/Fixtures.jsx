import React from "react";
import { useGame } from "../lib/gameContext";

export default function Fixtures() {
  const { state } = useGame();
  return (
    <div className="space-y-6">
      <div className="fade-in-up">
        <div className="label-tiny" style={{ color: "#00E676" }}>TƏQVIM</div>
        <h1 className="font-heading text-4xl">Bütün Matçlar</h1>
        <div className="text-sm mt-1" style={{ color: "#A0A0A0" }}>Sezon {state.season}</div>
      </div>

      <div className="space-y-3">
        {state.fixtures.map((round, idx) => {
          const played = idx < state.currentWeek;
          const current = idx === state.currentWeek;
          return (
            <div
              key={idx}
              data-testid={`fixture-week-${idx + 1}`}
              className={`surface rounded-md p-4 ${current ? "border-[#00E676]/50 bg-[#00E676]/5" : ""}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="label-tiny">Həftə {idx + 1}</div>
                {current && <span className="badge" style={{ background: "#00E676", color: "#000" }}>İNDI</span>}
                {played && <span className="label-tiny" style={{ color: "#00E676" }}>OYNANIB</span>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {round.map((m, j) => {
                  const h = state.teams.find((t) => t.id === m.home);
                  const a = state.teams.find((t) => t.id === m.away);
                  const isUser = m.home === state.teamId || m.away === state.teamId;
                  const pastResult = played ? state.results.find((r) => r.homeId === m.home && r.awayId === m.away && r.week === idx + 1) : null;
                  return (
                    <div
                      key={j}
                      className={`flex items-center justify-between px-3 py-2 rounded border text-sm ${
                        isUser ? "border-[#00E676]/40 bg-[#00E676]/5" : "border-white/5 bg-white/[0.02]"
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-base">{h.logo}</span>
                        <span className={m.home === state.teamId ? "font-bold" : ""}>{h.short}</span>
                      </div>
                      <div className="font-mono font-bold px-2">
                        {pastResult ? `${pastResult.homeGoals}-${pastResult.awayGoals}` : "-"}
                      </div>
                      <div className="flex items-center gap-2 flex-1 justify-end">
                        <span className={m.away === state.teamId ? "font-bold" : ""}>{a.short}</span>
                        <span className="text-base">{a.logo}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
