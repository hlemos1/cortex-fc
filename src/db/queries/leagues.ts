import { db } from "../index"
import { leagues, seasons, clubs } from "../schema"
import { eq, asc, desc } from "drizzle-orm"

export async function getLeagues() {
  return db.select().from(leagues).orderBy(asc(leagues.tier), asc(leagues.name))
}

export async function getLeagueById(id: string) {
  const [league] = await db.select().from(leagues).where(eq(leagues.id, id))
  return league ?? null
}

export async function getLeagueByExternalId(externalId: string) {
  const [league] = await db.select().from(leagues).where(eq(leagues.externalId, externalId))
  return league ?? null
}

export async function createLeague(data: {
  name: string
  country: string
  tier?: number
  externalId?: string
}) {
  const [league] = await db.insert(leagues).values(data).returning()
  return league
}

export async function getSeasons(leagueId?: string) {
  if (leagueId) {
    return db.select().from(seasons).where(eq(seasons.leagueId, leagueId)).orderBy(desc(seasons.startDate))
  }
  return db.select().from(seasons).orderBy(desc(seasons.startDate))
}

export async function getCurrentSeason(leagueId: string) {
  const now = new Date()
  const allSeasons = await db
    .select()
    .from(seasons)
    .where(eq(seasons.leagueId, leagueId))
    .orderBy(desc(seasons.startDate))

  return allSeasons.find(s => s.startDate <= now && s.endDate >= now) ?? allSeasons[0] ?? null
}

export async function createSeason(data: {
  name: string
  startDate: Date
  endDate: Date
  leagueId: string
}) {
  const [season] = await db.insert(seasons).values(data).returning()
  return season
}

export async function getClubsByLeague(leagueId: string) {
  return db.select().from(clubs).where(eq(clubs.leagueId, leagueId)).orderBy(asc(clubs.name))
}
