import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { buildTeams, FORMATIONS } from "../data/teams";
import { generateFixtures, emptyStandings, applyMatchToStandings, simulateMatch, sortStandings } from "./gameEngine";
import { buildCupBracket, buildEuropeBracket, playCupRound, aiTransferTick } from "./tournaments";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const GameCtx = createContext(null);

const STORAGE_KEY = "masterLeague:v1";

function initialState() {
  return null;
}

export function GameProvider({ children }) {
  const [state, setState] = useState(initialState);
  const [loading, setLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const loaded = JSON.parse(raw);
        // Migration: add cup/europe if missing
        if (!loaded.cup && loaded.teams) loaded.cup = buildCupBracket(loaded.teams);
        if (!loaded.europe && loaded.teams) loaded.europe = buildEuropeBracket(loaded.teams);
        if (loaded.paidSkips === undefined) loaded.paidSkips = 0;
        setState(loaded);
      }
    } catch (e) {
      console.warn("Load failed", e);
    }
    setLoading(false);
  }, []);

  // Persist
  useEffect(() => {
    if (state) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  const startNewGame = (managerName, teamId) => {
    const teams = buildTeams();
    const fixtures = generateFixtures(teams);
    const standings = emptyStandings(teams);
    const userTeam = teams.find((t) => t.id === teamId);
    const newState = {
      managerName,
      teamId,
      teams,
      fixtures,
      standings,
      currentWeek: 0,
      season: 1,
      results: [], // past match results
      formation: "4-3-3",
      budget: userTeam.budget,
      wagesPerWeek: userTeam.players.reduce((s, p) => s + p.wage, 0),
      inbox: [
        { id: "m1", date: "Week 0", title: `Xoş gəldin, ${managerName}!`, body: `${userTeam.name} komandasının baş məşqçisi təyin olundunuz. Sizdən klubu zirvəyə aparmağı gözləyirik.` },
      ],
      trophies: [],
      nextMatchPlayed: false,
      cup: buildCupBracket(teams),
      europe: buildEuropeBracket(teams),
      paidSkips: 0,
    };
    setState(newState);
    // async save
    axios.post(`${API}/save`, { manager_name: managerName, team_id: teamId, state: newState }).catch(() => {});
  };

  const saveToCloud = async () => {
    if (!state) return;
    try {
      await axios.post(`${API}/save`, {
        manager_name: state.managerName,
        team_id: state.teamId,
        state,
      });
      return true;
    } catch (e) {
      return false;
    }
  };

  const loadFromCloud = async (managerName) => {
    try {
      const resp = await axios.get(`${API}/load/${encodeURIComponent(managerName)}`);
      if (resp.data?.state) {
        setState(resp.data.state);
        return true;
      }
    } catch (e) {
      return false;
    }
    return false;
  };

  const resetGame = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState(null);
  };

  // Simulate the full round: user's match manually triggered, others auto
  const playWeek = (userMatchResult = null) => {
    setState((prev) => {
      if (!prev) return prev;
      const roundIdx = prev.currentWeek;
      const round = prev.fixtures[roundIdx];
      if (!round) return prev;
      const s = { ...prev };
      s.standings = { ...prev.standings };
      s.results = [...prev.results];
      s.teams = prev.teams.map((t) => ({ ...t, players: t.players.map((p) => ({ ...p })) }));
      const teamById = Object.fromEntries(s.teams.map((t) => [t.id, t]));

      round.forEach((m) => {
        const home = teamById[m.home];
        const away = teamById[m.away];
        let result;
        if (userMatchResult && (m.home === prev.teamId || m.away === prev.teamId)) {
          result = userMatchResult;
        } else {
          result = simulateMatch(home, away);
        }
        applyMatchToStandings(s.standings, result);

        // Update player stats
        result.events.forEach((e) => {
          if (e.type === "goal") {
            const teamObj = e.team === "home" ? home : away;
            const scorer = teamObj.players.find((p) => p.id === e.playerId);
            if (scorer) scorer.goals = (scorer.goals || 0) + 1;
            if (e.assistId) {
              const asst = teamObj.players.find((p) => p.id === e.assistId);
              if (asst) asst.assists = (asst.assists || 0) + 1;
            }
          }
        });
        [home, away].forEach((tm) => {
          tm.players.filter((p) => p.starter).forEach((p) => {
            p.appearances = (p.appearances || 0) + 1;
            p.energy = Math.max(30, (p.energy || 100) - (10 + Math.floor(Math.random() * 15)));
          });
        });

        s.results.push({ week: roundIdx + 1, ...result });
      });

      // Finance: weekly ticket revenue - wages
      const userTeam = teamById[prev.teamId];
      const homeMatch = round.find((m) => m.home === prev.teamId);
      const ticketRev = homeMatch ? Math.floor((userTeam.rating * 50000) + Math.random() * 500000) : 0;
      const wages = userTeam.players.reduce((a, p) => a + p.wage, 0);
      s.budget = prev.budget + ticketRev - wages;
      s.wagesPerWeek = wages;

      // Small rest recovery
      s.teams.forEach((t) => t.players.forEach((p) => { p.energy = Math.min(100, (p.energy || 100) + 4); }));

      s.currentWeek = roundIdx + 1;
      s.nextMatchPlayed = false;

      // AI transfer activity every 5 weeks
      if (s.currentWeek % 5 === 0) {
        const aiMsgs = aiTransferTick(s.teams, prev.teamId);
        aiMsgs.forEach((msg, idx) => {
          s.inbox = [
            { id: `ai-${Date.now()}-${idx}`, date: `Həftə ${s.currentWeek}`, ...msg },
            ...s.inbox,
          ];
        });
      }

      // End of season handling
      if (s.currentWeek >= s.fixtures.length) {
        const sorted = sortStandings(s.standings);
        const winner = sorted[0];
        s.inbox = [
          {
            id: `s${s.season}-end`,
            date: `Sezon ${s.season}`,
            title: `Sezon ${s.season} başa çatdı!`,
            body: `Çempion: ${s.teams.find((t) => t.id === winner.teamId)?.name}. Sizin yeriniz: ${sorted.findIndex((r) => r.teamId === s.teamId) + 1}`,
          },
          ...prev.inbox,
        ];
        if (winner.teamId === s.teamId) {
          s.trophies = [...(prev.trophies || []), { season: s.season, title: "Liqa Çempionu" }];
        }
        // Start next season: reset standings/fixtures, keep squad & progression
        s.teams.forEach((t) => t.players.forEach((p) => {
          // Young players grow, old decline
          if (p.age < 25) p.overall = Math.min(96, p.overall + (Math.random() < 0.5 ? 1 : 0));
          else if (p.age > 30) p.overall = Math.max(55, p.overall - (Math.random() < 0.3 ? 1 : 0));
          p.age += 1;
          p.goals = 0;
          p.assists = 0;
          p.appearances = 0;
        }));
        s.fixtures = generateFixtures(s.teams);
        s.standings = emptyStandings(s.teams);
        s.currentWeek = 0;
        s.season = s.season + 1;
        s.results = [];
        // Reset cup and europe for new season
        s.cup = buildCupBracket(s.teams);
        s.europe = buildEuropeBracket(s.teams);
      }
      return s;
    });
  };

  const playCupRoundAction = (userResult = null) => {
    setState((prev) => {
      if (!prev.cup || prev.cup.winnerId) return prev;
      const s = { ...prev };
      s.teams = prev.teams.map((t) => ({ ...t, players: t.players.map((p) => ({ ...p })) }));
      const newBracket = playCupRound(prev.cup, s.teams, prev.teamId, userResult);
      s.cup = newBracket;
      if (newBracket.winnerId) {
        const winnerTeam = s.teams.find((t) => t.id === newBracket.winnerId);
        s.inbox = [
          { id: `cup-${Date.now()}`, date: `Sezon ${prev.season}`, title: "Kubok Qalibi!", body: `${winnerTeam?.name} Azərbaycan Kubokunu qazandı!` },
          ...prev.inbox,
        ];
        if (newBracket.winnerId === prev.teamId) {
          s.trophies = [...(prev.trophies || []), { season: prev.season, title: "Azərbaycan Kuboku" }];
          s.budget = prev.budget + 5_000_000;
        }
      }
      return s;
    });
  };

  const playEuropeRoundAction = (userResult = null) => {
    setState((prev) => {
      if (!prev.europe || prev.europe.winnerId) return prev;
      const s = { ...prev };
      s.teams = prev.teams.map((t) => ({ ...t, players: t.players.map((p) => ({ ...p })) }));
      const newBracket = playCupRound(prev.europe, s.teams, prev.teamId, userResult);
      s.europe = newBracket;
      if (newBracket.winnerId) {
        const winnerTeam = s.teams.find((t) => t.id === newBracket.winnerId);
        s.inbox = [
          { id: `eu-${Date.now()}`, date: `Sezon ${prev.season}`, title: "Avropa Liqası Qalibi!", body: `${winnerTeam?.name} Avropa Liqasını qazandı!` },
          ...prev.inbox,
        ];
        if (newBracket.winnerId === prev.teamId) {
          s.trophies = [...(prev.trophies || []), { season: prev.season, title: "Avropa Liqası" }];
          s.budget = prev.budget + 20_000_000;
        }
      }
      return s;
    });
  };

  const recordPaidSkip = () => {
    setState((prev) => ({ ...prev, paidSkips: (prev.paidSkips || 0) + 1 }));
  };

  const updateFormation = (formationName) => {
    setState((p) => ({ ...p, formation: formationName }));
  };

  const setStarters = (teamId, starterIds) => {
    setState((prev) => {
      const s = { ...prev };
      s.teams = prev.teams.map((t) => {
        if (t.id !== teamId) return t;
        return {
          ...t,
          players: t.players.map((p) => ({ ...p, starter: starterIds.includes(p.id) })),
        };
      });
      return s;
    });
  };

  const transferBuy = (playerId, fromTeamId) => {
    setState((prev) => {
      const s = { ...prev };
      const fromTeam = prev.teams.find((t) => t.id === fromTeamId);
      const player = fromTeam.players.find((p) => p.id === playerId);
      if (!player || prev.budget < player.value) return prev;

      s.teams = prev.teams.map((t) => {
        if (t.id === fromTeamId) {
          return { ...t, players: t.players.filter((p) => p.id !== playerId) };
        }
        if (t.id === prev.teamId) {
          const newPlayer = { ...player, teamId: prev.teamId, starter: false };
          return { ...t, players: [...t.players, newPlayer] };
        }
        return t;
      });
      s.budget = prev.budget - player.value;
      s.inbox = [
        { id: `tr-${Date.now()}`, date: `Həftə ${prev.currentWeek}`, title: "Transfer tamamlandı", body: `${player.name} (${player.overall} OVR) ${fromTeam.name}-dən alındı. Xərc: €${(player.value/1_000_000).toFixed(1)}M` },
        ...prev.inbox,
      ];
      return s;
    });
  };

  const transferSell = (playerId) => {
    setState((prev) => {
      const s = { ...prev };
      const myTeam = prev.teams.find((t) => t.id === prev.teamId);
      const player = myTeam.players.find((p) => p.id === playerId);
      if (!player) return prev;
      const sellPrice = Math.floor(player.value * 0.85);
      s.teams = prev.teams.map((t) => {
        if (t.id === prev.teamId) {
          return { ...t, players: t.players.filter((p) => p.id !== playerId) };
        }
        return t;
      });
      s.budget = prev.budget + sellPrice;
      s.inbox = [
        { id: `trs-${Date.now()}`, date: `Həftə ${prev.currentWeek}`, title: "Oyunçu satıldı", body: `${player.name} satıldı. Qazanc: €${(sellPrice/1_000_000).toFixed(1)}M` },
        ...prev.inbox,
      ];
      return s;
    });
  };

  const trainPlayer = (playerId, cost = 500_000) => {
    setState((prev) => {
      if (prev.budget < cost) return prev;
      const s = { ...prev };
      s.teams = prev.teams.map((t) => {
        if (t.id !== prev.teamId) return t;
        return {
          ...t,
          players: t.players.map((p) => {
            if (p.id !== playerId) return p;
            if (p.overall >= 96) return p;
            const gain = Math.random() < 0.6 ? 1 : 0;
            return { ...p, overall: p.overall + gain, morale: Math.min(99, p.morale + 3) };
          }),
        };
      });
      s.budget = prev.budget - cost;
      return s;
    });
  };

  const value = useMemo(
    () => ({
      state,
      loading,
      startNewGame,
      resetGame,
      playWeek,
      updateFormation,
      setStarters,
      transferBuy,
      transferSell,
      trainPlayer,
      saveToCloud,
      loadFromCloud,
      playCupRoundAction,
      playEuropeRoundAction,
      recordPaidSkip,
      FORMATIONS,
    }),
    [state, loading]
  );

  return <GameCtx.Provider value={value}>{children}</GameCtx.Provider>;
}

export const useGame = () => {
  const ctx = useContext(GameCtx);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
};
