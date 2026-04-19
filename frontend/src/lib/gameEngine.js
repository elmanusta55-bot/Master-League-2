// Match simulation engine + season utilities

export function calcTeamStrength(team, squadOverrides = {}) {
  const players = (squadOverrides[team.id]?.players) || team.players;
  const starters = players.filter((p) => p.starter).slice(0, 11);
  if (starters.length === 0) return team.rating;
  const avg = starters.reduce((s, p) => s + p.overall, 0) / starters.length;
  return Math.round(avg);
}

export function simulateMatch(home, away, userTeamId = null, homeBoost = 2) {
  const homeStr = calcTeamStrength(home) + homeBoost;
  const awayStr = calcTeamStrength(away);
  const totalStr = homeStr + awayStr;
  const homeWinChance = homeStr / totalStr;

  const events = [];
  let homeGoals = 0;
  let awayGoals = 0;
  const minutes = [];

  // Attack events scaled by strength
  const homeAttacks = 8 + Math.floor(Math.random() * 8);
  const awayAttacks = 7 + Math.floor(Math.random() * 7);
  const homeConvert = 0.12 + (homeStr / 1000);
  const awayConvert = 0.10 + (awayStr / 1000);

  for (let i = 0; i < homeAttacks; i++) {
    const min = Math.floor(Math.random() * 90) + 1;
    if (Math.random() < homeConvert * 1.1) {
      minutes.push({ min, team: "home", type: "goal" });
      homeGoals++;
    } else if (Math.random() < 0.25) {
      minutes.push({ min, team: "home", type: "chance" });
    }
  }
  for (let i = 0; i < awayAttacks; i++) {
    const min = Math.floor(Math.random() * 90) + 1;
    if (Math.random() < awayConvert) {
      minutes.push({ min, team: "away", type: "goal" });
      awayGoals++;
    } else if (Math.random() < 0.25) {
      minutes.push({ min, team: "away", type: "chance" });
    }
  }

  // Yellow / red cards
  const cards = 1 + Math.floor(Math.random() * 4);
  for (let i = 0; i < cards; i++) {
    minutes.push({
      min: Math.floor(Math.random() * 90) + 1,
      team: Math.random() < 0.5 ? "home" : "away",
      type: Math.random() < 0.12 ? "red" : "yellow",
    });
  }

  minutes.sort((a, b) => a.min - b.min);

  // Pick scorers
  const homeScorers = home.players.filter((p) => p.starter && p.pos !== "GK");
  const awayScorers = away.players.filter((p) => p.starter && p.pos !== "GK");
  const weightedPick = (players) => {
    const weights = players.map((p) => (p.pos === "FWD" ? 4 : p.pos === "MID" ? 2 : 1) * p.shooting);
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < players.length; i++) {
      r -= weights[i];
      if (r <= 0) return players[i];
    }
    return players[0];
  };

  for (const evt of minutes) {
    const roster = evt.team === "home" ? homeScorers : awayScorers;
    if (evt.type === "goal") {
      const scorer = weightedPick(roster);
      const assister = roster[Math.floor(Math.random() * roster.length)];
      evt.player = scorer.name;
      evt.playerId = scorer.id;
      if (assister.id !== scorer.id) {
        evt.assist = assister.name;
        evt.assistId = assister.id;
      }
    } else {
      const p = roster[Math.floor(Math.random() * roster.length)];
      evt.player = p?.name || "—";
    }
  }

  return {
    homeId: home.id,
    awayId: away.id,
    homeGoals,
    awayGoals,
    events: minutes,
    homePossession: Math.round(40 + homeWinChance * 20),
    homeShots: homeAttacks,
    awayShots: awayAttacks,
  };
}

// Round-robin schedule: home + away = 2*(n-1) rounds
export function generateFixtures(teams) {
  const n = teams.length;
  const ids = teams.map((t) => t.id);
  if (n % 2 !== 0) ids.push(null);
  const rounds = [];
  const total = ids.length;
  for (let r = 0; r < total - 1; r++) {
    const round = [];
    for (let i = 0; i < total / 2; i++) {
      const home = ids[i];
      const away = ids[total - 1 - i];
      if (home && away) round.push({ home, away });
    }
    rounds.push(round);
    // Rotate
    const fixed = ids[0];
    const rest = ids.slice(1);
    rest.unshift(rest.pop());
    ids.splice(0, ids.length, fixed, ...rest);
  }
  // Reverse fixtures for second half
  const reverseRounds = rounds.map((round) =>
    round.map((m) => ({ home: m.away, away: m.home }))
  );
  return [...rounds, ...reverseRounds];
}

export function emptyStandings(teams) {
  const map = {};
  teams.forEach((t) => {
    map[t.id] = { teamId: t.id, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, GD: 0, Pts: 0, form: [] };
  });
  return map;
}

export function applyMatchToStandings(standings, result) {
  const h = standings[result.homeId];
  const a = standings[result.awayId];
  h.P += 1;
  a.P += 1;
  h.GF += result.homeGoals;
  h.GA += result.awayGoals;
  a.GF += result.awayGoals;
  a.GA += result.homeGoals;
  h.GD = h.GF - h.GA;
  a.GD = a.GF - a.GA;
  if (result.homeGoals > result.awayGoals) {
    h.W++;
    a.L++;
    h.Pts += 3;
    h.form.push("W");
    a.form.push("L");
  } else if (result.homeGoals < result.awayGoals) {
    a.W++;
    h.L++;
    a.Pts += 3;
    a.form.push("W");
    h.form.push("L");
  } else {
    h.D++;
    a.D++;
    h.Pts += 1;
    a.Pts += 1;
    h.form.push("D");
    a.form.push("D");
  }
  h.form = h.form.slice(-5);
  a.form = a.form.slice(-5);
}

export function sortStandings(standingsMap) {
  return Object.values(standingsMap).sort((a, b) => {
    if (b.Pts !== a.Pts) return b.Pts - a.Pts;
    if (b.GD !== a.GD) return b.GD - a.GD;
    return b.GF - a.GF;
  });
}

export function fmtMoney(n) {
  if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `€${(n / 1_000).toFixed(0)}K`;
  return `€${n}`;
}
