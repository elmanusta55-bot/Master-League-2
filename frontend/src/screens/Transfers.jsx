import React, { useMemo, useState } from "react";
import { useGame } from "../lib/gameContext";
import { fmtMoney } from "../lib/gameEngine";
import { Search, ShoppingCart, DollarSign } from "lucide-react";

const POS_COLOR = { GK: "#FFD700", DEF: "#007AFF", MID: "#00E676", FWD: "#FF3B30" };

export default function Transfers() {
  const { state, transferBuy, transferSell } = useGame();
  const [query, setQuery] = useState("");
  const [posFilter, setPosFilter] = useState("ALL");
  const [mode, setMode] = useState("buy");

  const allOthers = useMemo(() => {
    const out = [];
    state.teams.forEach((t) => {
      if (t.id === state.teamId) return;
      t.players.forEach((p) => out.push({ ...p, teamName: t.short, teamFullName: t.name }));
    });
    return out.sort((a, b) => b.overall - a.overall);
  }, [state.teams, state.teamId]);

  const mine = state.teams.find((t) => t.id === state.teamId).players.slice().sort((a, b) => b.overall - a.overall);

  const list = (mode === "buy" ? allOthers : mine).filter((p) => {
    if (posFilter !== "ALL" && p.pos !== posFilter) return false;
    if (query && !p.name.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="fade-in-up">
        <div className="label-tiny" style={{ color: "#00E676" }}>TRANSFER BAZARI</div>
        <h1 className="font-heading text-4xl">Transferlər</h1>
        <div className="text-sm mt-1" style={{ color: "#A0A0A0" }}>
          Büdcə: <span className="font-mono font-bold" style={{ color: "#FFD700" }}>{fmtMoney(state.budget)}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 bg-[#121212] p-1 rounded">
          <button
            data-testid="mode-buy-btn"
            onClick={() => setMode("buy")}
            className={`px-4 py-2 rounded text-xs font-semibold uppercase tracking-wider ${mode === "buy" ? "bg-[#00E676] text-black" : "text-[#A0A0A0]"}`}
          >
            <ShoppingCart size={14} className="inline mr-1" /> Al
          </button>
          <button
            data-testid="mode-sell-btn"
            onClick={() => setMode("sell")}
            className={`px-4 py-2 rounded text-xs font-semibold uppercase tracking-wider ${mode === "sell" ? "bg-[#FFD700] text-black" : "text-[#A0A0A0]"}`}
          >
            <DollarSign size={14} className="inline mr-1" /> Sat
          </button>
        </div>

        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} style={{ color: "#A0A0A0" }} className="absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            data-testid="transfer-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Oyunçu axtar..."
            className="w-full pl-9"
          />
        </div>

        <select data-testid="transfer-pos-filter" value={posFilter} onChange={(e) => setPosFilter(e.target.value)}>
          <option value="ALL">Bütün mövqelər</option>
          <option value="GK">Qapıçı</option>
          <option value="DEF">Müdafiə</option>
          <option value="MID">Yarımmüdafiə</option>
          <option value="FWD">Hücumçu</option>
        </select>
      </div>

      <div className="surface rounded-md overflow-hidden">
        <div className="max-h-[65vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0">
              <tr style={{ background: "#121212" }} className="label-tiny">
                <th className="py-3 px-3 text-left">OVR</th>
                <th className="py-3 px-3 text-left">Oyunçu</th>
                <th className="py-3 px-3 text-left">Möv</th>
                <th className="py-3 px-3 text-left">Yaş</th>
                <th className="py-3 px-3 text-left">{mode === "buy" ? "Klub" : "Qol"}</th>
                <th className="py-3 px-3 text-right">Dəyər</th>
                <th className="py-3 px-3 text-right">Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className="border-t hover:bg-white/[0.03]" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                  <td className="py-3 px-3">
                    <span className="font-mono font-bold text-lg" style={{ color: p.overall >= 85 ? "#FFD700" : p.overall >= 75 ? "#00E676" : "#FFF" }}>
                      {p.overall}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-semibold">{p.name}</td>
                  <td className="py-3 px-3">
                    <span className="badge" style={{ background: POS_COLOR[p.pos] + "20", color: POS_COLOR[p.pos] }}>{p.pos}</span>
                  </td>
                  <td className="py-3 px-3 font-mono" style={{ color: "#A0A0A0" }}>{p.age}</td>
                  <td className="py-3 px-3 text-xs" style={{ color: "#A0A0A0" }}>
                    {mode === "buy" ? p.teamName : `${p.goals || 0} qol`}
                  </td>
                  <td className="py-3 px-3 text-right font-mono" style={{ color: "#FFD700" }}>
                    {fmtMoney(mode === "buy" ? p.value : Math.floor(p.value * 0.85))}
                  </td>
                  <td className="py-3 px-3 text-right">
                    {mode === "buy" ? (
                      <button
                        data-testid={`buy-btn-${p.id}`}
                        onClick={() => {
                          if (state.budget < p.value) return alert("Büdcə çatmır!");
                          if (window.confirm(`${p.name} (${p.overall} OVR) alınsın? Xərc: ${fmtMoney(p.value)}`)) {
                            transferBuy(p.id, p.teamId);
                          }
                        }}
                        disabled={state.budget < p.value}
                        className="btn-primary text-xs py-2 px-3 disabled:opacity-40"
                      >
                        Al
                      </button>
                    ) : (
                      <button
                        data-testid={`sell-btn-${p.id}`}
                        onClick={() => {
                          if (window.confirm(`${p.name} satılsın? Qazanc: ${fmtMoney(Math.floor(p.value * 0.85))}`)) {
                            transferSell(p.id);
                          }
                        }}
                        className="btn-secondary text-xs py-2 px-3"
                      >
                        Sat
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr><td colSpan={7} className="py-8 text-center" style={{ color: "#A0A0A0" }}>Oyunçu tapılmadı.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
