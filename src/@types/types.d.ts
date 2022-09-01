export type OwnedGamesResponse = {
  response: {
    games_count: number,
    games: {
      appid: number,
      playtime_forever: number,
      playtime_windows_forever: number,
      playtime_mac_forever: number,
      playtime_linux_forever: number,
      rtime_last_played: number,
    }[]
  }
}

export type GameDetailsResponse = Record<string, {
  success: boolean,
  data: GameDetails
}>

export type GameDetails = {
  name: string,
  short_description: string,
  categories: {
    id: number,
    description: string
  }[]
  background: string,
}