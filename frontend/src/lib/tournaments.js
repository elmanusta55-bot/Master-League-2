// Cup and European League tournament utilities
import { simulateMatch } from "./gameEngine";

/**
 * Generate a knockout cup bracket for 16 teams (1/8 finals → Final = 4 rounds).
 * teams: array of team objects. Uses top 16 by rating.
 * Returns: { rounds: [ [ {home, away} ] ], winnerId, results: [] }
 */
export function buildCupBracket(teams) {
  const sorted = [...teams].sort((a, b) => b.rating - a.rating).slice(0, 16);
  // Seed pairings: 1v16, 2v15, etc.
  const round1 = [];
  for (let i = 0; i < 8; i++) {
    round1.push({ home: sorted[i].id, away: sorted[15 - i].id });
  }
  return {
    name: "Azərbaycan Kuboku",
    currentRound: 0,
    rounds: [round1], // future rounds filled as winners come
    results: [], // per-round results [[{home, away, homeGoals, ...}]]
    winners: [], // winning team IDs per round
    winnerId: null,
  };
}

export function buildEuropeBracket(teams) {
  // Take top 16 teams (same pool as cup but ordered differently)
  const sorted = [...teams].sort((a, b) => b.rating - a.rating).slice(0, 16);
  const round1 = [];
  for (let i = 0; i < 8; i++) {
    round1.push({ home: sorted[i].id, away: sorted[15 - i].id });
  }
  return {
    name: "Avropa Liqası",
    currentRound: 0,
    rounds: [round1],
    results: [],
    winners: [],
    winnerId: null,
  };
}

export function playCupRound(bracket, teams, userTeamId = null, userResult = null) {
  const round = bracket.rounds[bracket.currentRound];
  if (!round) return bracket;

  const teamById = Object.fromEntries(teams.map((t) => [t.id, t]));
  const roundResults = [];
  const winners = [];

  for (const m of round) {
    const home = teamById[m.home];
    const away = teamById[m.away];
    let r;
    if (userResult && (m.home === userTeamId || m.away === userTeamId)) {
      r = userResult;
    } else {
      r = simulateMatch(home, away);
      // Penalty shootout for draws in knockout
      if (r.homeGoals === r.awayGoals) {
        if (Math.random() < 0.5) r.homeGoals += 1;
        else r.awayGoals += 1;
        r.events.push({ min: 120, team: r.homeGoals > r.awayGoals ? "home" : "away", type: "penalty", player: "Penalti" });
      }
    }
    roundResults.push(r);
    winners.push(r.homeGoals > r.awayGoals ? m.home : m.away);
  }

  const newBracket = {
    ...bracket,
    results: [...bracket.results, roundResults],
    winners: [...bracket.winners, winners],
    currentRound: bracket.currentRound + 1,
  };

  // If this was final, declare winner
  if (winners.length === 1) {
    newBracket.winnerId = winners[0];
  } else {
    // Pair winners for next round
    const nextRound = [];
    for (let i = 0; i < winners.length; i += 2) {
      nextRound.push({ home: winners[i], away: winners[i + 1] });
    }
    newBracket.rounds = [...bracket.rounds, nextRound];
  }
  return newBracket;
}

export function getUserCupMatch(bracket, userTeamId) {
  const round = bracket?.rounds?.[bracket.currentRound];
  if (!round) return null;
  return round.find((m) => m.home === userTeamId || m.away === userTeamId) || null;
}

export const CUP_ROUND_NAMES = [
  "1/8 Final",
  "1/4 Final",
  "Yarımfinal",
  "Final",
];

// AI transfer activity between rounds — some rival teams swap a player
export function aiTransferTick(teams, userTeamId) {
  const inboxMessages = [];
  // Pick 2 random non-user teams to make a transfer
  const pool = teams.filter((t) => t.id !== userTeamId);
  for (let i = 0; i < 2; i++) {
    const buyer = pool[Math.floor(Math.random() * pool.length)];
    const seller = pool[Math.floor(Math.random() * pool.length)];
    if (!buyer || !seller || buyer.id === seller.id) continue;
    const target = [...seller.players].sort((a, b) => b.overall - a.overall)[Math.floor(Math.random() * 5)];
    if (!target) continue;
    const price = Math.floor(target.value * (0.9 + Math.random() * 0.2));
    // Move the player
    const sellerTeam = teams.find((t) => t.id === seller.id);
    const buyerTeam = teams.find((t) => t.id === buyer.id);
    if (!sellerTeam || !buyerTeam) continue;
    sellerTeam.players = sellerTeam.players.filter((p) => p.id !== target.id);
    buyerTeam.players = [...buyerTeam.players, { ...target, teamId: buyer.id, starter: false }];
    inboxMessages.push({
      title: "Transfer Xəbəri",
      body: `${target.name} (${target.overall} OVR) ${seller.name}-dən ${buyer.name}-ə keçdi. Məbləğ: €${(price / 1_000_000).toFixed(1)}M`,
    });
  }
  return inboxMessages;
}
