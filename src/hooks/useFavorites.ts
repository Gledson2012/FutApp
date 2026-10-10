import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@futapp:favorite_teams:v1';

export interface FavoriteTeam {
  id: string;
  name: string;
  shortName: string;
  logoUrl?: string | null;
}

/** Times favoritados, persistidos no AsyncStorage */
export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteTeam[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setFavorites(JSON.parse(raw));
      } catch {
        // segue vazio
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const persist = useCallback(async (next: FavoriteTeam[]) => {
    setFavorites(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignora erro de persistência
    }
  }, []);

  const isFavorite = useCallback(
    (id: string) => favorites.some((f) => f.id === id),
    [favorites],
  );

  const toggleFavorite = useCallback(
    (team: FavoriteTeam) => {
      const exists = favorites.some((f) => f.id === team.id);
      void persist(
        exists ? favorites.filter((f) => f.id !== team.id) : [...favorites, team],
      );
    },
    [favorites, persist],
  );

  return { favorites, loaded, isFavorite, toggleFavorite };
}
