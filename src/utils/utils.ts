import { uniq } from "lodash";

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
  const id = html?.split('<br>steamID64 (Dec): <code>')[1]?.split('</code>')[0];
  return id;
}