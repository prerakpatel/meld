const STORAGE_KEY = 'meld_player_id';

export function getPlayerId() {
  if (typeof window === 'undefined') return null;

  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}
