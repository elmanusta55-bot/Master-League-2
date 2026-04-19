// Master League team & player data
// Deterministic generation based on hardcoded team bases

const FIRST_NAMES_AZ = ["Elnur", "Rəşad", "Tural", "Cavid", "Orxan", "Ramil", "Kamran", "Emin", "Nihad", "Murad", "Anar", "Bəxtiyar", "Samir", "Vüqar", "Mahir", "Nicat", "Ruslan", "Səbuhi", "Araz", "Fərid"];
const LAST_NAMES_AZ = ["Məmmədov", "Əliyev", "Həsənov", "Quliyev", "Rzayev", "Hüseynov", "İsmayılov", "Cəfərov", "Bayramov", "Şükürov", "Qədirov", "Nəzərov"];
const FIRST_INT = ["Lucas", "Carlos", "Diego", "Marco", "Luca", "Paul", "Leo", "Kai", "Jamal", "Erik", "Viktor", "Mateo", "Rafael", "Omar", "Sergio", "Thomas", "Jorge", "Yuri", "Daniel", "Alex", "Ivan", "Samuel", "Arthur", "Nathan", "Luis"];
const LAST_INT = ["Silva", "Rossi", "Muller", "Garcia", "Kovac", "Nielsen", "Jensen", "Laurent", "Santos", "Oliveira", "Fernandez", "Petrov", "Okafor", "Kim", "Nakamura", "Bruno", "Klopp", "Weber", "Pascal", "Romano"];

// Position archetype distribution per 18-player squad:
// GK: 2, DEF: 6, MID: 6, FWD: 4
const SQUAD_TEMPLATE = [
  { pos: "GK", count: 2 },
  { pos: "DEF", count: 6 },
  { pos: "MID", count: 6 },
  { pos: "FWD", count: 4 },
];

const TEAM_BASE = [
  // Azerbaijani
  { id: "qarabag", name: "Qarabağ FK", short: "QAR", city: "Ağdam", country: "AZ", primary: "#000000", secondary: "#FFFFFF", rating: 78, budget: 8_000_000, style: "az", logo: "⚫⚪" },
  { id: "neftci", name: "Neftçi PFK", short: "NEF", city: "Bakı", country: "AZ", primary: "#000000", secondary: "#FFFFFF", rating: 74, budget: 5_000_000, style: "az", logo: "🛢️" },
  { id: "sabah", name: "Sabah FK", short: "SAB", city: "Bakı", country: "AZ", primary: "#005CAB", secondary: "#FFD700", rating: 73, budget: 4_000_000, style: "az", logo: "⭐" },
  { id: "zire", name: "Zirə FK", short: "ZIR", city: "Zirə", country: "AZ", primary: "#E30613", secondary: "#FFFFFF", rating: 70, budget: 3_000_000, style: "az", logo: "🔴" },
  // European giants
  { id: "madrid", name: "Real Madrid", short: "RMA", city: "Madrid", country: "ES", primary: "#FFFFFF", secondary: "#FEBE10", rating: 92, budget: 150_000_000, style: "es", logo: "👑" },
  { id: "barca", name: "Barcelona", short: "BAR", city: "Barcelona", country: "ES", primary: "#A50044", secondary: "#004D98", rating: 89, budget: 110_000_000, style: "es", logo: "🔵🔴" },
  { id: "atletico", name: "Atletico Madrid", short: "ATM", city: "Madrid", country: "ES", primary: "#CB3524", secondary: "#FFFFFF", rating: 85, budget: 75_000_000, style: "es", logo: "🟥" },
  { id: "bayern", name: "Bayern München", short: "BAY", city: "München", country: "DE", primary: "#DC052D", secondary: "#FFFFFF", rating: 90, budget: 120_000_000, style: "de", logo: "🔴" },
  { id: "dortmund", name: "Borussia Dortmund", short: "BVB", city: "Dortmund", country: "DE", primary: "#FDE100", secondary: "#000000", rating: 84, budget: 55_000_000, style: "de", logo: "🟡⚫" },
  { id: "mancity", name: "Manchester City", short: "MCI", city: "Manchester", country: "EN", primary: "#6CABDD", secondary: "#FFFFFF", rating: 91, budget: 140_000_000, style: "en", logo: "🔷" },
  { id: "liverpool", name: "Liverpool", short: "LIV", city: "Liverpool", country: "EN", primary: "#C8102E", secondary: "#FFFFFF", rating: 88, budget: 100_000_000, style: "en", logo: "🦅" },
  { id: "arsenal", name: "Arsenal", short: "ARS", city: "London", country: "EN", primary: "#EF0107", secondary: "#FFFFFF", rating: 87, budget: 85_000_000, style: "en", logo: "🎯" },
  { id: "chelsea", name: "Chelsea", short: "CHE", city: "London", country: "EN", primary: "#034694", secondary: "#FFFFFF", rating: 84, budget: 95_000_000, style: "en", logo: "🦁" },
  { id: "united", name: "Manchester United", short: "MUN", city: "Manchester", country: "EN", primary: "#DA291C", secondary: "#FFE500", rating: 83, budget: 90_000_000, style: "en", logo: "😈" },
  { id: "psg", name: "Paris Saint-Germain", short: "PSG", city: "Paris", country: "FR", primary: "#004170", secondary: "#DA291C", rating: 89, budget: 130_000_000, style: "fr", logo: "🗼" },
  { id: "juve", name: "Juventus", short: "JUV", city: "Torino", country: "IT", primary: "#000000", secondary: "#FFFFFF", rating: 83, budget: 70_000_000, style: "it", logo: "⚪⚫" },
  { id: "milan", name: "AC Milan", short: "MIL", city: "Milano", country: "IT", primary: "#FB090B", secondary: "#000000", rating: 84, budget: 65_000_000, style: "it", logo: "🔴⚫" },
  { id: "inter", name: "Inter Milan", short: "INT", city: "Milano", country: "IT", primary: "#0068A8", secondary: "#000000", rating: 86, budget: 72_000_000, style: "it", logo: "🔵⚫" },
  { id: "napoli", name: "SSC Napoli", short: "NAP", city: "Napoli", country: "IT", primary: "#12A0D7", secondary: "#FFFFFF", rating: 82, budget: 50_000_000, style: "it", logo: "🔵" },
  { id: "porto", name: "FC Porto", short: "POR", city: "Porto", country: "PT", primary: "#00428C", secondary: "#FFFFFF", rating: 81, budget: 45_000_000, style: "pt", logo: "🐉" },
];

function seededRand(seed) {
  // Simple LCG
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function pickName(country, rand, idx) {
  if (country === "AZ" && rand() < 0.75) {
    return `${FIRST_NAMES_AZ[Math.floor(rand() * FIRST_NAMES_AZ.length)]} ${LAST_NAMES_AZ[Math.floor(rand() * LAST_NAMES_AZ.length)]}`;
  }
  return `${FIRST_INT[Math.floor(rand() * FIRST_INT.length)]} ${LAST_INT[Math.floor(rand() * LAST_INT.length)]}`;
}

function generateSquad(team, seedOffset = 0) {
  const rand = seededRand(team.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) + seedOffset);
  const teamRating = team.rating;
  const players = [];
  let playerIdx = 0;

  for (const { pos, count } of SQUAD_TEMPLATE) {
    for (let i = 0; i < count; i++) {
      const starter = i < (pos === "GK" ? 1 : pos === "DEF" ? 4 : pos === "MID" ? 3 : 3);
      // Starters get team rating +/- 4, bench -3 to -8
      const base = starter ? teamRating + Math.floor(rand() * 7) - 3 : teamRating - 2 - Math.floor(rand() * 6);
      const overall = Math.max(55, Math.min(96, base));
      const age = 17 + Math.floor(rand() * 18);
      const value = Math.round((overall - 55) ** 2 * 8000 + overall * 30000 + (30 - Math.abs(age - 26)) * 50000);
      players.push({
        id: `${team.id}-p${playerIdx}`,
        name: pickName(team.country, rand, playerIdx),
        pos,
        overall,
        pace: Math.max(40, overall + Math.floor(rand() * 10) - 5),
        shooting: pos === "FWD" ? overall + Math.floor(rand() * 6) : overall - Math.floor(rand() * 10),
        passing: pos === "MID" ? overall + Math.floor(rand() * 5) : overall - Math.floor(rand() * 8),
        defending: pos === "DEF" || pos === "GK" ? overall + Math.floor(rand() * 5) : overall - Math.floor(rand() * 15),
        age,
        value,
        wage: Math.round(value / 50 / 1000) * 1000,
        starter,
        energy: 100,
        morale: 70 + Math.floor(rand() * 25),
        goals: 0,
        assists: 0,
        appearances: 0,
        teamId: team.id,
      });
      playerIdx++;
    }
  }
  return players;
}

export function buildTeams() {
  return TEAM_BASE.map((t) => ({
    ...t,
    players: generateSquad(t),
  }));
}

export const TEAMS_META = TEAM_BASE;

export const FORMATIONS = {
  "4-3-3": {
    name: "4-3-3",
    positions: [
      { role: "GK", x: 50, y: 92 },
      { role: "DEF", x: 15, y: 72 },
      { role: "DEF", x: 38, y: 76 },
      { role: "DEF", x: 62, y: 76 },
      { role: "DEF", x: 85, y: 72 },
      { role: "MID", x: 28, y: 50 },
      { role: "MID", x: 50, y: 52 },
      { role: "MID", x: 72, y: 50 },
      { role: "FWD", x: 20, y: 22 },
      { role: "FWD", x: 50, y: 16 },
      { role: "FWD", x: 80, y: 22 },
    ],
  },
  "4-4-2": {
    name: "4-4-2",
    positions: [
      { role: "GK", x: 50, y: 92 },
      { role: "DEF", x: 15, y: 72 },
      { role: "DEF", x: 38, y: 76 },
      { role: "DEF", x: 62, y: 76 },
      { role: "DEF", x: 85, y: 72 },
      { role: "MID", x: 15, y: 48 },
      { role: "MID", x: 38, y: 52 },
      { role: "MID", x: 62, y: 52 },
      { role: "MID", x: 85, y: 48 },
      { role: "FWD", x: 35, y: 20 },
      { role: "FWD", x: 65, y: 20 },
    ],
  },
  "3-5-2": {
    name: "3-5-2",
    positions: [
      { role: "GK", x: 50, y: 92 },
      { role: "DEF", x: 25, y: 75 },
      { role: "DEF", x: 50, y: 78 },
      { role: "DEF", x: 75, y: 75 },
      { role: "MID", x: 12, y: 50 },
      { role: "MID", x: 32, y: 55 },
      { role: "MID", x: 50, y: 58 },
      { role: "MID", x: 68, y: 55 },
      { role: "MID", x: 88, y: 50 },
      { role: "FWD", x: 35, y: 20 },
      { role: "FWD", x: 65, y: 20 },
    ],
  },
};
