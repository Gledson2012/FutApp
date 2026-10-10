import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserPrediction } from '../types';

const PREDICTIONS_STORAGE_KEY = '@futapp:user_predictions';

export interface ScoreCalculation {
  points: number;
  label: string;
  exact: boolean;
}

export function calculatePredictionPoints(
  predHome: number,
  predAway: number,
  actualHome?: number,
  actualAway?: number,
  isFinished?: boolean,
): ScoreCalculation | null {
  if (!isFinished || actualHome === undefined || actualAway === undefined) {
    return null;
  }

  // Placar exato
  if (predHome === actualHome && predAway === actualAway) {
    return { points: 10, label: '🎯 Cravou o placar exato! (+10 pts)', exact: true };
  }

  const predDiff = predHome - predAway;
  const actualDiff = actualHome - actualAway;

  const predWinner = predHome > predAway ? 'H' : predHome < predAway ? 'A' : 'D';
  const actualWinner = actualHome > actualAway ? 'H' : actualHome < actualAway ? 'A' : 'D';

  // Acertou vencedor e saldo de gols
  if (predWinner === actualWinner && predDiff === actualDiff) {
    return { points: 7, label: '👏 Acertou vencedor e saldo! (+7 pts)', exact: false };
  }

  // Acertou apenas o vencedor ou empate
  if (predWinner === actualWinner) {
    return { points: 5, label: '⚽ Acertou o resultado! (+5 pts)', exact: false };
  }

  return { points: 0, label: '❌ Errou o palpite (0 pts)', exact: false };
}

export function useUserPredictions() {
  const [predictions, setPredictions] = useState<Record<string, UserPrediction>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(PREDICTIONS_STORAGE_KEY)
      .then((data) => {
        if (data) {
          try {
            setPredictions(JSON.parse(data));
          } catch {}
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const savePrediction = useCallback(
    async (matchId: string, homeScore: number, awayScore: number) => {
      const updatedItem: UserPrediction = {
        matchId,
        homeScore,
        awayScore,
        updatedAt: new Date().toISOString(),
      };

      setPredictions((prev) => {
        const next = { ...prev, [matchId]: updatedItem };
        AsyncStorage.setItem(PREDICTIONS_STORAGE_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
    },
    [],
  );

  const removePrediction = useCallback(async (matchId: string) => {
    setPredictions((prev) => {
      const next = { ...prev };
      delete next[matchId];
      AsyncStorage.setItem(PREDICTIONS_STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const getPrediction = useCallback(
    (matchId: string): UserPrediction | undefined => {
      return predictions[matchId];
    },
    [predictions],
  );

  const totalPoints = Object.values(predictions).reduce((acc, p) => acc + (p.points ?? 0), 0);

  return {
    predictions,
    loading,
    savePrediction,
    removePrediction,
    getPrediction,
    totalPoints,
  };
}
