import React from "react";
import { NavLink, Link } from "react-router-dom";
import { useGame } from "../lib/gameContext";
import { fmtMoney } from "../lib/gameEngine";
import { Home, Users, Calendar, Trophy, ShoppingCart, Dumbbell, Coins, Play, LogOut, Save, Award, Globe } from "lucide-react";

const NAV = [
  { to: "/hq", icon: Home, label: "Məşqçi Mərkəzi" },
  { to: "/squad", icon: Users, label: "Heyət" },
  { to: "/match", icon: Play, label: "Matç" },
  { to: "/league", icon: Trophy, label: "Liqa" },
  { to: "/cup", icon: Award, label: "Kubok" },
  { to: "/europe", icon: Globe, label: "Avropa" },
  { to: "/fixtures", icon: Calendar, label: "Təqvim" },
  { to: "/transfers", icon: ShoppingCart, label: "Transfer" },
  { to: "/training", icon: Dumbbell, label: "Məşq" },
  { to: "/finance", icon: Coins, label: "Maliyyə" },
];

export default function AppLayout({ children }) {
  const { state, resetGame, saveToCloud } = useGame();
  const myTeam = state?.teams.find((t) => t.id === state.teamId);

  const doSave = async () => {
    const ok = await saveToCloud();
    alert(ok ? "Progress bulud-da saxlandı." : "Saxlama uğursuz oldu.");
  };

  return (
    <div className="min-h-screen grain" style={{ background: "#0A0A0A", color: "#FFF" }}>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside
          className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-64 bg-black border-r z-40"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}
        >
          <Link to="/hq" className="px-6 py-6 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <div className="font-heading text-3xl" style={{ color: "#00E676" }}>MASTER</div>
            <div className="font-heading text-3xl -mt-2">LEAGUE</div>
            <div className="label-tiny mt-1">S{state?.season} · H{state?.currentWeek}</div>
          </Link>

          <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <div className="label-tiny">Klub</div>
            <div className="font-heading text-xl mt-1">{myTeam?.name}</div>
            <div className="text-xs mt-1" style={{ color: "#A0A0A0" }}>
              Menecer: <span className="text-white font-semibold">{state?.managerName}</span>
            </div>
            <div className="text-xs mt-2 flex justify-between">
              <span style={{ color: "#A0A0A0" }}>Büdcə</span>
              <span className="font-mono" style={{ color: "#FFD700" }}>{fmtMoney(state?.budget || 0)}</span>
            </div>
          </div>

          <nav className="flex-1 py-4">
            {NAV.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                data-testid={`nav-${to.slice(1)}`}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-6 py-3 text-sm uppercase tracking-wider font-semibold transition-colors border-r-2 ${
                    isActive
                      ? "text-[#00E676] bg-white/5 border-[#00E676]"
                      : "text-[#A0A0A0] hover:text-white border-transparent hover:bg-white/5"
                  }`
                }
              >
                <Icon size={18} /> {label}
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t flex gap-2" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <button data-testid="save-btn" onClick={doSave} className="btn-secondary flex-1 text-xs flex items-center justify-center gap-1 py-2">
              <Save size={14} /> Saxla
            </button>
            <button
              data-testid="reset-btn"
              onClick={() => {
                if (window.confirm("Oyunu sıfırlamaq istədiyinizə əminsiniz?")) resetGame();
              }}
              className="btn-danger text-xs py-2"
            >
              <LogOut size={14} />
            </button>
          </div>
        </aside>

        {/* Mobile top bar */}
        <div
          className="md:hidden fixed top-0 left-0 right-0 z-40 bg-black border-b flex items-center justify-between px-4 py-3"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}
        >
          <div>
            <div className="font-heading text-xl" style={{ color: "#00E676" }}>MASTER LEAGUE</div>
            <div className="text-xs" style={{ color: "#A0A0A0" }}>{myTeam?.name}</div>
          </div>
          <div className="text-right">
            <div className="font-mono text-sm" style={{ color: "#FFD700" }}>{fmtMoney(state?.budget || 0)}</div>
            <div className="text-xs" style={{ color: "#A0A0A0" }}>S{state?.season} H{state?.currentWeek}</div>
          </div>
        </div>

        {/* Mobile bottom nav */}
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-black border-t flex justify-around py-2"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}
        >
          {NAV.slice(0, 5).map(({ to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              data-testid={`mnav-${to.slice(1)}`}
              className={({ isActive }) =>
                `p-2 ${isActive ? "text-[#00E676]" : "text-[#A0A0A0]"}`
              }
            >
              <Icon size={22} />
            </NavLink>
          ))}
        </nav>

        {/* Content */}
        <main className="flex-1 md:ml-64 pt-16 md:pt-0 pb-20 md:pb-0 relative z-10">
          <div className="p-4 md:p-8 max-w-[1400px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
