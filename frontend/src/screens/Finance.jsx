import React from "react";
import { useGame } from "../lib/gameContext";
import { fmtMoney } from "../lib/gameEngine";
import { TrendingUp, TrendingDown, Wallet, Banknote } from "lucide-react";

export default function Finance() {
  const { state } = useGame();
  const myTeam = state.teams.find((t) => t.id === state.teamId);
  const wages = myTeam.players.reduce((s, p) => s + p.wage, 0);
  const squadValue = myTeam.players.reduce((s, p) => s + p.value, 0);
  const expectedTicket = Math.floor((myTeam.rating * 50000) + 250000);

  return (
    <div className="space-y-6">
      <div className="fade-in-up">
        <div className="label-tiny" style={{ color: "#FFD700" }}>MALIYYƏ</div>
        <h1 className="font-heading text-4xl">Klub Büdcəsi</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="surface rounded-md p-5">
          <div className="flex items-center gap-2 mb-2"><Wallet size={14} style={{ color: "#FFD700" }} /><span className="label-tiny">Mövcud</span></div>
          <div className="font-heading text-3xl" style={{ color: "#FFD700" }}>{fmtMoney(state.budget)}</div>
        </div>
        <div className="surface rounded-md p-5">
          <div className="flex items-center gap-2 mb-2"><Banknote size={14} style={{ color: "#00E676" }} /><span className="label-tiny">Heyət dəyəri</span></div>
          <div className="font-heading text-3xl">{fmtMoney(squadValue)}</div>
        </div>
        <div className="surface rounded-md p-5">
          <div className="flex items-center gap-2 mb-2"><TrendingUp size={14} style={{ color: "#00E676" }} /><span className="label-tiny">Gözlənilən bilet</span></div>
          <div className="font-heading text-3xl" style={{ color: "#00E676" }}>+{fmtMoney(expectedTicket)}</div>
        </div>
        <div className="surface rounded-md p-5">
          <div className="flex items-center gap-2 mb-2"><TrendingDown size={14} style={{ color: "#FF3B30" }} /><span className="label-tiny">Həftəlik maaşlar</span></div>
          <div className="font-heading text-3xl" style={{ color: "#FF3B30" }}>−{fmtMoney(wages)}</div>
        </div>
      </div>

      <div className="surface rounded-md p-5">
        <div className="label-tiny mb-4">Ən Yüksək Maaşlar</div>
        <div className="space-y-2">
          {myTeam.players
            .slice()
            .sort((a, b) => b.wage - a.wage)
            .slice(0, 10)
            .map((p, i) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs w-6" style={{ color: "#A0A0A0" }}>#{i + 1}</span>
                  <span>{p.name}</span>
                  <span className="text-xs font-mono" style={{ color: "#A0A0A0" }}>OVR {p.overall}</span>
                </div>
                <div className="font-mono" style={{ color: "#FF3B30" }}>{fmtMoney(p.wage)}/həftə</div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
