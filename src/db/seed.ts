import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db } from "./index";
import {
  organizations,
  users,
  leagues,
  clubs,
  seasons,
  players,
  neuralAnalyses,
  scoutingTargets,
} from "./schema";

// ============================================
// Deterministic UUID generator
// ============================================

function makeUuid(name: string): string {
  const hash = crypto.createHash("md5").update(name).digest("hex");
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    hash.slice(12, 16),
    hash.slice(16, 20),
    hash.slice(20, 32),
  ].join("-");
}

// ============================================
// Fixed UUIDs for deterministic seeding
// ============================================

const ORG_ID = makeUuid("org:nottingham-forest");
const USER_ID = makeUuid("user:analyst");
const LEAGUE_ID = makeUuid("league:premier-league");
const LEAGUE_IDS_TOP5 = {
  "Premier League": makeUuid("league:premier-league"),
  "La Liga": makeUuid("league:la-liga"),
  "Serie A": makeUuid("league:serie-a"),
  "Bundesliga": makeUuid("league:bundesliga"),
  "Ligue 1": makeUuid("league:ligue-1"),
};
const SEASON_ID = makeUuid("season:2024-25");

// API-Football external IDs for league mapping
const LEAGUE_EXTERNAL_IDS: Record<string, string> = {
  "Premier League": "39",
  "La Liga": "140",
  "Serie A": "135",
  "Bundesliga": "78",
  "Ligue 1": "61",
};

// ============================================
// Position cluster type
// ============================================

type PositionCluster = "GK" | "CB" | "FB" | "DM" | "CM" | "AM" | "W" | "ST";

type Decision =
  | "CONTRATAR"
  | "BLINDAR"
  | "MONITORAR"
  | "EMPRESTIMO"
  | "RECUSAR"
  | "ALERTA_CINZA";

// ============================================
// CLUB DATA — All 20 Premier League 2024/25
// ============================================

const clubData = [
  { name: "Nottingham Forest", shortName: "NFFC", country: "England", stadiumName: "The City Ground", foundedYear: 1865 },
  { name: "Arsenal", shortName: "Arsenal", country: "England", stadiumName: "Emirates Stadium", foundedYear: 1886 },
  { name: "Manchester City", shortName: "Man City", country: "England", stadiumName: "Etihad Stadium", foundedYear: 1880 },
  { name: "Liverpool", shortName: "Liverpool", country: "England", stadiumName: "Anfield", foundedYear: 1892 },
  { name: "Chelsea", shortName: "Chelsea", country: "England", stadiumName: "Stamford Bridge", foundedYear: 1905 },
  { name: "Manchester United", shortName: "Man Utd", country: "England", stadiumName: "Old Trafford", foundedYear: 1878 },
  { name: "Tottenham Hotspur", shortName: "Spurs", country: "England", stadiumName: "Tottenham Hotspur Stadium", foundedYear: 1882 },
  { name: "Newcastle United", shortName: "Newcastle", country: "England", stadiumName: "St James' Park", foundedYear: 1892 },
  { name: "Aston Villa", shortName: "Villa", country: "England", stadiumName: "Villa Park", foundedYear: 1874 },
  { name: "Brighton & Hove Albion", shortName: "Brighton", country: "England", stadiumName: "Amex Stadium", foundedYear: 1901 },
  { name: "West Ham United", shortName: "West Ham", country: "England", stadiumName: "London Stadium", foundedYear: 1895 },
  { name: "Bournemouth", shortName: "Bournemouth", country: "England", stadiumName: "Vitality Stadium", foundedYear: 1899 },
  { name: "Fulham", shortName: "Fulham", country: "England", stadiumName: "Craven Cottage", foundedYear: 1879 },
  { name: "Crystal Palace", shortName: "Palace", country: "England", stadiumName: "Selhurst Park", foundedYear: 1905 },
  { name: "Wolverhampton Wanderers", shortName: "Wolves", country: "England", stadiumName: "Molineux Stadium", foundedYear: 1877 },
  { name: "Everton", shortName: "Everton", country: "England", stadiumName: "Goodison Park", foundedYear: 1878 },
  { name: "Brentford", shortName: "Brentford", country: "England", stadiumName: "Gtech Community Stadium", foundedYear: 1889 },
  { name: "Ipswich Town", shortName: "Ipswich", country: "England", stadiumName: "Portman Road", foundedYear: 1878 },
  { name: "Leicester City", shortName: "Leicester", country: "England", stadiumName: "King Power Stadium", foundedYear: 1884 },
  { name: "Southampton", shortName: "Southampton", country: "England", stadiumName: "St Mary's Stadium", foundedYear: 1885 },
];

// Generate club IDs
const CLUB_IDS: Record<string, string> = {};
for (const c of clubData) {
  CLUB_IDS[c.name] = makeUuid(`club:${c.name}`);
}

// ============================================
// PLAYER DATA — Real Premier League 2024/25
// ============================================

interface PlayerSeed {
  name: string;
  fullName?: string;
  nationality: string;
  age: number;
  positionCluster: PositionCluster;
  positionDetail: string;
  club: string;
  marketValue: number; // millions EUR
  salary: number; // annual, millions EUR
  contractUntil: string;
  height?: number;
  preferredFoot?: string;
}

const playerData: PlayerSeed[] = [
  // === Arsenal ===
  { name: "Bukayo Saka", fullName: "Bukayo Ayoyinka Saka", nationality: "England", age: 23, positionCluster: "W", positionDetail: "Right Winger", club: "Arsenal", marketValue: 140, salary: 8.5, contractUntil: "2027-06-30", height: 178, preferredFoot: "left" },
  { name: "William Saliba", fullName: "William Saliba", nationality: "France", age: 23, positionCluster: "CB", positionDetail: "Centre Back", club: "Arsenal", marketValue: 100, salary: 6.0, contractUntil: "2028-06-30", height: 192, preferredFoot: "right" },
  { name: "Declan Rice", fullName: "Declan Rice", nationality: "England", age: 25, positionCluster: "DM", positionDetail: "Defensive Midfielder", club: "Arsenal", marketValue: 110, salary: 12.0, contractUntil: "2028-06-30", height: 185, preferredFoot: "right" },
  { name: "Martin Odegaard", fullName: "Martin Odegaard", nationality: "Norway", age: 25, positionCluster: "AM", positionDetail: "Attacking Midfielder", club: "Arsenal", marketValue: 100, salary: 10.0, contractUntil: "2028-06-30", height: 178, preferredFoot: "left" },
  { name: "Kai Havertz", fullName: "Kai Havertz", nationality: "Germany", age: 25, positionCluster: "ST", positionDetail: "Centre Forward", club: "Arsenal", marketValue: 70, salary: 9.0, contractUntil: "2028-06-30", height: 193, preferredFoot: "left" },

  // === Manchester City ===
  { name: "Erling Haaland", fullName: "Erling Braut Haaland", nationality: "Norway", age: 24, positionCluster: "ST", positionDetail: "Centre Forward", club: "Manchester City", marketValue: 180, salary: 20.0, contractUntil: "2034-06-30", height: 194, preferredFoot: "left" },
  { name: "Rodri", fullName: "Rodrigo Hernandez Cascante", nationality: "Spain", age: 28, positionCluster: "DM", positionDetail: "Defensive Midfielder", club: "Manchester City", marketValue: 120, salary: 12.0, contractUntil: "2027-06-30", height: 191, preferredFoot: "right" },
  { name: "Kevin De Bruyne", fullName: "Kevin De Bruyne", nationality: "Belgium", age: 33, positionCluster: "AM", positionDetail: "Attacking Midfielder", club: "Manchester City", marketValue: 30, salary: 20.0, contractUntil: "2025-06-30", height: 181, preferredFoot: "right" },
  { name: "Phil Foden", fullName: "Philip Foden", nationality: "England", age: 24, positionCluster: "AM", positionDetail: "Attacking Midfielder", club: "Manchester City", marketValue: 130, salary: 13.0, contractUntil: "2027-06-30", height: 171, preferredFoot: "left" },
  { name: "Bernardo Silva", fullName: "Bernardo Mota Veiga de Carvalho e Silva", nationality: "Portugal", age: 30, positionCluster: "CM", positionDetail: "Central Midfielder", club: "Manchester City", marketValue: 60, salary: 10.5, contractUntil: "2026-06-30", height: 173, preferredFoot: "left" },

  // === Liverpool ===
  { name: "Mohamed Salah", fullName: "Mohamed Salah Hamed Mahrous Ghaly", nationality: "Egypt", age: 32, positionCluster: "W", positionDetail: "Right Winger", club: "Liverpool", marketValue: 55, salary: 18.0, contractUntil: "2025-06-30", height: 175, preferredFoot: "left" },
  { name: "Virgil van Dijk", fullName: "Virgil van Dijk", nationality: "Netherlands", age: 33, positionCluster: "CB", positionDetail: "Centre Back", club: "Liverpool", marketValue: 25, salary: 14.0, contractUntil: "2025-06-30", height: 193, preferredFoot: "right" },
  { name: "Trent Alexander-Arnold", fullName: "Trent Alexander-Arnold", nationality: "England", age: 26, positionCluster: "FB", positionDetail: "Right Back", club: "Liverpool", marketValue: 70, salary: 10.0, contractUntil: "2025-06-30", height: 175, preferredFoot: "right" },
  { name: "Alexis Mac Allister", fullName: "Alexis Mac Allister", nationality: "Argentina", age: 25, positionCluster: "CM", positionDetail: "Central Midfielder", club: "Liverpool", marketValue: 80, salary: 7.5, contractUntil: "2028-06-30", height: 174, preferredFoot: "right" },
  { name: "Dominik Szoboszlai", fullName: "Dominik Szoboszlai", nationality: "Hungary", age: 24, positionCluster: "AM", positionDetail: "Attacking Midfielder", club: "Liverpool", marketValue: 65, salary: 6.5, contractUntil: "2029-06-30", height: 186, preferredFoot: "right" },

  // === Chelsea ===
  { name: "Cole Palmer", fullName: "Cole Jermaine Palmer", nationality: "England", age: 22, positionCluster: "AM", positionDetail: "Attacking Midfielder / Right Winger", club: "Chelsea", marketValue: 130, salary: 8.0, contractUntil: "2033-06-30", height: 185, preferredFoot: "left" },
  { name: "Moises Caicedo", fullName: "Moises Isaac Caicedo Corozo", nationality: "Ecuador", age: 23, positionCluster: "DM", positionDetail: "Defensive Midfielder", club: "Chelsea", marketValue: 80, salary: 7.5, contractUntil: "2031-06-30", height: 178, preferredFoot: "right" },
  { name: "Enzo Fernandez", fullName: "Enzo Jeremias Fernandez", nationality: "Argentina", age: 24, positionCluster: "CM", positionDetail: "Central Midfielder", club: "Chelsea", marketValue: 65, salary: 10.0, contractUntil: "2032-06-30", height: 178, preferredFoot: "right" },
  { name: "Nicolas Jackson", fullName: "Nicolas Jackson", nationality: "Senegal", age: 23, positionCluster: "ST", positionDetail: "Centre Forward", club: "Chelsea", marketValue: 50, salary: 4.5, contractUntil: "2031-06-30", height: 186, preferredFoot: "right" },

  // === Manchester United ===
  { name: "Kobbie Mainoo", fullName: "Kobbie Mainoo", nationality: "England", age: 19, positionCluster: "CM", positionDetail: "Central Midfielder", club: "Manchester United", marketValue: 60, salary: 3.0, contractUntil: "2027-06-30", height: 180, preferredFoot: "right" },
  { name: "Alejandro Garnacho", fullName: "Alejandro Garnacho Ferreyra", nationality: "Argentina", age: 20, positionCluster: "W", positionDetail: "Left Winger", club: "Manchester United", marketValue: 50, salary: 3.5, contractUntil: "2028-06-30", height: 180, preferredFoot: "left" },
  { name: "Rasmus Hojlund", fullName: "Rasmus Winther Hojlund", nationality: "Denmark", age: 21, positionCluster: "ST", positionDetail: "Centre Forward", club: "Manchester United", marketValue: 50, salary: 5.0, contractUntil: "2028-06-30", height: 191, preferredFoot: "right" },
  { name: "Bruno Fernandes", fullName: "Bruno Miguel Borges Fernandes", nationality: "Portugal", age: 30, positionCluster: "AM", positionDetail: "Attacking Midfielder", club: "Manchester United", marketValue: 50, salary: 12.0, contractUntil: "2027-06-30", height: 179, preferredFoot: "right" },

  // === Tottenham Hotspur ===
  { name: "Son Heung-min", fullName: "Son Heung-min", nationality: "South Korea", age: 32, positionCluster: "W", positionDetail: "Left Winger / Forward", club: "Tottenham Hotspur", marketValue: 35, salary: 12.0, contractUntil: "2025-06-30", height: 183, preferredFoot: "right" },
  { name: "James Maddison", fullName: "James Daniel Maddison", nationality: "England", age: 28, positionCluster: "AM", positionDetail: "Attacking Midfielder", club: "Tottenham Hotspur", marketValue: 45, salary: 8.5, contractUntil: "2029-06-30", height: 175, preferredFoot: "right" },
  { name: "Micky van de Ven", fullName: "Micky van de Ven", nationality: "Netherlands", age: 23, positionCluster: "CB", positionDetail: "Centre Back", club: "Tottenham Hotspur", marketValue: 55, salary: 4.0, contractUntil: "2029-06-30", height: 193, preferredFoot: "left" },

  // === Newcastle United ===
  { name: "Alexander Isak", fullName: "Feyisayo Alexander Isak", nationality: "Sweden", age: 25, positionCluster: "ST", positionDetail: "Centre Forward", club: "Newcastle United", marketValue: 100, salary: 8.0, contractUntil: "2028-06-30", height: 192, preferredFoot: "right" },
  { name: "Anthony Gordon", fullName: "Anthony Gordon", nationality: "England", age: 24, positionCluster: "W", positionDetail: "Left Winger", club: "Newcastle United", marketValue: 55, salary: 4.5, contractUntil: "2029-06-30", height: 183, preferredFoot: "right" },
  { name: "Bruno Guimaraes", fullName: "Bruno Guimaraes Rodriguez Moura", nationality: "Brazil", age: 27, positionCluster: "CM", positionDetail: "Central Midfielder", club: "Newcastle United", marketValue: 80, salary: 7.0, contractUntil: "2028-06-30", height: 182, preferredFoot: "right" },

  // === Aston Villa ===
  { name: "Ollie Watkins", fullName: "Oliver Watkins", nationality: "England", age: 29, positionCluster: "ST", positionDetail: "Centre Forward", club: "Aston Villa", marketValue: 55, salary: 5.5, contractUntil: "2028-06-30", height: 180, preferredFoot: "right" },
  { name: "Emiliano Martinez", fullName: "Emiliano Martinez", nationality: "Argentina", age: 32, positionCluster: "GK", positionDetail: "Goalkeeper", club: "Aston Villa", marketValue: 30, salary: 6.0, contractUntil: "2027-06-30", height: 195, preferredFoot: "right" },

  // === Brighton & Hove Albion ===
  { name: "Kaoru Mitoma", fullName: "Kaoru Mitoma", nationality: "Japan", age: 27, positionCluster: "W", positionDetail: "Left Winger", club: "Brighton & Hove Albion", marketValue: 40, salary: 3.5, contractUntil: "2027-06-30", height: 178, preferredFoot: "right" },
  { name: "Joao Pedro", fullName: "Joao Pedro Junqueira de Jesus", nationality: "Brazil", age: 23, positionCluster: "ST", positionDetail: "Centre Forward / Second Striker", club: "Brighton & Hove Albion", marketValue: 40, salary: 3.0, contractUntil: "2028-06-30", height: 183, preferredFoot: "right" },

  // === Nottingham Forest ===
  { name: "Murillo", fullName: "Murillo Santiago Costa dos Santos", nationality: "Brazil", age: 22, positionCluster: "CB", positionDetail: "Centre Back", club: "Nottingham Forest", marketValue: 40, salary: 2.5, contractUntil: "2028-06-30", height: 183, preferredFoot: "right" },
  { name: "Morgan Gibbs-White", fullName: "Morgan Gibbs-White", nationality: "England", age: 25, positionCluster: "AM", positionDetail: "Attacking Midfielder", club: "Nottingham Forest", marketValue: 35, salary: 4.0, contractUntil: "2028-06-30", height: 176, preferredFoot: "right" },
  { name: "Nuno Tavares", fullName: "Nuno Alberto Tavares Mendes", nationality: "Portugal", age: 24, positionCluster: "FB", positionDetail: "Left Back", club: "Nottingham Forest", marketValue: 25, salary: 2.5, contractUntil: "2029-06-30", height: 183, preferredFoot: "left" },
  { name: "Chris Wood", fullName: "Christopher Grant Wood", nationality: "New Zealand", age: 33, positionCluster: "ST", positionDetail: "Centre Forward", club: "Nottingham Forest", marketValue: 8, salary: 3.0, contractUntil: "2026-06-30", height: 191, preferredFoot: "right" },
  { name: "Ola Aina", fullName: "Temitayo Olufisayo Olaoluwa Aina", nationality: "Nigeria", age: 28, positionCluster: "FB", positionDetail: "Right Back", club: "Nottingham Forest", marketValue: 12, salary: 2.0, contractUntil: "2027-06-30", height: 183, preferredFoot: "right" },
  { name: "Callum Hudson-Odoi", fullName: "Callum James Hudson-Odoi", nationality: "England", age: 24, positionCluster: "W", positionDetail: "Right Winger", club: "Nottingham Forest", marketValue: 20, salary: 3.5, contractUntil: "2027-06-30", height: 177, preferredFoot: "right" },
  { name: "Matz Sels", fullName: "Matz Sels", nationality: "Belgium", age: 32, positionCluster: "GK", positionDetail: "Goalkeeper", club: "Nottingham Forest", marketValue: 10, salary: 2.0, contractUntil: "2028-06-30", height: 188, preferredFoot: "right" },

  // === West Ham United ===
  { name: "Lucas Paqueta", fullName: "Lucas Tolentino Coelho de Lima", nationality: "Brazil", age: 27, positionCluster: "AM", positionDetail: "Attacking Midfielder", club: "West Ham United", marketValue: 40, salary: 7.0, contractUntil: "2027-06-30", height: 180, preferredFoot: "left" },
  { name: "Jarrod Bowen", fullName: "Jarrod Bowen", nationality: "England", age: 28, positionCluster: "W", positionDetail: "Right Winger", club: "West Ham United", marketValue: 40, salary: 6.5, contractUntil: "2030-06-30", height: 176, preferredFoot: "left" },

  // === Bournemouth ===
  { name: "Dominic Solanke", fullName: "Dominic Ayodele Solanke-Mitchell", nationality: "England", age: 27, positionCluster: "ST", positionDetail: "Centre Forward", club: "Bournemouth", marketValue: 35, salary: 5.0, contractUntil: "2029-06-30", height: 187, preferredFoot: "right" },
  { name: "Antoine Semenyo", fullName: "Antoine Semenyo", nationality: "Ghana", age: 24, positionCluster: "W", positionDetail: "Right Winger", club: "Bournemouth", marketValue: 25, salary: 2.5, contractUntil: "2029-06-30", height: 182, preferredFoot: "right" },

  // === Fulham ===
  { name: "Antonee Robinson", fullName: "Antonee Robinson", nationality: "United States", age: 27, positionCluster: "FB", positionDetail: "Left Back", club: "Fulham", marketValue: 25, salary: 3.0, contractUntil: "2028-06-30", height: 183, preferredFoot: "left" },
  { name: "Rodrigo Muniz", fullName: "Rodrigo Muniz Carvalho", nationality: "Brazil", age: 23, positionCluster: "ST", positionDetail: "Centre Forward", club: "Fulham", marketValue: 25, salary: 2.5, contractUntil: "2028-06-30", height: 185, preferredFoot: "right" },

  // === Crystal Palace ===
  { name: "Eberechi Eze", fullName: "Eberechi Eze", nationality: "England", age: 26, positionCluster: "AM", positionDetail: "Attacking Midfielder", club: "Crystal Palace", marketValue: 50, salary: 5.0, contractUntil: "2027-06-30", height: 180, preferredFoot: "right" },
  { name: "Marc Guehi", fullName: "Addji Keaninkin Marc-Israel Guehi", nationality: "England", age: 24, positionCluster: "CB", positionDetail: "Centre Back", club: "Crystal Palace", marketValue: 45, salary: 4.0, contractUntil: "2026-06-30", height: 182, preferredFoot: "right" },

  // === Wolverhampton Wanderers ===
  { name: "Matheus Cunha", fullName: "Matheus Santos Carneiro da Cunha", nationality: "Brazil", age: 25, positionCluster: "ST", positionDetail: "Centre Forward / Second Striker", club: "Wolverhampton Wanderers", marketValue: 45, salary: 5.0, contractUntil: "2028-06-30", height: 184, preferredFoot: "right" },

  // === Everton ===
  { name: "Jarrad Branthwaite", fullName: "Jarrad Branthwaite", nationality: "England", age: 22, positionCluster: "CB", positionDetail: "Centre Back", club: "Everton", marketValue: 45, salary: 3.0, contractUntil: "2027-06-30", height: 195, preferredFoot: "left" },

  // === Brentford ===
  { name: "Bryan Mbeumo", fullName: "Bryan Mbeumo", nationality: "Cameroon", age: 25, positionCluster: "W", positionDetail: "Right Winger", club: "Brentford", marketValue: 45, salary: 4.0, contractUntil: "2026-06-30", height: 175, preferredFoot: "left" },
  { name: "Yoane Wissa", fullName: "Yoane Wissa", nationality: "DR Congo", age: 28, positionCluster: "ST", positionDetail: "Centre Forward", club: "Brentford", marketValue: 25, salary: 3.0, contractUntil: "2027-06-30", height: 177, preferredFoot: "right" },

  // === Ipswich Town ===
  { name: "Liam Delap", fullName: "Liam Delap", nationality: "England", age: 21, positionCluster: "ST", positionDetail: "Centre Forward", club: "Ipswich Town", marketValue: 20, salary: 1.5, contractUntil: "2029-06-30", height: 186, preferredFoot: "right" },

  // === Leicester City ===
  { name: "Jamie Vardy", fullName: "Jamie Richard Vardy", nationality: "England", age: 38, positionCluster: "ST", positionDetail: "Centre Forward", club: "Leicester City", marketValue: 3, salary: 5.0, contractUntil: "2025-06-30", height: 179, preferredFoot: "right" },

  // === Southampton ===
  { name: "Tyler Dibling", fullName: "Tyler Dibling", nationality: "England", age: 18, positionCluster: "W", positionDetail: "Right Winger", club: "Southampton", marketValue: 15, salary: 0.5, contractUntil: "2027-06-30", height: 178, preferredFoot: "right" },
];

// Generate player IDs
const PLAYER_IDS: Record<string, string> = {};
for (const p of playerData) {
  PLAYER_IDS[p.name] = makeUuid(`player:${p.name}`);
}

// ============================================
// NEURAL ANALYSES — ~35 analyses from
// Nottingham Forest's perspective
// ============================================

interface AnalysisSeed {
  playerName: string;
  vx: number;
  rx: number;
  vxComponents: {
    technical: number;       // T: qualidade em bola (0-10)
    marketImpact: number;    // M: valor de marca/comercial (0-10)
    culturalAdaptation: number; // A: adaptação BHAR (0-10)
    networkingBenefit: number;  // N: rede de agentes, compatriotas (0-10)
    ageDepreciation: number;    // D: depreciação por idade (0-10, higher = worse)
    liabilities: number;        // L: salário + risco lesão (0-10, higher = worse)
    regulatoryRisk: number;     // R: trabalho visado, FFP (0-10, higher = worse)
    totalCost: number;          // C: custo total em milhões EUR (0-10 scale)
  };
  rxComponents: {
    tacticalGap: number;     // Tg: lacuna tática que preenche (0-10)
    contextualFit: number;   // Cx: encaixe no sistema/formação (0-10)
    experienceProfile: number; // Ep: experiência em contextos similares (0-10)
    narrativeIndex: number;  // Ni: narrativa mídia/vestiário (0-10)
    mentalFortitude: number; // Mf: temperamento em grandes jogos (0-10)
    injuryMicroRisk: number; // Mi: padrões de lesão crônica (0-10, higher = worse)
    suspensionRisk: number;  // S: histórico disciplinar (0-10, higher = worse)
    valueAtRisk: number;     // Va: exposição financeira (0-10, higher = worse)
    marketJitter: number;    // Mj: volatilidade do mercado (0-10, higher = worse)
  };
  c1Technical: number;
  c2Tactical: number;
  c3Physical: number;
  c4Behavioral: number;
  c5Narrative: number;
  c6Economic: number;
  c7Ai: number;
  ast: number;
  clf: number;
  gne: number;
  wse: number;
  rbl: number;
  sace: number;
  scnPlus: number;
  decision: Decision;
  confidence: number;
  reasoning: string;
  recommendedActions: string[];
  risks: string[];
  comparables: string[];
}

const analysisData: AnalysisSeed[] = [
  // --- CONTRATAR ---
  {
    playerName: "Marc Guehi",
    vx: 82, rx: 74,
    vxComponents: { technical: 7.8, marketImpact: 6.5, culturalAdaptation: 8.5, networkingBenefit: 7.0, ageDepreciation: 2.0, liabilities: 4.5, regulatoryRisk: 1.5, totalCost: 5.0 },
    rxComponents: { tacticalGap: 8.5, contextualFit: 8.0, experienceProfile: 7.0, narrativeIndex: 7.5, mentalFortitude: 8.5, injuryMicroRisk: 2.5, suspensionRisk: 1.0, valueAtRisk: 5.0, marketJitter: 4.0 },
    c1Technical: 78, c2Tactical: 84, c3Physical: 82, c4Behavioral: 88, c5Narrative: 72, c6Economic: 65, c7Ai: 80,
    ast: 79, clf: 82, gne: 85, wse: 77, rbl: 72, sace: 84, scnPlus: 79,
    decision: "CONTRATAR", confidence: 82,
    reasoning: "Zagueiro inglês com excelente leitura de jogo e capacidade de construção desde trás. Contrato curto com o Crystal Palace cria janela de oportunidade. Perfil comportamental exemplar, liderança natural. Encaixa perfeitamente na linha defensiva do Forest como upgrade significativo. Valor de mercado elevado mas contrato expirando em 2026 pode reduzir custo.",
    recommendedActions: ["Iniciar contato com Crystal Palace", "Propor contrato de 5 anos", "Oferta na faixa de 35-40M EUR"],
    risks: ["Concorrência de clubes maiores (Liverpool, Man Utd)", "Pode renovar com Palace"],
    comparables: ["William Saliba", "Levi Colwill"],
  },
  {
    playerName: "Bryan Mbeumo",
    vx: 80, rx: 78,
    vxComponents: { technical: 8.3, marketImpact: 6.0, culturalAdaptation: 7.5, networkingBenefit: 5.5, ageDepreciation: 2.5, liabilities: 4.0, regulatoryRisk: 2.0, totalCost: 4.5 },
    rxComponents: { tacticalGap: 8.0, contextualFit: 7.5, experienceProfile: 7.5, narrativeIndex: 7.0, mentalFortitude: 7.5, injuryMicroRisk: 2.0, suspensionRisk: 1.5, valueAtRisk: 4.5, marketJitter: 3.5 },
    c1Technical: 83, c2Tactical: 78, c3Physical: 77, c4Behavioral: 80, c5Narrative: 74, c6Economic: 78, c7Ai: 79,
    ast: 76, clf: 74, gne: 80, wse: 75, rbl: 78, sace: 73, scnPlus: 77,
    decision: "CONTRATAR", confidence: 78,
    reasoning: "Ponta direita do Brentford com números consistentes de gols e assistências. Temporada 2024/25 excelente com mais de 15 gols na Premier League. Contrato até 2026 cria oportunidade de negociação. Perfil versátil que pode atuar tanto pela direita como falso 9. Custo-benefício muito favorável para o Forest.",
    recommendedActions: ["Negociar com Brentford antes de janeiro", "Oferta de 30-35M EUR", "Salário competitivo de 4.5M/ano"],
    risks: ["Adaptação a sistema tático diferente", "Brentford pode exigir preço premium"],
    comparables: ["Jarrod Bowen", "Bukayo Saka"],
  },
  {
    playerName: "Antonee Robinson",
    vx: 76, rx: 80,
    vxComponents: { technical: 7.2, marketImpact: 5.0, culturalAdaptation: 7.8, networkingBenefit: 5.0, ageDepreciation: 3.0, liabilities: 3.5, regulatoryRisk: 2.5, totalCost: 3.5 },
    rxComponents: { tacticalGap: 7.0, contextualFit: 7.5, experienceProfile: 7.0, narrativeIndex: 6.5, mentalFortitude: 7.5, injuryMicroRisk: 2.0, suspensionRisk: 1.0, valueAtRisk: 3.5, marketJitter: 3.0 },
    c1Technical: 72, c2Tactical: 78, c3Physical: 86, c4Behavioral: 80, c5Narrative: 70, c6Economic: 82, c7Ai: 75,
    ast: 80, clf: 78, gne: 82, wse: 76, rbl: 82, sace: 78, scnPlus: 78,
    decision: "CONTRATAR", confidence: 75,
    reasoning: "Lateral esquerdo americano com excelente capacidade de projeção ofensiva. Um dos melhores laterais da Premier League em 2024/25 em termos de progressões e cruzamentos. Valor de mercado acessível para o nível de rendimento. Pode competir ou complementar Nuno Tavares no lado esquerdo.",
    recommendedActions: ["Avaliar custo total da operação", "Propor contrato de 4 anos"],
    risks: ["Fulham dificilmente venderá barato", "Nuno Tavares já ocupa posição"],
    comparables: ["Andrew Robertson", "Nuno Tavares"],
  },
  {
    playerName: "Eberechi Eze",
    vx: 84, rx: 72,
    vxComponents: { technical: 8.8, marketImpact: 7.5, culturalAdaptation: 8.0, networkingBenefit: 6.0, ageDepreciation: 2.5, liabilities: 5.0, regulatoryRisk: 1.5, totalCost: 6.0 },
    rxComponents: { tacticalGap: 8.0, contextualFit: 8.5, experienceProfile: 7.0, narrativeIndex: 8.0, mentalFortitude: 7.0, injuryMicroRisk: 3.0, suspensionRisk: 1.5, valueAtRisk: 6.0, marketJitter: 5.0 },
    c1Technical: 88, c2Tactical: 80, c3Physical: 78, c4Behavioral: 76, c5Narrative: 82, c6Economic: 60, c7Ai: 83,
    ast: 82, clf: 80, gne: 78, wse: 84, rbl: 68, sace: 80, scnPlus: 80,
    decision: "CONTRATAR", confidence: 80,
    reasoning: "Meia-atacante inglês de elite com capacidade de desequilíbrio individual. Dribles, passes decisivos e finalização de longa distância são armas letais. Seria o jogador mais talentoso tecnicamente do elenco do Forest. Custo alto mas potencial de valorização e impacto imediato justificam investimento.",
    recommendedActions: ["Preparar proposta de 45-50M EUR", "Contrato de 5 anos com cláusula de revenda"],
    risks: ["Valor elevado para o orçamento do Forest", "Concorrência de Tottenham e Arsenal"],
    comparables: ["Morgan Gibbs-White", "James Maddison"],
  },
  {
    playerName: "Matheus Cunha",
    vx: 81, rx: 73,
    vxComponents: { technical: 8.4, marketImpact: 6.5, culturalAdaptation: 9.0, networkingBenefit: 8.0, ageDepreciation: 2.5, liabilities: 5.0, regulatoryRisk: 2.0, totalCost: 5.5 },
    rxComponents: { tacticalGap: 8.0, contextualFit: 7.5, experienceProfile: 7.5, narrativeIndex: 7.0, mentalFortitude: 7.0, injuryMicroRisk: 2.5, suspensionRisk: 4.0, valueAtRisk: 5.5, marketJitter: 4.0 },
    c1Technical: 84, c2Tactical: 79, c3Physical: 80, c4Behavioral: 72, c5Narrative: 76, c6Economic: 65, c7Ai: 80,
    ast: 78, clf: 84, gne: 76, wse: 80, rbl: 70, sace: 82, scnPlus: 78,
    decision: "CONTRATAR", confidence: 76,
    reasoning: "Atacante brasileiro versátil que pode atuar como centroavante ou segundo atacante. Temporada excepcional no Wolves com mais de 12 gols. Adaptação cultural facilitada pela presença de outros brasileiros no elenco (Murillo). Qualidade técnica acima da média, capaz de criar e finalizar. Wolves em dificuldades pode facilitar negociação.",
    recommendedActions: ["Iniciar negociações com Wolves", "Proposta de 40M EUR", "Salário de 5M/ano"],
    risks: ["Histórico de cartões e indisciplina", "Wolves pode resistir venda a rival direto"],
    comparables: ["Chris Wood", "Ollie Watkins"],
  },
  {
    playerName: "Dominik Szoboszlai",
    vx: 79, rx: 70,
    vxComponents: { technical: 8.0, marketImpact: 6.5, culturalAdaptation: 7.0, networkingBenefit: 5.0, ageDepreciation: 2.0, liabilities: 6.5, regulatoryRisk: 2.0, totalCost: 7.0 },
    rxComponents: { tacticalGap: 7.5, contextualFit: 7.0, experienceProfile: 7.0, narrativeIndex: 7.0, mentalFortitude: 7.5, injuryMicroRisk: 2.5, suspensionRisk: 1.5, valueAtRisk: 7.0, marketJitter: 5.0 },
    c1Technical: 80, c2Tactical: 76, c3Physical: 82, c4Behavioral: 78, c5Narrative: 72, c6Economic: 58, c7Ai: 78,
    ast: 74, clf: 76, gne: 72, wse: 78, rbl: 66, sace: 76, scnPlus: 74,
    decision: "CONTRATAR", confidence: 68,
    reasoning: "Meia húngaro com grande dinamismo e capacidade de cobertura de terreno. Ainda não atingiu o pico no Liverpool, o que pode gerar oportunidade se o clube decidir renovar o setor. Perfil físico e técnico complementar ao de Gibbs-White. Operação complexa mas não impossível dada a profundidade do elenco do Liverpool.",
    recommendedActions: ["Monitorar situação no Liverpool", "Sondar disponibilidade via empréstimo"],
    risks: ["Liverpool dificilmente venderá", "Custo muito elevado", "Pode não querer rebaixar nível"],
    comparables: ["Martin Odegaard", "Morgan Gibbs-White"],
  },

  // --- BLINDAR ---
  {
    playerName: "Murillo",
    vx: 85, rx: 88,
    vxComponents: { technical: 8.0, marketImpact: 7.5, culturalAdaptation: 9.0, networkingBenefit: 8.5, ageDepreciation: 1.0, liabilities: 2.5, regulatoryRisk: 1.0, totalCost: 3.0 },
    rxComponents: { tacticalGap: 9.0, contextualFit: 9.5, experienceProfile: 7.5, narrativeIndex: 8.0, mentalFortitude: 8.5, injuryMicroRisk: 1.5, suspensionRisk: 2.0, valueAtRisk: 3.0, marketJitter: 2.5 },
    c1Technical: 80, c2Tactical: 82, c3Physical: 88, c4Behavioral: 85, c5Narrative: 82, c6Economic: 90, c7Ai: 86,
    ast: 85, clf: 88, gne: 90, wse: 82, rbl: 88, sace: 90, scnPlus: 86,
    decision: "BLINDAR", confidence: 95,
    reasoning: "Ativo mais valioso do elenco do Forest. Zagueiro brasileiro jovem que já se firmou como titular absoluto e atrai interesse de clubes da elite europeia (Real Madrid, Chelsea). Contrato até 2028 oferece proteção mas é essencial blindar com extensão e cláusula de rescisão elevada. Rendimento excepcional na temporada com números defensivos de elite.",
    recommendedActions: ["Renovar contrato até 2030 imediatamente", "Inserir cláusula de rescisão de 80M EUR", "Aumento salarial para 5M/ano"],
    risks: ["Ofertas irrecusáveis de clubes top", "Jogador pode pressionar por transferência"],
    comparables: ["William Saliba", "Josko Gvardiol"],
  },
  {
    playerName: "Morgan Gibbs-White",
    vx: 80, rx: 85,
    vxComponents: { technical: 8.2, marketImpact: 7.0, culturalAdaptation: 9.5, networkingBenefit: 8.0, ageDepreciation: 2.5, liabilities: 4.0, regulatoryRisk: 1.0, totalCost: 4.0 },
    rxComponents: { tacticalGap: 9.5, contextualFit: 9.0, experienceProfile: 8.0, narrativeIndex: 8.5, mentalFortitude: 8.0, injuryMicroRisk: 2.5, suspensionRisk: 2.0, valueAtRisk: 4.0, marketJitter: 3.0 },
    c1Technical: 82, c2Tactical: 80, c3Physical: 76, c4Behavioral: 78, c5Narrative: 84, c6Economic: 85, c7Ai: 81,
    ast: 84, clf: 88, gne: 88, wse: 85, rbl: 84, sace: 88, scnPlus: 84,
    decision: "BLINDAR", confidence: 90,
    reasoning: "Capitão e alma do time. Gibbs-White é o jogador mais importante taticamente para o Forest, sendo o principal criador de jogadas e elo entre defesa e ataque. Identidade total com o clube e a torcida. Qualquer saída seria catastrófica para o projeto. Deve ser blindado com renovação e valorização salarial.",
    recommendedActions: ["Renovar até 2030 com melhoria salarial", "Cláusula de rescisão de 60M EUR", "Status de capitão mantido"],
    risks: ["Interesse de clubes maiores", "Expectativas salariais crescentes"],
    comparables: ["James Maddison", "Eberechi Eze"],
  },
  {
    playerName: "Nuno Tavares",
    vx: 78, rx: 84,
    vxComponents: { technical: 7.2, marketImpact: 6.0, culturalAdaptation: 8.5, networkingBenefit: 7.0, ageDepreciation: 2.0, liabilities: 2.5, regulatoryRisk: 1.5, totalCost: 3.0 },
    rxComponents: { tacticalGap: 8.5, contextualFit: 9.0, experienceProfile: 7.0, narrativeIndex: 7.5, mentalFortitude: 7.0, injuryMicroRisk: 3.0, suspensionRisk: 1.5, valueAtRisk: 3.0, marketJitter: 3.0 },
    c1Technical: 72, c2Tactical: 74, c3Physical: 88, c4Behavioral: 74, c5Narrative: 78, c6Economic: 86, c7Ai: 77,
    ast: 80, clf: 82, gne: 84, wse: 78, rbl: 84, sace: 80, scnPlus: 80,
    decision: "BLINDAR", confidence: 85,
    reasoning: "Lateral esquerdo português que se tornou um dos melhores da Premier League em assistências. Capacidade ofensiva excepcional, motor físico incansável. Chegou do Lazio por empréstimo e foi contratado definitivamente. Essencial garantir contrato de longo prazo antes que clubes maiores façam propostas. Peça-chave no sistema de Nuno Espirito Santo.",
    recommendedActions: ["Extensão contratual até 2031", "Cláusula de rescisão de 50M EUR"],
    risks: ["Fragilidades defensivas em jogos grandes", "Pode atrair atenção de clubes da Champions League"],
    comparables: ["Andrew Robertson", "Antonee Robinson"],
  },
  {
    playerName: "Chris Wood",
    vx: 72, rx: 86,
    vxComponents: { technical: 6.8, marketImpact: 5.5, culturalAdaptation: 9.0, networkingBenefit: 6.0, ageDepreciation: 7.0, liabilities: 3.0, regulatoryRisk: 1.0, totalCost: 2.0 },
    rxComponents: { tacticalGap: 9.0, contextualFit: 9.5, experienceProfile: 9.0, narrativeIndex: 8.5, mentalFortitude: 9.0, injuryMicroRisk: 4.0, suspensionRisk: 1.0, valueAtRisk: 2.0, marketJitter: 1.5 },
    c1Technical: 68, c2Tactical: 74, c3Physical: 72, c4Behavioral: 90, c5Narrative: 88, c6Economic: 92, c7Ai: 76,
    ast: 78, clf: 90, gne: 78, wse: 82, rbl: 90, sace: 88, scnPlus: 82,
    decision: "BLINDAR", confidence: 88,
    reasoning: "Artilheiro da equipe na temporada com mais de 15 gols na Premier League. Aos 33 anos, vive a melhor fase da carreira. Custo-benefício extraordinário. Referência de profissionalismo e mentalidade para o elenco jovem. Contrato até 2026 precisa ser estendido por mais 1-2 temporadas para garantir continuidade do projeto.",
    recommendedActions: ["Renovar por mais 2 anos até 2028", "Manter estrutura salarial atual", "Papel de mentor para atacantes jovens"],
    risks: ["Declínio natural pela idade", "Lesões mais frequentes"],
    comparables: ["Jamie Vardy", "Ivan Toney"],
  },
  {
    playerName: "Callum Hudson-Odoi",
    vx: 76, rx: 82,
    vxComponents: { technical: 8.0, marketImpact: 5.5, culturalAdaptation: 9.0, networkingBenefit: 7.0, ageDepreciation: 2.0, liabilities: 3.5, regulatoryRisk: 1.0, totalCost: 3.0 },
    rxComponents: { tacticalGap: 8.0, contextualFit: 9.0, experienceProfile: 7.5, narrativeIndex: 7.5, mentalFortitude: 7.0, injuryMicroRisk: 4.5, suspensionRisk: 1.0, valueAtRisk: 3.0, marketJitter: 2.5 },
    c1Technical: 80, c2Tactical: 74, c3Physical: 76, c4Behavioral: 76, c5Narrative: 78, c6Economic: 84, c7Ai: 77,
    ast: 76, clf: 82, gne: 80, wse: 78, rbl: 82, sace: 80, scnPlus: 78,
    decision: "BLINDAR", confidence: 82,
    reasoning: "Ponta com qualidade técnica de elite que encontrou regularidade no Forest após anos inconsistentes no Chelsea. Capacidade de desequilíbrio no 1v1 é essencial para o sistema ofensivo. Contrato até 2027 ainda oferece margem, mas renovar agora garante proteção contra assédio.",
    recommendedActions: ["Propor extensão até 2029", "Cláusula de rescisão de 35M EUR"],
    risks: ["Histórico de lesões", "Inconsistência em jogos decisivos"],
    comparables: ["Anthony Gordon", "Kaoru Mitoma"],
  },

  // --- MONITORAR ---
  {
    playerName: "Cole Palmer",
    vx: 92, rx: 45,
    vxComponents: { technical: 9.4, marketImpact: 9.0, culturalAdaptation: 6.5, networkingBenefit: 4.0, ageDepreciation: 1.0, liabilities: 8.0, regulatoryRisk: 1.0, totalCost: 9.5 },
    rxComponents: { tacticalGap: 7.0, contextualFit: 8.0, experienceProfile: 7.0, narrativeIndex: 9.0, mentalFortitude: 8.0, injuryMicroRisk: 1.5, suspensionRisk: 1.0, valueAtRisk: 9.5, marketJitter: 8.0 },
    c1Technical: 94, c2Tactical: 88, c3Physical: 80, c4Behavioral: 82, c5Narrative: 90, c6Economic: 28, c7Ai: 91,
    ast: 82, clf: 68, gne: 65, wse: 90, rbl: 38, sace: 72, scnPlus: 72,
    decision: "MONITORAR", confidence: 70,
    reasoning: "Talento generacional que está entre os melhores jogadores do mundo em 2024/25. Contrato longuíssimo com o Chelsea (até 2033) e valor de mercado proibitivo tornam qualquer operação impossível no momento. Monitorar evolução para cenários futuros improváveis mas não impossíveis (queda de rendimento, insatisfação no clube).",
    recommendedActions: ["Acompanhar evolução tática e física", "Manter relação com entourage"],
    risks: ["Operação financeiramente inviável", "Zero probabilidade de saída no curto prazo"],
    comparables: ["Bukayo Saka", "Phil Foden"],
  },
  {
    playerName: "Alexander Isak",
    vx: 88, rx: 48,
    vxComponents: { technical: 8.7, marketImpact: 8.0, culturalAdaptation: 7.0, networkingBenefit: 5.0, ageDepreciation: 2.5, liabilities: 8.0, regulatoryRisk: 1.5, totalCost: 9.0 },
    rxComponents: { tacticalGap: 9.0, contextualFit: 8.0, experienceProfile: 8.0, narrativeIndex: 7.5, mentalFortitude: 8.0, injuryMicroRisk: 2.0, suspensionRisk: 1.0, valueAtRisk: 9.0, marketJitter: 6.0 },
    c1Technical: 87, c2Tactical: 84, c3Physical: 85, c4Behavioral: 84, c5Narrative: 80, c6Economic: 32, c7Ai: 86,
    ast: 80, clf: 72, gne: 82, wse: 86, rbl: 42, sace: 76, scnPlus: 74,
    decision: "MONITORAR", confidence: 65,
    reasoning: "Um dos melhores centroavantes da Premier League. Combinação rara de velocidade, técnica e finalização. Newcastle em projeto ambicioso torna saída improvável, mas vale monitorar qualquer mudança de cenário. Seria transformacional para o ataque do Forest.",
    recommendedActions: ["Monitorar situação contratual", "Acompanhar projeto do Newcastle"],
    risks: ["Custo totalmente fora do alcance", "Newcastle não precisa vender"],
    comparables: ["Erling Haaland", "Ollie Watkins"],
  },
  {
    playerName: "Liam Delap",
    vx: 74, rx: 72,
    vxComponents: { technical: 7.0, marketImpact: 4.5, culturalAdaptation: 8.0, networkingBenefit: 5.0, ageDepreciation: 1.0, liabilities: 1.5, regulatoryRisk: 1.5, totalCost: 3.0 },
    rxComponents: { tacticalGap: 7.5, contextualFit: 7.0, experienceProfile: 5.0, narrativeIndex: 6.0, mentalFortitude: 7.0, injuryMicroRisk: 3.0, suspensionRisk: 1.5, valueAtRisk: 3.0, marketJitter: 4.0 },
    c1Technical: 70, c2Tactical: 68, c3Physical: 82, c4Behavioral: 76, c5Narrative: 68, c6Economic: 74, c7Ai: 72,
    ast: 68, clf: 72, gne: 74, wse: 70, rbl: 72, sace: 74, scnPlus: 71,
    decision: "MONITORAR", confidence: 65,
    reasoning: "Jovem atacante inglês que impressionou na primeira temporada do Ipswich na Premier League. Físico imponente e boa movimentação. Se Ipswich for rebaixado, pode haver oportunidade de contratação a preço razoável. Perfil complementar a Chris Wood como opção mais jovem.",
    recommendedActions: ["Acompanhar desempenho até fim da temporada", "Sondar em caso de rebaixamento do Ipswich"],
    risks: ["Pode não se adaptar a nível mais alto", "Outros clubes também monitoram"],
    comparables: ["Chris Wood", "Dominic Solanke"],
  },
  {
    playerName: "Jarrad Branthwaite",
    vx: 80, rx: 65,
    vxComponents: { technical: 7.6, marketImpact: 6.0, culturalAdaptation: 8.0, networkingBenefit: 5.5, ageDepreciation: 1.0, liabilities: 3.0, regulatoryRisk: 1.5, totalCost: 5.5 },
    rxComponents: { tacticalGap: 8.5, contextualFit: 8.0, experienceProfile: 6.0, narrativeIndex: 7.0, mentalFortitude: 7.5, injuryMicroRisk: 3.5, suspensionRisk: 1.5, valueAtRisk: 5.5, marketJitter: 5.0 },
    c1Technical: 76, c2Tactical: 80, c3Physical: 84, c4Behavioral: 82, c5Narrative: 72, c6Economic: 55, c7Ai: 79,
    ast: 78, clf: 76, gne: 72, wse: 80, rbl: 62, sace: 78, scnPlus: 75,
    decision: "MONITORAR", confidence: 70,
    reasoning: "Zagueiro inglês jovem e promissor que já atraiu interesse do Manchester United. Se Everton tiver dificuldades financeiras, pode surgir oportunidade. Perfil alto, forte no jogo aéreo e bom com bola nos pés. Parceria com Murillo seria formidável. Monitorar situação financeira do Everton.",
    recommendedActions: ["Acompanhar situação financeira do Everton", "Preparar proposta para cenário de venda forçada"],
    risks: ["Man Utd tem interesse prioritário", "Everton pode exigir 60M+"],
    comparables: ["Murillo", "William Saliba"],
  },
  {
    playerName: "Joao Pedro",
    vx: 77, rx: 68,
    vxComponents: { technical: 7.8, marketImpact: 5.5, culturalAdaptation: 8.5, networkingBenefit: 8.0, ageDepreciation: 1.5, liabilities: 3.0, regulatoryRisk: 2.0, totalCost: 5.0 },
    rxComponents: { tacticalGap: 7.5, contextualFit: 7.5, experienceProfile: 6.5, narrativeIndex: 6.5, mentalFortitude: 7.0, injuryMicroRisk: 2.0, suspensionRisk: 1.5, valueAtRisk: 5.0, marketJitter: 5.0 },
    c1Technical: 78, c2Tactical: 74, c3Physical: 76, c4Behavioral: 74, c5Narrative: 70, c6Economic: 62, c7Ai: 75,
    ast: 72, clf: 80, gne: 70, wse: 76, rbl: 66, sace: 80, scnPlus: 73,
    decision: "MONITORAR", confidence: 62,
    reasoning: "Atacante brasileiro versátil do Brighton com boa adaptação à Premier League. Pode atuar como centroavante ou segundo atacante. Conexão cultural com Murillo e outros brasileiros do elenco facilitaria integração. Brighton historicamente aberto a negociações, mas preço pode ser elevado.",
    recommendedActions: ["Monitorar evolução na temporada", "Avaliar em janela de verão"],
    risks: ["Brighton tende a valorizar muito seus ativos", "Adaptação a estilo diferente"],
    comparables: ["Matheus Cunha", "Rodrigo Muniz"],
  },
  {
    playerName: "Antoine Semenyo",
    vx: 73, rx: 74,
    vxComponents: { technical: 7.2, marketImpact: 4.5, culturalAdaptation: 7.5, networkingBenefit: 5.0, ageDepreciation: 2.0, liabilities: 2.5, regulatoryRisk: 2.0, totalCost: 3.5 },
    rxComponents: { tacticalGap: 7.0, contextualFit: 7.0, experienceProfile: 6.5, narrativeIndex: 6.0, mentalFortitude: 7.0, injuryMicroRisk: 2.5, suspensionRisk: 2.0, valueAtRisk: 3.5, marketJitter: 3.5 },
    c1Technical: 72, c2Tactical: 70, c3Physical: 82, c4Behavioral: 76, c5Narrative: 68, c6Economic: 76, c7Ai: 72,
    ast: 70, clf: 72, gne: 74, wse: 72, rbl: 74, sace: 74, scnPlus: 72,
    decision: "MONITORAR", confidence: 60,
    reasoning: "Ponta rápida e potente do Bournemouth com boa capacidade de progressão. Perfil físico que se encaixaria no estilo do Forest sob Nuno. Custo acessível e margem de crescimento. Monitorar para janela futura como reforço para profundidade do elenco.",
    recommendedActions: ["Continuar monitoramento", "Avaliar em janeiro se houver necessidade"],
    risks: ["Ainda precisa melhorar finalização", "Bournemouth em ascensão pode dificultar"],
    comparables: ["Callum Hudson-Odoi", "Anthony Gordon"],
  },
  {
    playerName: "Tyler Dibling",
    vx: 68, rx: 70,
    vxComponents: { technical: 7.2, marketImpact: 3.5, culturalAdaptation: 7.5, networkingBenefit: 4.0, ageDepreciation: 0.5, liabilities: 0.5, regulatoryRisk: 1.5, totalCost: 2.0 },
    rxComponents: { tacticalGap: 6.5, contextualFit: 6.0, experienceProfile: 3.5, narrativeIndex: 5.5, mentalFortitude: 6.0, injuryMicroRisk: 1.5, suspensionRisk: 1.0, valueAtRisk: 2.0, marketJitter: 5.0 },
    c1Technical: 72, c2Tactical: 64, c3Physical: 70, c4Behavioral: 68, c5Narrative: 66, c6Economic: 78, c7Ai: 68,
    ast: 62, clf: 68, gne: 66, wse: 66, rbl: 72, sace: 66, scnPlus: 67,
    decision: "MONITORAR", confidence: 58,
    reasoning: "Jovem promessa do Southampton de apenas 18 anos. Se o Southampton for rebaixado, pode haver janela para contratação a custo baixo. Talento bruto impressionante, mas ainda muito cru. Aposta de médio prazo com alto potencial de valorização.",
    recommendedActions: ["Monitorar desenvolvimento", "Avaliar em caso de rebaixamento do Southampton"],
    risks: ["Muito jovem e sem consistência", "Outros clubes maiores interessados"],
    comparables: ["Bukayo Saka (aos 18)", "Morgan Gibbs-White (jovem)"],
  },
  {
    playerName: "Rodrigo Muniz",
    vx: 74, rx: 72,
    vxComponents: { technical: 7.4, marketImpact: 5.0, culturalAdaptation: 8.5, networkingBenefit: 7.5, ageDepreciation: 1.5, liabilities: 2.5, regulatoryRisk: 2.0, totalCost: 3.5 },
    rxComponents: { tacticalGap: 7.5, contextualFit: 7.0, experienceProfile: 6.0, narrativeIndex: 6.0, mentalFortitude: 7.0, injuryMicroRisk: 2.0, suspensionRisk: 1.5, valueAtRisk: 3.5, marketJitter: 4.5 },
    c1Technical: 74, c2Tactical: 72, c3Physical: 78, c4Behavioral: 74, c5Narrative: 68, c6Economic: 74, c7Ai: 73,
    ast: 72, clf: 78, gne: 72, wse: 74, rbl: 72, sace: 78, scnPlus: 73,
    decision: "MONITORAR", confidence: 62,
    reasoning: "Centroavante brasileiro do Fulham com boa temporada de gols. Jovem, com margem de evolução e perfil que se adaptaria ao futebol do Forest. Presença de compatriotas no elenco ajudaria na integração. Alternativa viável caso Chris Wood perca rendimento.",
    recommendedActions: ["Acompanhar números de gols e assistências", "Avaliar na pré-temporada"],
    risks: ["Fulham pode exigir valor alto", "Inconsistência em jogos fora"],
    comparables: ["Chris Wood", "Matheus Cunha"],
  },

  // --- EMPRESTIMO ---
  {
    playerName: "Alejandro Garnacho",
    vx: 75, rx: 68,
    vxComponents: { technical: 7.8, marketImpact: 6.0, culturalAdaptation: 6.5, networkingBenefit: 5.5, ageDepreciation: 0.5, liabilities: 3.5, regulatoryRisk: 2.0, totalCost: 4.0 },
    rxComponents: { tacticalGap: 7.0, contextualFit: 6.5, experienceProfile: 5.5, narrativeIndex: 7.0, mentalFortitude: 6.0, injuryMicroRisk: 1.5, suspensionRisk: 3.0, valueAtRisk: 4.0, marketJitter: 5.5 },
    c1Technical: 78, c2Tactical: 68, c3Physical: 80, c4Behavioral: 66, c5Narrative: 74, c6Economic: 60, c7Ai: 74,
    ast: 70, clf: 68, gne: 72, wse: 74, rbl: 64, sace: 68, scnPlus: 70,
    decision: "EMPRESTIMO", confidence: 72,
    reasoning: "Jovem ponta argentino com talento evidente mas que não consegue se firmar no Manchester United. Empréstimo pode ser viável se o United decidir ceder temporariamente para ganhar experiência. Habilidade de drible e velocidade agregariam ao ataque do Forest. Risco comportamental moderado precisa ser avaliado.",
    recommendedActions: ["Sondar Man Utd sobre empréstimo com opção de compra", "Oferecer projeto de minutos garantidos"],
    risks: ["Comportamento inconsistente", "Man Utd pode preferir vender definitivamente"],
    comparables: ["Callum Hudson-Odoi", "Anthony Gordon"],
  },
  {
    playerName: "Enzo Fernandez",
    vx: 78, rx: 55,
    vxComponents: { technical: 8.2, marketImpact: 7.0, culturalAdaptation: 6.0, networkingBenefit: 6.5, ageDepreciation: 2.0, liabilities: 8.5, regulatoryRisk: 1.5, totalCost: 8.0 },
    rxComponents: { tacticalGap: 7.5, contextualFit: 7.0, experienceProfile: 7.0, narrativeIndex: 6.5, mentalFortitude: 7.5, injuryMicroRisk: 2.0, suspensionRisk: 2.5, valueAtRisk: 8.0, marketJitter: 7.0 },
    c1Technical: 82, c2Tactical: 80, c3Physical: 76, c4Behavioral: 72, c5Narrative: 68, c6Economic: 40, c7Ai: 76,
    ast: 76, clf: 74, gne: 68, wse: 80, rbl: 52, sace: 70, scnPlus: 70,
    decision: "EMPRESTIMO", confidence: 60,
    reasoning: "Meia argentino que custou 120M EUR ao Chelsea mas não conseguiu justificar o investimento. Se Chelsea buscar reestruturar elenco, empréstimo pode ser possível. Qualidade inegável como meio-campista box-to-box. Salário alto seria obstáculo, mas divisão de custos pode viabilizar.",
    recommendedActions: ["Monitorar situação no Chelsea", "Preparar proposta de empréstimo com divisão salarial"],
    risks: ["Salário muito elevado", "Chelsea pode não querer emprestar", "Adaptação ao estilo Forest"],
    comparables: ["Bruno Guimaraes", "Alexis Mac Allister"],
  },

  // --- RECUSAR ---
  {
    playerName: "Kevin De Bruyne",
    vx: 70, rx: 32,
    vxComponents: { technical: 9.2, marketImpact: 8.0, culturalAdaptation: 6.0, networkingBenefit: 4.0, ageDepreciation: 8.0, liabilities: 9.5, regulatoryRisk: 3.0, totalCost: 8.5 },
    rxComponents: { tacticalGap: 6.0, contextualFit: 6.5, experienceProfile: 9.5, narrativeIndex: 8.0, mentalFortitude: 8.5, injuryMicroRisk: 8.5, suspensionRisk: 1.0, valueAtRisk: 8.5, marketJitter: 7.0 },
    c1Technical: 92, c2Tactical: 90, c3Physical: 55, c4Behavioral: 82, c5Narrative: 78, c6Economic: 18, c7Ai: 68,
    ast: 65, clf: 58, gne: 45, wse: 72, rbl: 28, sace: 55, scnPlus: 55,
    decision: "RECUSAR", confidence: 88,
    reasoning: "Apesar de ser um dos melhores meias da história da Premier League, De Bruyne aos 33 anos com histórico recente de lesões graves e salário de 20M/ano é inviável para o Forest. Contrato expirando em 2025 pode gerar rumores, mas o custo salarial e o risco físico tornam a operação proibitiva. Não se encaixa no perfil de contratações do projeto.",
    recommendedActions: ["Não prosseguir", "Focar em alternativas mais jovens e acessíveis"],
    risks: ["Salário destruiria estrutura salarial", "Alto risco de lesões", "Curva descendente"],
    comparables: ["Bruno Fernandes", "Martin Odegaard"],
  },
  {
    playerName: "Jamie Vardy",
    vx: 50, rx: 55,
    vxComponents: { technical: 5.8, marketImpact: 5.0, culturalAdaptation: 7.0, networkingBenefit: 3.0, ageDepreciation: 9.5, liabilities: 5.0, regulatoryRisk: 1.0, totalCost: 2.5 },
    rxComponents: { tacticalGap: 5.0, contextualFit: 5.5, experienceProfile: 9.0, narrativeIndex: 7.5, mentalFortitude: 9.0, injuryMicroRisk: 7.5, suspensionRisk: 2.0, valueAtRisk: 2.5, marketJitter: 2.0 },
    c1Technical: 58, c2Tactical: 65, c3Physical: 40, c4Behavioral: 80, c5Narrative: 75, c6Economic: 70, c7Ai: 55,
    ast: 55, clf: 50, gne: 40, wse: 55, rbl: 60, sace: 48, scnPlus: 52,
    decision: "RECUSAR", confidence: 90,
    reasoning: "Lenda do Leicester aos 38 anos. Contrato expirando em 2025. Apesar da mentalidade competitiva exemplar, o declínio físico é evidente e não agregaria ao elenco que já conta com Chris Wood na mesma função. Não faz sentido para o projeto de médio-longo prazo do Forest.",
    recommendedActions: ["Não prosseguir com qualquer abordagem"],
    risks: ["Idade avançada", "Não agrega ao projeto"],
    comparables: ["Chris Wood"],
  },
  {
    playerName: "Son Heung-min",
    vx: 72, rx: 35,
    vxComponents: { technical: 8.5, marketImpact: 8.5, culturalAdaptation: 5.5, networkingBenefit: 4.0, ageDepreciation: 7.5, liabilities: 9.0, regulatoryRisk: 2.5, totalCost: 7.0 },
    rxComponents: { tacticalGap: 6.5, contextualFit: 6.0, experienceProfile: 9.0, narrativeIndex: 8.5, mentalFortitude: 8.5, injuryMicroRisk: 5.0, suspensionRisk: 1.0, valueAtRisk: 7.0, marketJitter: 6.0 },
    c1Technical: 85, c2Tactical: 82, c3Physical: 60, c4Behavioral: 90, c5Narrative: 85, c6Economic: 20, c7Ai: 72,
    ast: 68, clf: 62, gne: 50, wse: 70, rbl: 30, sace: 60, scnPlus: 58,
    decision: "RECUSAR", confidence: 85,
    reasoning: "Jogador de classe mundial mas aos 32 anos com salário de 12M/ano está completamente fora dos parâmetros do Forest. Contrato expirando em 2025 poderia gerar interesse teórico, mas o custo salarial e a idade avançada não justificam o investimento. Perfil não se alinha com a política de contratações focada em valorização.",
    recommendedActions: ["Não prosseguir"],
    risks: ["Salário proibitivo", "Idade", "Não se encaixa no perfil"],
    comparables: ["Mohamed Salah", "Jarrod Bowen"],
  },

  // --- ALERTA_CINZA ---
  {
    playerName: "Lucas Paqueta",
    vx: 76, rx: 42,
    vxComponents: { technical: 8.2, marketImpact: 6.0, culturalAdaptation: 8.0, networkingBenefit: 7.5, ageDepreciation: 3.0, liabilities: 7.0, regulatoryRisk: 9.5, totalCost: 6.0 },
    rxComponents: { tacticalGap: 7.5, contextualFit: 7.0, experienceProfile: 7.5, narrativeIndex: 2.0, mentalFortitude: 5.0, injuryMicroRisk: 2.0, suspensionRisk: 9.5, valueAtRisk: 6.0, marketJitter: 8.0 },
    c1Technical: 82, c2Tactical: 78, c3Physical: 74, c4Behavioral: 30, c5Narrative: 35, c6Economic: 48, c7Ai: 58,
    ast: 72, clf: 65, gne: 60, wse: 74, rbl: 32, sace: 38, scnPlus: 55,
    decision: "ALERTA_CINZA", confidence: 92,
    reasoning: "Meia brasileiro talentoso mas sob investigação da FA por suspeita de manipulação de resultados (cartões amarelos propositais para apostas). Caso ainda em andamento com possibilidade de banimento. RISCO REPUTACIONAL E LEGAL EXTREMO. Independentemente da qualidade técnica, qualquer associação com o jogador pode comprometer a imagem do clube e gerar sanções. Proibido prosseguir até resolução completa do caso.",
    recommendedActions: ["NENHUMA AÇÃO - Aguardar resolução do caso pela FA", "Proibir qualquer contato com representantes"],
    risks: ["Banimento potencial do futebol", "Risco reputacional severo", "Sanções ao clube contratante"],
    comparables: [],
  },
  {
    playerName: "Bruno Fernandes",
    vx: 74, rx: 50,
    vxComponents: { technical: 8.4, marketImpact: 7.0, culturalAdaptation: 6.0, networkingBenefit: 5.5, ageDepreciation: 5.0, liabilities: 8.5, regulatoryRisk: 2.0, totalCost: 7.5 },
    rxComponents: { tacticalGap: 7.0, contextualFit: 7.0, experienceProfile: 8.5, narrativeIndex: 4.5, mentalFortitude: 5.5, injuryMicroRisk: 2.5, suspensionRisk: 5.5, valueAtRisk: 7.5, marketJitter: 5.0 },
    c1Technical: 84, c2Tactical: 80, c3Physical: 68, c4Behavioral: 58, c5Narrative: 60, c6Economic: 40, c7Ai: 68,
    ast: 72, clf: 60, gne: 55, wse: 76, rbl: 48, sace: 55, scnPlus: 62,
    decision: "ALERTA_CINZA", confidence: 75,
    reasoning: "Capitão do Manchester United com qualidade técnica inegável mas comportamento em campo problemático (simulações, reclamações constantes com árbitros, linguagem corporal negativa quando as coisas não vão bem). Aos 30 anos, salário de 12M/ano e com queda de rendimento recente. Potencial impacto negativo no vestiário. Alerta cinza por riscos comportamentais e culturais que podem contaminar o grupo.",
    recommendedActions: ["Não prosseguir sem avaliação comportamental profunda", "Monitorar se houver mudança de atitude"],
    risks: ["Impacto negativo no vestiário", "Salário incompatível", "Comportamento problemático"],
    comparables: ["Martin Odegaard", "Morgan Gibbs-White"],
  },
  {
    playerName: "Dominic Solanke",
    vx: 70, rx: 60,
    vxComponents: { technical: 6.8, marketImpact: 5.5, culturalAdaptation: 7.0, networkingBenefit: 5.0, ageDepreciation: 3.0, liabilities: 6.5, regulatoryRisk: 1.5, totalCost: 7.0 },
    rxComponents: { tacticalGap: 6.5, contextualFit: 6.0, experienceProfile: 6.5, narrativeIndex: 5.0, mentalFortitude: 5.5, injuryMicroRisk: 3.0, suspensionRisk: 1.5, valueAtRisk: 7.0, marketJitter: 5.5 },
    c1Technical: 68, c2Tactical: 72, c3Physical: 74, c4Behavioral: 65, c5Narrative: 58, c6Economic: 54, c7Ai: 66,
    ast: 66, clf: 62, gne: 60, wse: 68, rbl: 58, sace: 60, scnPlus: 63,
    decision: "ALERTA_CINZA", confidence: 70,
    reasoning: "Atacante que custou 65M ao Tottenham vindo do Bournemouth mas não conseguiu render conforme esperado. Histórico de desaparecer em jogos grandes. Se disponibilizado, pode parecer atraente pelo nome, mas o custo-benefício é questionável. Alerta cinza por risco de ser uma contratação que não agrega valor real ao elenco e ocupa espaço salarial significativo.",
    recommendedActions: ["Evitar a menos que condições excepcionais surjam", "Há opções melhores no mercado"],
    risks: ["Custo elevado sem garantia de retorno", "Rendimento inconsistente em clubes grandes"],
    comparables: ["Chris Wood", "Ollie Watkins"],
  },
];

// Generate analysis IDs
const ANALYSIS_IDS: Record<string, string> = {};
for (const a of analysisData) {
  ANALYSIS_IDS[a.playerName] = makeUuid(`analysis:${a.playerName}`);
}

// ============================================
// SCOUTING TARGETS
// ============================================

interface ScoutingTargetSeed {
  playerName: string;
  priority: string;
  status: string;
  notes: string;
  targetPrice: number | null;
}

const scoutingTargetData: ScoutingTargetSeed[] = [
  { playerName: "Marc Guehi", priority: "high", status: "watching", notes: "Contrato curto. Monitorar janela de janeiro e verão. Prioridade defensiva.", targetPrice: 38 },
  { playerName: "Bryan Mbeumo", priority: "high", status: "watching", notes: "Artilheiro do Brentford. Encaixe perfeito no flanco direito. Janela de verão ideal.", targetPrice: 32 },
  { playerName: "Eberechi Eze", priority: "high", status: "contacted", notes: "Sondagem inicial feita via intermediários. Crystal Palace aberto a ouvir propostas.", targetPrice: 48 },
  { playerName: "Matheus Cunha", priority: "high", status: "watching", notes: "Depende da situação do Wolves na tabela. Se rebaixados, preço cai significativamente.", targetPrice: 35 },
  { playerName: "Antonee Robinson", priority: "medium", status: "watching", notes: "Alternativa/competição para Nuno Tavares. Avaliar necessidade real.", targetPrice: 22 },
  { playerName: "Liam Delap", priority: "medium", status: "watching", notes: "Aposta jovem para substituir Chris Wood no médio prazo.", targetPrice: 18 },
  { playerName: "Jarrad Branthwaite", priority: "medium", status: "watching", notes: "Depende de crise financeira do Everton. Parceiro ideal para Murillo.", targetPrice: 40 },
  { playerName: "Alejandro Garnacho", priority: "medium", status: "watching", notes: "Sondar Man Utd sobre empréstimo na janela de janeiro.", targetPrice: null },
  { playerName: "Tyler Dibling", priority: "low", status: "watching", notes: "Aposta de longo prazo. Avaliar se Southampton for rebaixado.", targetPrice: 12 },
  { playerName: "Rodrigo Muniz", priority: "low", status: "watching", notes: "Backup para operação de centroavante. Brasileiro, boa integração.", targetPrice: 22 },
];

// ============================================
// SEED FUNCTION
// ============================================

async function seed() {
  console.log("🌱 Seeding Cortex FC database with real Premier League 2024/25 data...\n");

  // 0. Clean existing data (reverse dependency order)
  console.log("  → Cleaning existing data...");
  await db.delete(scoutingTargets);
  await db.delete(neuralAnalyses);
  await db.delete(players);
  await db.delete(seasons);
  await db.delete(clubs);
  await db.delete(leagues);
  await db.delete(users);
  await db.delete(organizations);

  // 1. Organization
  console.log("  → Creating organization...");
  await db.insert(organizations).values({
    id: ORG_ID,
    name: "Nottingham Forest FC",
    slug: "nottingham-forest-fc",
    tier: "club_professional",
  });

  // 2. Default user
  console.log("  → Creating default user...");
  await db.insert(users).values({
    id: USER_ID,
    email: "analyst@cortexfc.com",
    name: "Cortex Analyst",
    passwordHash: await bcrypt.hash("cortex2025", 10),
    orgId: ORG_ID,
    role: "admin",
  });

  // 3. Leagues (Top 5)
  console.log("  → Creating Top 5 leagues...");
  const leagueData = [
    { name: "Premier League", country: "England" },
    { name: "La Liga", country: "Spain" },
    { name: "Serie A", country: "Italy" },
    { name: "Bundesliga", country: "Germany" },
    { name: "Ligue 1", country: "France" },
  ];
  await db.insert(leagues).values(
    leagueData.map((l) => ({
      id: LEAGUE_IDS_TOP5[l.name as keyof typeof LEAGUE_IDS_TOP5],
      name: l.name,
      country: l.country,
      tier: 1,
      externalId: LEAGUE_EXTERNAL_IDS[l.name],
    }))
  );

  // 4. Clubs (all 20 Premier League clubs)
  console.log("  → Creating 20 clubs...");
  const clubEntries = clubData.map((c) => ({
    id: CLUB_IDS[c.name],
    name: c.name,
    shortName: c.shortName,
    country: c.country,
    leagueId: LEAGUE_ID,
    stadiumName: c.stadiumName,
    foundedYear: c.foundedYear,
  }));
  await db.insert(clubs).values(clubEntries);

  // 5. Season
  console.log("  → Creating season 2024/25...");
  await db.insert(seasons).values({
    id: SEASON_ID,
    name: "2024/25",
    startDate: new Date("2024-08-17"),
    endDate: new Date("2025-05-25"),
    leagueId: LEAGUE_ID,
  });

  // 6. Players
  console.log(`  → Creating ${playerData.length} players...`);
  const playerEntries = playerData.map((p) => ({
    id: PLAYER_IDS[p.name],
    name: p.name,
    fullName: p.fullName ?? null,
    nationality: p.nationality,
    age: p.age,
    height: p.height ?? null,
    preferredFoot: p.preferredFoot ?? null,
    positionCluster: p.positionCluster,
    positionDetail: p.positionDetail,
    currentClubId: CLUB_IDS[p.club],
    marketValue: p.marketValue,
    salary: p.salary,
    contractUntil: new Date(p.contractUntil),
  }));
  await db.insert(players).values(playerEntries);

  // 7. Neural Analyses
  console.log(`  → Creating ${analysisData.length} neural analyses...`);
  const analysisEntries = analysisData.map((a) => ({
    id: ANALYSIS_IDS[a.playerName],
    playerId: PLAYER_IDS[a.playerName],
    clubContextId: CLUB_IDS["Nottingham Forest"],
    seasonId: SEASON_ID,

    vx: a.vx,
    rx: a.rx,
    vxComponents: a.vxComponents,
    rxComponents: a.rxComponents,

    c1Technical: a.c1Technical,
    c2Tactical: a.c2Tactical,
    c3Physical: a.c3Physical,
    c4Behavioral: a.c4Behavioral,
    c5Narrative: a.c5Narrative,
    c6Economic: a.c6Economic,
    c7Ai: a.c7Ai,

    ast: a.ast,
    clf: a.clf,
    gne: a.gne,
    wse: a.wse,
    rbl: a.rbl,
    sace: a.sace,
    scnPlus: a.scnPlus,

    decision: a.decision,
    confidence: a.confidence,
    reasoning: a.reasoning,
    recommendedActions: a.recommendedActions,
    risks: a.risks,
    comparables: a.comparables,

    analystId: USER_ID,
    isPublished: true,
    createdAt: new Date("2025-01-15"),
    updatedAt: new Date("2025-01-15"),
  }));
  await db.insert(neuralAnalyses).values(analysisEntries);

  // 8. Scouting Targets
  console.log(`  → Creating ${scoutingTargetData.length} scouting targets...`);
  const scoutingEntries = scoutingTargetData.map((s) => ({
    id: makeUuid(`scouting:${s.playerName}`),
    playerId: PLAYER_IDS[s.playerName],
    orgId: ORG_ID,
    priority: s.priority,
    status: s.status,
    notes: s.notes,
    targetPrice: s.targetPrice,
    analysisId: ANALYSIS_IDS[s.playerName],
    addedBy: USER_ID,
  }));
  await db.insert(scoutingTargets).values(scoutingEntries);

  console.log("\n✅ Seed complete!");
  console.log(`   • 1 organization (Nottingham Forest FC)`);
  console.log(`   • 1 user (analyst@cortexfc.com)`);
  console.log(`   • 1 league (Premier League)`);
  console.log(`   • 20 clubs`);
  console.log(`   • 1 season (2024/25)`);
  console.log(`   • ${playerData.length} players`);
  console.log(`   • ${analysisData.length} neural analyses`);
  console.log(`   • ${scoutingTargetData.length} scouting targets`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  });
