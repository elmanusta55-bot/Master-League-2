import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useGame } from "../lib/gameContext";
import { simulateMatch } from "../lib/gameEngine";
import { Play, SkipForward, Trophy, Zap, Lock, CreditCard, Loader2 } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const COMMENTARY = {
  goal: (min, team, player, assist) =>
    `⚽ GOL! ${min}' — ${player} (${team}) ${assist ? `Asist: ${assist}` : ""}`,
  chance: (min, team, player) => `${min}' — ${player} (${team}) təhlükəli şans yaratdı!`,
  yellow: (min, team, player) => `🟨 ${min}' — ${player} (${team}) sarı vərəqə.`,
  red: (min, team, player) => `🟥 ${min}' — ${player} (${team}) QIRMIZI VƏRƏQƏ!`,
};

const INTRO_LINES = (home, away) => [
  `Matç başlayır: ${home} vs ${away}`,
  `Stadion dolu, tərəfdarlar coşğulu!`,
  `Hakim fit çalır, oyun başladı!`,
];

export default function Match() {
  const { state, playWeek, recordPaidSkip } = useGame();
  const navigate = useNavigate();
  const location = useLocation();
  const round = state.fixtures[state.currentWeek];
  const userMatch = round?.find((m) => m.home === state.teamId || m.away === state.teamId);

  const [result, setResult] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [commentary, setCommentary] = useState([]);
  const [score, setScore] = useState({ h: 0, a: 0 });
  const [currentMin, setCurrentMin] = useState(0);
  const [finished, setFinished] = useState(false);
  const [hasPaidAccess, setHasPaidAccess] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallMode, setPaywallMode] = useState(null); // "fast" or "skip"
  const [payLoading, setPayLoading] = useState(false);
  const [payStatus, setPayStatus] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [commentary]);

  // Handle Stripe return with session_id
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sessionId = params.get("session_id");
    if (!sessionId) return;

    let attempts = 0;
    const maxAttempts = 10;
    const poll = async () => {
      try {
        const resp = await axios.get(`${API}/payments/status/${sessionId}`);
        const data = resp.data;
        if (data.payment_status === "paid") {
          setPayStatus("Ödəniş uğurlu! Sürətli/Keç rejimi aktivləşdi.");
          setHasPaidAccess(true);
          recordPaidSkip();
          // Clean url
          navigate("/match", { replace: true });
          return;
        }
        if (data.status === "expired") {
          setPayStatus("Ödəniş sessiyası bitdi.");
          return;
        }
        if (attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 2000);
        } else {
          setPayStatus("Ödəniş gözləməsi çox çəkdi.");
        }
      } catch (e) {
        setPayStatus("Ödəniş statusu alına bilmədi.");
      }
    };
    setPayStatus("Ödəniş yoxlanılır...");
    poll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  if (!userMatch) {
    return (
      <div className="py-20 text-center">
        <div className="label-tiny" style={{ color: "#00E676" }}>MATÇ YOXDUR</div>
        <h1 className="font-heading text-4xl mt-2">Bu həftə matç oynanmır</h1>
        <button onClick={() => navigate("/hq")} className="btn-primary mt-6">Qayıt</button>
      </div>
    );
  }

  const home = state.teams.find((t) => t.id === userMatch.home);
  const away = state.teams.find((t) => t.id === userMatch.away);

  const startMatch = (speed = 400) => {
    if (playing) return;
    const simResult = simulateMatch(home, away);
    setResult(simResult);
    setPlaying(true);
    setCommentary(INTRO_LINES(home.short, away.short));
    setScore({ h: 0, a: 0 });
    setCurrentMin(0);
    setFinished(false);

    const events = [...simResult.events];
    let min = 0;
    const tick = () => {
      min += 1;
      setCurrentMin(min);
      const evs = events.filter((e) => e.min === min);
      evs.forEach((e) => {
        const tm = e.team === "home" ? home.short : away.short;
        if (e.type === "goal") {
          setCommentary((c) => [...c, COMMENTARY.goal(min, tm, e.player, e.assist)]);
          setScore((s) => e.team === "home" ? { ...s, h: s.h + 1 } : { ...s, a: s.a + 1 });
        } else if (e.type === "chance") {
          setCommentary((c) => [...c, COMMENTARY.chance(min, tm, e.player)]);
        } else if (e.type === "yellow") {
          setCommentary((c) => [...c, COMMENTARY.yellow(min, tm, e.player)]);
        } else if (e.type === "red") {
          setCommentary((c) => [...c, COMMENTARY.red(min, tm, e.player)]);
        }
      });
      if (min === 45) setCommentary((c) => [...c, "— İlk hissə başa çatdı —"]);
      if (min >= 90) {
        setCommentary((c) => [...c, `Hakim son fiti çalır! ${home.short} ${simResult.homeGoals}-${simResult.awayGoals} ${away.short}`]);
        setFinished(true);
        setPlaying(false);
        clearInterval(iv);
      }
    };
    const iv = setInterval(tick, speed);
  };

  const skipMatch = () => {
    const simResult = result || simulateMatch(home, away);
    setResult(simResult);
    setScore({ h: simResult.homeGoals, a: simResult.awayGoals });
    setCurrentMin(90);
    setFinished(true);
    setPlaying(false);
    setCommentary([
      `${home.short} vs ${away.short}: Yekun nəticə ${simResult.homeGoals}-${simResult.awayGoals}`,
      ...simResult.events.filter((e) => e.type === "goal").map((e) => {
        const tm = e.team === "home" ? home.short : away.short;
        return COMMENTARY.goal(e.min, tm, e.player, e.assist);
      }),
    ]);
  };

  const tryFast = () => {
    if (hasPaidAccess) return startMatch(100);
    setPaywallMode("fast");
    setShowPaywall(true);
  };
  const trySkip = () => {
    if (hasPaidAccess) return skipMatch();
    setPaywallMode("skip");
    setShowPaywall(true);
  };

  const buyPass = async () => {
    setPayLoading(true);
    setPayStatus("");
    try {
      const originUrl = window.location.origin;
      const resp = await axios.post(`${API}/payments/checkout`, {
        package_id: "match_skip",
        origin_url: originUrl,
        manager_name: state.managerName,
      });
      if (resp.data?.url) {
        window.location.href = resp.data.url;
      } else {
        setPayStatus("Ödəniş linki alına bilmədi.");
        setPayLoading(false);
      }
    } catch (e) {
      setPayStatus("Xəta: " + (e.response?.data?.detail || e.message));
      setPayLoading(false);
    }
  };

  const confirmResult = () => {
    playWeek(result);
    navigate("/hq");
  };

  return (
    <div className="space-y-6 relative">
      <div className="fade-in-up">
        <div className="label-tiny" style={{ color: "#FF3B30" }}>CANLI MATÇ · HƏFTƏ {state.currentWeek + 1}</div>
        <h1 className="font-heading text-3xl md:text-4xl">{home.name} vs {away.name}</h1>
      </div>

      {payStatus && (
        <div className="glass rounded-md p-3 text-sm text-center" style={{ color: payStatus.includes("uğur") ? "#00E676" : "#FFD700" }}>
          {payStatus}
        </div>
      )}

      {/* Scoreboard */}
      <div className="glass rounded-md p-6 md:p-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg, transparent, #00E676, transparent)" }} />
        <div className="grid grid-cols-3 gap-4 items-center">
          <div className="text-center">
            <div className="text-5xl md:text-7xl">{home.logo}</div>
            <div className="font-heading text-xl md:text-2xl mt-3">{home.short}</div>
            <div className="label-tiny mt-1">EV · OVR {home.rating}</div>
          </div>
          <div className="text-center">
            <div className="font-heading text-6xl md:text-8xl leading-none">
              <span style={{ color: "#00E676" }}>{score.h}</span>
              <span style={{ color: "#555" }}> : </span>
              <span style={{ color: "#00E676" }}>{score.a}</span>
            </div>
            <div className="font-mono text-sm mt-2" style={{ color: finished ? "#FFD700" : "#FF3B30" }}>
              {finished ? "TAM" : playing ? `${currentMin}'` : "KICK OFF"}
            </div>
          </div>
          <div className="text-center">
            <div className="text-5xl md:text-7xl">{away.logo}</div>
            <div className="font-heading text-xl md:text-2xl mt-3">{away.short}</div>
            <div className="label-tiny mt-1">QONAQ · OVR {away.rating}</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 justify-center">
        {!playing && !finished && (
          <>
            <button data-testid="match-start-btn" onClick={() => startMatch(400)} className="btn-primary flex items-center gap-2">
              <Play size={18} /> Matçı Başlat
            </button>
            <button data-testid="match-fast-btn" onClick={tryFast} className="btn-secondary flex items-center gap-2 relative">
              <Zap size={18} /> Sürətli
              {!hasPaidAccess && <Lock size={12} className="ml-1" style={{ color: "#FFD700" }} />}
            </button>
            <button data-testid="match-skip-btn" onClick={trySkip} className="btn-secondary flex items-center gap-2 relative">
              <SkipForward size={18} /> Keç
              {!hasPaidAccess && <Lock size={12} className="ml-1" style={{ color: "#FFD700" }} />}
            </button>
          </>
        )}
        {finished && (
          <button data-testid="match-confirm-btn" onClick={confirmResult} className="btn-primary flex items-center gap-2">
            <Trophy size={18} /> Həftəni Bitir
          </button>
        )}
      </div>

      {/* Commentary */}
      <div className="surface rounded-md p-4">
        <div className="label-tiny mb-3">Canlı Komentariya</div>
        <div ref={scrollRef} className="font-mono text-sm space-y-1 max-h-80 overflow-y-auto">
          {commentary.length === 0 ? (
            <div style={{ color: "#555" }}>Matç başlamağı gözləyir...</div>
          ) : (
            commentary.map((line, i) => (
              <div key={i} className="slide-in-left" style={{ color: line.includes("GOL") ? "#00E676" : line.includes("QIRMIZI") ? "#FF3B30" : "#FFF" }}>
                {line}
              </div>
            ))
          )}
        </div>
      </div>

      {result && (
        <div className="grid grid-cols-3 gap-3">
          <div className="surface rounded-md p-4 text-center">
            <div className="label-tiny">Top Sahəsi</div>
            <div className="font-heading text-2xl mt-1">{result.homePossession}% : {100 - result.homePossession}%</div>
          </div>
          <div className="surface rounded-md p-4 text-center">
            <div className="label-tiny">Zərbələr</div>
            <div className="font-heading text-2xl mt-1">{result.homeShots} : {result.awayShots}</div>
          </div>
          <div className="surface rounded-md p-4 text-center">
            <div className="label-tiny">Qollar</div>
            <div className="font-heading text-2xl mt-1" style={{ color: "#00E676" }}>{score.h} : {score.a}</div>
          </div>
        </div>
      )}

      {/* Paywall Modal */}
      {showPaywall && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)" }}
          data-testid="paywall-modal"
        >
          <div className="glass rounded-md p-8 max-w-md w-full fade-in-up">
            <div className="text-center">
              <div
                className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ background: "#FFD700", color: "#000" }}
              >
                <Zap size={30} />
              </div>
              <div className="label-tiny" style={{ color: "#FFD700" }}>PREMIUM XÜSUSIYYƏT</div>
              <h2 className="font-heading text-3xl mt-2">
                {paywallMode === "fast" ? "Sürətli Matç" : "Matçı Keç"}
              </h2>
              <p className="text-sm mt-3" style={{ color: "#A0A0A0" }}>
                Sürətli və Keç rejimi premium xüsusiyyətdir. Yalnız <span className="font-heading text-xl" style={{ color: "#FFD700" }}>$1</span> ödəyərək aktivləşdirin.
              </p>
              <p className="text-xs mt-2" style={{ color: "#555" }}>
                Bu sessiyada bütün matçlarda istifadə edə bilərsiniz.
              </p>
              <div className="mt-6 space-y-2">
                <button
                  data-testid="paywall-pay-btn"
                  onClick={buyPass}
                  disabled={payLoading}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                  style={{ background: "#FFD700" }}
                >
                  {payLoading ? (
                    <><Loader2 size={16} className="animate-spin" /> Yönləndirilir...</>
                  ) : (
                    <><CreditCard size={16} /> $1 Ödə və Aktivləşdir</>
                  )}
                </button>
                <button
                  data-testid="paywall-close-btn"
                  onClick={() => setShowPaywall(false)}
                  className="btn-secondary w-full"
                  disabled={payLoading}
                >
                  Bağla
                </button>
              </div>
              <div className="text-[10px] mt-3" style={{ color: "#555" }}>
                Stripe ilə təhlükəsiz ödəniş · Test rejimi: kart 4242 4242 4242 4242
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
