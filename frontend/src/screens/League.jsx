import React from "react";
import { useGame } from "../lib/gameContext";
import { sortStandings } from "../lib/gameEngine";

export default function League() {
  const { state } = useGame();
  const sorted = sortStandings(state.standings);

  const posBand = (i) => {
    if (i === 0) return "#FFD700";
    if (i < 4) return "#00E676";
    if (i >= sorted.length - 3) return "#FF3B30";
    return "transparent";
  };

  return (
    <div className="space-y-6">
      <div className="fade-in-up">
        <div className="label-tiny" style={{ color: "#00E676" }}>LİQA CƏDVƏLI</div>
        <h1 className="font-heading text-4xl">Sezon {state.season}</h1>
        <div className="text-sm mt-1" style={{ color: "#A0A0A0" }}>
          Həftə {state.currentWeek} / {state.fixtures.length}
        </div>
      </div>

      <div className="surface rounded-md overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="label-tiny" style={{ background: "#121212" }}>
              <th className="py-3 px-3 text-left">#</th>
              <th className="py-3 px-3 text-left">Klub</th>
              <th className="py-3 px-2 text-center">O</th>
              <th className="py-3 px-2 text-center">Q</th>
              <th className="py-3 px-2 text-center">B</th>
              <th className="py-3 px-2 text-center">M</th>
              <th className="py-3 px-2 text-center">QA</th>
              <th className="py-3 px-2 text-center">QB</th>
              <th className="py-3 px-2 text-center">+/-</th>
              <th className="py-3 px-3 text-center" style={{ color: "#00E676" }}>XAL</th>
              <th className="py-3 px-3 text-center">Form</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => {
              const team = state.teams.find((t) => t.id === row.teamId);
              const isMe = row.teamId === state.teamId;
              return (
                <tr
                  key={row.teamId}
                  data-testid={`league-row-${row.teamId}`}
                  className={`border-t transition-colors ${isMe ? "bg-[#00E676]/10" : "hover:bg-white/[0.03]"}`}
                  style={{ borderColor: "rgba(255,255,255,0.06)" }}
                >
                  <td className="py-3 px-3 flex items-center gap-2">
                    <span className="w-1 h-5" style={{ background: posBand(i) }} />
                    <span className="font-mono font-bold">{i + 1}</span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{team.logo}</span>
                      <span className={isMe ? "font-bold text-[#00E676]" : "font-semibold"}>{team.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center font-mono">{row.P}</td>
                  <td className="py-3 px-2 text-center font-mono" style={{ color: "#00E676" }}>{row.W}</td>
                  <td className="py-3 px-2 text-center font-mono">{row.D}</td>
                  <td className="py-3 px-2 text-center font-mono" style={{ color: "#FF3B30" }}>{row.L}</td>
                  <td className="py-3 px-2 text-center font-mono">{row.GF}</td>
                  <td className="py-3 px-2 text-center font-mono">{row.GA}</td>
                  <td className="py-3 px-2 text-center font-mono" style={{ color: row.GD > 0 ? "#00E676" : row.GD < 0 ? "#FF3B30" : "#A0A0A0" }}>
                    {row.GD > 0 ? "+" : ""}{row.GD}
                  </td>
                  <td className="py-3 px-3 text-center font-heading text-xl">{row.Pts}</td>
                  <td className="py-3 px-3">
                    <div className="flex gap-0.5 justify-center">
                      {row.form.map((f, j) => (
                        <span
                          key={j}
                          className="w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded"
                          style={{
                            background: f === "W" ? "#00E676" : f === "D" ? "#FFD700" : "#FF3B30",
                            color: f === "D" ? "#000" : f === "W" ? "#000" : "#FFF",
                          }}
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex gap-4 text-xs" style={{ color: "#A0A0A0" }}>
        <div className="flex items-center gap-2"><span className="w-3 h-3" style={{ background: "#FFD700" }} /> Çempion</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3" style={{ background: "#00E676" }} /> Avropa</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3" style={{ background: "#FF3B30" }} /> Küçürmə</div>
      </div>
    </div>
  );
}
