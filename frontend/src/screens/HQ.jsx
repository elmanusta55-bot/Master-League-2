import React from "react";
import { Link } from "react-router-dom";
import { useGame } from "../lib/gameContext";
import { fmtMoney, sortStandings } from "../lib/gameEngine";
import { Trophy, TrendingUp, Mail, Play, Calendar as CalendarIcon, Activity } from "lucide-react";

const BG = "https://images.pexels.com/photos/35898730/pexels-photo-35898730.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

export default function HQ() {
  const { state } = useGame();
  const myTeam = state.teams.find((t) => t.id === state.teamId);
  const currentRound = state.fixtures[state.currentWeek] || [];
  const userMatch = currentRound.find((m) => m.home === state.teamId || m.away === state.teamId);
  const home = userMatch ? state.teams.find((t) => t.id === userMatch.home) : null;
  const away = userMatch ? state.teams.find((t) => t.id === userMatch.away) : null;

  const sorted = sortStandings(state.standings);
  const myPos = sorted.findIndex((s) => s.teamId === state.teamId) + 1;
  const topScorers = state.teams.flatMap((t) => t.players.map((p) => ({ ...p, teamName: t.short })))
    .sort((a, b) => (b.goals || 0) - (a.goals || 0)).slice(0, 5);

  const lastResult = state.results.filter((r) => r.homeId === state.teamId || r.awayId === state.teamId).slice(-1)[0];

  return (
    <div className="relative">
      <div
        className="absolute -inset-4 -top-8 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `url(${BG})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          maskImage: "linear-gradient(180deg, #000 0%, transparent 70%)",
        }}
      />
      <div className="relative z-10 space-y-6">
        <div className="fade-in-up">
          <div className="label-tiny" style={{ color: "#00E676" }}>MƏŞQÇI MƏRKƏZI</div>
          <h1 className="font-heading text-4xl md:text-5xl">Xoş gəldin, {state.managerName}</h1>
          <div className="text-sm mt-1" style={{ color: "#A0A0A0" }}>
            Sezon {state.season} · Həftə {state.currentWeek + 1} / {state.fixtures.length}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Next Match Hero */}
          <div className="md:col-span-2 glass rounded-md p-6 fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <div className="label-tiny">Növbəti Matç · Həftə {state.currentWeek + 1}</div>
              <span className="badge pulse-live" style={{ background: "rgba(0,230,118,0.15)", color: "#00E676" }}>
                <Activity size={10} /> CANLI YAYIM
              </span>
            </div>
            {home && away ? (
              <div className="flex items-center justify-between gap-4">
                <div className="text-center flex-1">
                  <div className="text-5xl">{home.logo}</div>
                  <div className="font-heading text-xl mt-2">{home.short}</div>
                  <div className="text-xs" style={{ color: "#A0A0A0" }}>Ev · OVR {home.rating}</div>
                </div>
                <div className="text-center">
                  <div className="font-heading text-4xl" style={{ color: "#FFD700" }}>VS</div>
                  <div className="text-xs mt-1" style={{ color: "#A0A0A0" }}>Həftə {state.currentWeek + 1}</div>
                </div>
                <div className="text-center flex-1">
                  <div className="text-5xl">{away.logo}</div>
                  <div className="font-heading text-xl mt-2">{away.short}</div>
                  <div className="text-xs" style={{ color: "#A0A0A0" }}>Qonaq · OVR {away.rating}</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8" style={{ color: "#A0A0A0" }}>
                Matç yoxdur
              </div>
            )}
            <Link
              to="/match"
              data-testid="go-to-match-btn"
              className="btn-primary mt-6 flex items-center justify-center gap-2 w-full md:max-w-xs md:mx-auto"
            >
              <Play size={16} /> Matça Get
            </Link>
          </div>

          {/* League Position */}
          <Link to="/league" className="surface rounded-md p-6 hover:border-[#00E676]/30 transition-colors fade-in-up">
            <div className="flex items-center gap-2 mb-4">
              <Trophy size={16} style={{ color: "#FFD700" }} />
              <div className="label-tiny">Liqa Mövqeyi</div>
            </div>
            <div className="font-heading text-7xl" style={{ color: "#00E676" }}>
              {myPos}<span className="text-lg" style={{ color: "#A0A0A0" }}>/{sorted.length}</span>
            </div>
            <div className="text-xs mt-2" style={{ color: "#A0A0A0" }}>
              {sorted[myPos - 1]?.Pts || 0} xal · {sorted[myPos - 1]?.W || 0}Q {sorted[myPos - 1]?.D || 0}B {sorted[myPos - 1]?.L || 0}M
            </div>
            <div className="flex gap-1 mt-4">
              {(sorted[myPos - 1]?.form || []).map((f, i) => (
                <span key={i} className={`w-6 h-6 flex items-center justify-center text-xs font-bold rounded ${
                  f === "W" ? "bg-[#00E676] text-black" : f === "D" ? "bg-[#FFD700] text-black" : "bg-[#FF3B30] text-white"
                }`}>{f}</span>
              ))}
            </div>
          </Link>

          {/* Finance */}
          <Link to="/finance" className="surface rounded-md p-6 hover:border-[#00E676]/30 transition-colors fade-in-up">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={16} style={{ color: "#00E676" }} />
              <div className="label-tiny">Maliyyə</div>
            </div>
            <div className="font-heading text-3xl" style={{ color: "#FFD700" }}>{fmtMoney(state.budget)}</div>
            <div className="text-xs mt-2" style={{ color: "#A0A0A0" }}>Mövcud büdcə</div>
            <div className="mt-4 pt-4 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <div className="flex justify-between text-xs">
                <span style={{ color: "#A0A0A0" }}>Həftəlik maaşlar</span>
                <span className="font-mono" style={{ color: "#FF3B30" }}>−{fmtMoney(state.wagesPerWeek)}</span>
              </div>
            </div>
          </Link>

          {/* Last Result */}
          <div className="surface rounded-md p-6 fade-in-up">
            <div className="label-tiny mb-3">Son Nəticə</div>
            {lastResult ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="font-heading text-lg">{state.teams.find((t) => t.id === lastResult.homeId)?.short}</div>
                  <div className="font-heading text-3xl">{lastResult.homeGoals} : {lastResult.awayGoals}</div>
                  <div className="font-heading text-lg">{state.teams.find((t) => t.id === lastResult.awayId)?.short}</div>
                </div>
                <div className="text-xs mt-2 text-center" style={{ color: "#A0A0A0" }}>Həftə {lastResult.week}</div>
              </>
            ) : (
              <div className="text-sm" style={{ color: "#A0A0A0" }}>Hələ matç oynanmayıb</div>
            )}
          </div>

          {/* Top Scorers */}
          <div className="surface rounded-md p-6 fade-in-up">
            <div className="label-tiny mb-3">Liqa Bombardirləri</div>
            {topScorers.filter((p) => p.goals > 0).length === 0 ? (
              <div className="text-sm" style={{ color: "#A0A0A0" }}>Hələ qol yox</div>
            ) : (
              <div className="space-y-2">
                {topScorers.filter((p) => p.goals > 0).map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs" style={{ color: "#A0A0A0" }}>{i + 1}.</span>
                      <span>{p.name}</span>
                      <span className="text-xs font-mono" style={{ color: "#A0A0A0" }}>({p.teamName})</span>
                    </div>
                    <span className="font-heading text-lg" style={{ color: "#00E676" }}>{p.goals}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Inbox */}
          <div className="md:col-span-3 surface rounded-md p-6 fade-in-up">
            <div className="flex items-center gap-2 mb-4">
              <Mail size={16} style={{ color: "#00E676" }} />
              <div className="label-tiny">Gələnlər</div>
              <span className="ml-auto badge" style={{ background: "rgba(255,255,255,0.05)", color: "#A0A0A0" }}>
                {state.inbox.length}
              </span>
            </div>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {state.inbox.map((msg) => (
                <div key={msg.id} className="p-3 rounded border" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                  <div className="flex items-baseline justify-between">
                    <div className="font-heading text-sm">{msg.title}</div>
                    <div className="text-xs" style={{ color: "#A0A0A0" }}>{msg.date}</div>
                  </div>
                  <div className="text-sm mt-1" style={{ color: "#A0A0A0" }}>{msg.body}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
