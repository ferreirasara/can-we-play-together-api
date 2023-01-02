import { isArray } from 'lodash';
import fetch from 'node-fetch';
import { ContType } from '../@types/types';

export const multiplayerCategories = [
  'Multi-player',
  'Co-op',
  'Online Co-op',
  'LAN Co-op',
  'PvP',
  'Online PvP',
  'LAN PvP',
  'Shared/Split Screen PvP',
  'Cross-Platform Multiplayer',
]

export const getUserIdFromHTML = (html: string): string => {
  if (!html) return '';
  const id = html
    ?.replace(/<[^>]*>?/gm, '')
    ?.split('steamID64 (Dec):')[1]
    ?.split('steamID64 (Hex):')[0]
    ?.trim();
  return id;
}

export const sendSlackReport = async (message: string) => {
  const allGamesUrl = `https://slack.com/api/chat.postMessage?text=${message}&channel=${process.env.SLACK_CHANNEL_ID}`
  const headers = {
    "Authorization": `Bearer ${process.env.SLACK_API_KEY}`
  }

  await fetch(allGamesUrl, { headers });
}

export const calcContType = (arr: string[], orderBy: 'cont' | 'name' = 'cont'): ContType[] => {
  if (!isArray(arr)) return []
  const contTypes: ContType[] = []
  const valueToIndexMap: Record<string, number> = {}

  for (const cur of arr) {
    if (cur) {
      const ind = valueToIndexMap[cur]
      if (ind || ind === 0) {
        contTypes[ind].cont++
      } else {
        contTypes.push({ name: cur, cont: 1 })
        valueToIndexMap[cur] = contTypes.length - 1
      }
    }
  }
  return orderObjectsByField(contTypes, orderBy);
}

export function orderObjectsByField<T extends Record<string, any>>(objs: T[], field: keyof T, ascending?: boolean): T[] {
  return objs.sort((a, b) => {
    let comparison = 0;
    if (a[field] > b[field]) {
      comparison = ascending ? 1 : -1;
    } else if (a[field] < b[field]) {
      comparison = ascending ? -1 : 1;
    }
    return comparison;
  })
}