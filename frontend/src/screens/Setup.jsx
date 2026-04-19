import React, { useState } from "react";
import { useGame } from "../lib/gameContext";
import { buildTeams } from "../data/teams";
import { fmtMoney } from "../lib/gameEngine";
import { ChevronRight, Trophy, Star, Download } from "lucide-react";

const BG_URL = "https://images.pexels.com/photos/35898730/pexels-photo-35898730.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

export default function Setup() {
  const { startNewGame, loadFromCloud } = useGame();
  const [step, setStep] = useState(1);
  const [managerName, setManagerName] = useState("");
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [loadName, setLoadName] = useState("");
  const [loadMsg, setLoadMsg] = useState("");
  const teams = buildTeams();

  const handleStart = () => {
    if (!managerName.trim() || !selectedTeam) return;
    startNewGame(managerName.trim(), selectedTeam);
  };

  const handleLoad = async () => {
    if (!loadName.trim()) return;
    setLoadMsg("Yüklənir...");
    const ok = await loadFromCloud(loadName.trim());
    if (!ok) setLoadMsg("Bu menecer üçün saxlama tapılmadı.");
  };

  return (
    <div className="min-h-screen relative grain" style={{ background: "#0A0A0A" }}>
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url(${BG_URL})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(10,10,10,0.85) 0%, rgba(10,10,10,0.98) 100%)" }} />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
        <div className="text-center mb-10 fade-in-up">
          <div className="label-tiny" style={{ color: "#00E676" }}>MASTER LEAGUE 2026</div>
          <h1 className="font-heading text-6xl md:text-8xl mt-2" style={{ letterSpacing: "0.05em" }}>
            ÇEMPİON<br />OL
          </h1>
          <p className="mt-4 max-w-xl mx-auto" style={{ color: "#A0A0A0" }}>
            Klubu seç, heyəti qur, transferləri et və liqa çempionluğunu qazan. eFootball Master League-dən ilhamlanan
            tam-funksional web oyun.
          </p>
        </div>

        {step === 1 && (
          <div className="glass rounded-md p-8 w-full max-w-lg fade-in-up">
            <div className="label-tiny mb-2">ADIM 1 / 2</div>
            <h2 className="font-heading text-3xl mb-6">Menecer Profilin</h2>
            <label className="label-tiny">Menecer Adı</label>
            <input
              data-testid="manager-name-input"
              type="text"
              value={managerName}
              onChange={(e) => setManagerName(e.target.value)}
              placeholder="Sərhadovich"
              maxLength={20}
              className="w-full mt-2 text-lg"
            />
            <button
              data-testid="setup-continue-btn"
              disabled={!managerName.trim()}
              onClick={() => setStep(2)}
              className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
            >
              Davam Et <ChevronRight size={18} />
            </button>

            <div className="mt-8 pt-6 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <div className="label-tiny mb-3">Əvvəlki oyunu yüklə</div>
              <div className="flex gap-2">
                <input
                  data-testid="load-name-input"
                  type="text"
                  value={loadName}
                  onChange={(e) => setLoadName(e.target.value)}
                  placeholder="Menecer adı"
                  className="flex-1"
                />
                <button data-testid="load-cloud-btn" onClick={handleLoad} className="btn-secondary flex items-center gap-1 py-2 px-3">
                  <Download size={16} />
                </button>
              </div>
              {loadMsg && <div className="text-xs mt-2" style={{ color: "#FF3B30" }}>{loadMsg}</div>}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="w-full max-w-6xl fade-in-up">
            <div className="flex items-center justify-between mb-4 px-2">
              <div>
                <div className="label-tiny">ADIM 2 / 2</div>
                <h2 className="font-heading text-3xl">Klubunu Seç</h2>
              </div>
              <button data-testid="setup-back-btn" onClick={() => setStep(1)} className="btn-secondary text-xs py-2">Geri</button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
              {teams.map((t) => (
                <button
                  key={t.id}
                  data-testid={`team-card-${t.id}`}
                  onClick={() => setSelectedTeam(t.id)}
                  className={`text-left p-4 rounded-md border transition-all relative overflow-hidden ${
                    selectedTeam === t.id
                      ? "border-[#00E676] bg-[#00E676]/10 -translate-y-1"
                      : "border-white/10 hover:border-white/30 bg-[#121212]"
                  }`}
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ background: `linear-gradient(90deg, ${t.primary}, ${t.secondary})` }}
                  />
                  <div className="text-3xl mb-2">{t.logo}</div>
                  <div className="font-heading text-lg leading-tight">{t.name}</div>
                  <div className="text-xs mt-1" style={{ color: "#A0A0A0" }}>{t.city} · {t.country}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1 text-xs">
                      <Star size={12} style={{ color: "#FFD700" }} fill="#FFD700" /> <span className="font-mono">{t.rating}</span>
                    </div>
                    <div className="text-xs font-mono" style={{ color: "#A0A0A0" }}>{fmtMoney(t.budget)}</div>
                  </div>
                </button>
              ))}
            </div>

            <button
              data-testid="start-game-btn"
              disabled={!selectedTeam}
              onClick={handleStart}
              className="btn-primary w-full max-w-md mx-auto flex items-center justify-center gap-2 text-lg"
              style={{ display: "flex" }}
            >
              <Trophy size={20} /> Oyuna Başla
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
