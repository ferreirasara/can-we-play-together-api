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
  data: {
    name: string,
    short_description: string,
    categories: {
      id: number,
      description: string
    }[]
    header_image: string,
    genres: {
      id: number,
      description: string
    }[]
  }
}>

export type GameDetails = {
  appid: number,
  name: string,
  categories: string[]
  header_image: string,
}

export type AllGamesResponse = {
  applist: {
    apps: {
      appid: number,
      name: string,
    }[]
  }
}

export interface ContType {
  name: string
  cont: number
}