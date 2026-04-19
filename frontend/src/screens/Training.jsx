import React from "react";
import { useGame } from "../lib/gameContext";
import { fmtMoney } from "../lib/gameEngine";
import { Dumbbell, TrendingUp } from "lucide-react";

const POS_COLOR = { GK: "#FFD700", DEF: "#007AFF", MID: "#00E676", FWD: "#FF3B30" };
const TRAINING_COST = 500_000;

export default function Training() {
  const { state, trainPlayer } = useGame();
  const myTeam = state.teams.find((t) => t.id === state.teamId);

  return (
    <div className="space-y-6">
      <div className="fade-in-up">
        <div className="label-tiny" style={{ color: "#00E676" }}>MƏŞQ MƏRKƏZI</div>
        <h1 className="font-heading text-4xl">Oyunçu İnkişafı</h1>
        <div className="text-sm mt-1" style={{ color: "#A0A0A0" }}>
          Bir məşq {fmtMoney(TRAINING_COST)} büdcə tələb edir. Uğur şansı: 60% (+1 OVR)
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {myTeam.players
          .slice()
          .sort((a, b) => b.overall - a.overall)
          .map((p) => (
            <div key={p.id} className="surface rounded-md p-4 flex items-center gap-4">
              <div
                className="w-14 h-14 rounded flex items-center justify-center font-mono font-bold text-xl"
                style={{
                  background: POS_COLOR[p.pos] + "20",
                  color: POS_COLOR[p.pos],
                  border: `1px solid ${POS_COLOR[p.pos]}60`,
                }}
              >
                {p.overall}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{p.name}</div>
                <div className="text-xs" style={{ color: "#A0A0A0" }}>
                  {p.pos} · {p.age}y · Enerji {p.energy}% · Mor {p.morale}%
                </div>
                <div className="flex gap-1 mt-1 text-[10px] font-mono" style={{ color: "#A0A0A0" }}>
                  <span>PAC {p.pace}</span>
                  <span>SHO {p.shooting}</span>
                  <span>PAS {p.passing}</span>
                  <span>DEF {p.defending}</span>
                </div>
              </div>
              <button
                data-testid={`train-btn-${p.id}`}
                onClick={() => trainPlayer(p.id, TRAINING_COST)}
                disabled={state.budget < TRAINING_COST || p.overall >= 96}
                className="btn-primary text-xs py-2 px-3 flex items-center gap-1 disabled:opacity-30"
              >
                <Dumbbell size={14} /> Məşq
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}
