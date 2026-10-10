import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LiveStandingRow, StandingRow } from '../types';
import { colors, radius, spacing } from '../theme';
import { TeamCrest } from './TeamCrest';

interface Props {
  rows: StandingRow[];
  /** quando true, mostra a coluna ▲▼ de movimentação (tabela ao vivo) */
  showMovement?: boolean;
  /** callback ao tocar numa linha (navegar para a tela do time) */
  onTeamPress?: (teamId: string) => void;
}

/** Cores de faixa: Libertadores (1-4), pré-Libertadores (5-6), Z4 (17-20) */
function positionColor(pos: number): string {
  if (pos <= 4) return colors.accent;
  if (pos <= 6) return colors.info;
  if (pos >= 17) return colors.danger;
  return 'transparent';
}

function FormDot({ result }: { result: StandingRow['form'] }) {
  if (!result) {
    return <View style={[styles.formDot, styles.formDotEmpty]} />;
  }
  const bg =
    result === 'V' ? colors.win : result === 'E' ? colors.draw : colors.loss;
  return (
    <View style={[styles.formDot, { backgroundColor: bg }]}>
      <Text style={styles.formDotText}>{result}</Text>
    </View>
  );
}

function MovementBadge({ row }: { row: LiveStandingRow }) {
  if (row.movement === 'SAME') {
    return <Text style={styles.moveSame}>–</Text>;
  }
  const up = row.movement === 'UP';
  return (
    <Text style={up ? styles.moveUp : styles.moveDown}>
      {up ? '▲' : '▼'}
      {row.movementDelta > 0 ? ` ${row.movementDelta}` : ''}
    </Text>
  );
}

/** Tabela de classificação completa (pos, time, P, J, V, E, D, SG, últimos 5) */
export function StandingTable({ rows, showMovement, onTeamPress }: Props) {
  return (
    <View style={styles.container}>
      <View style={[styles.row, styles.headerRow]}>
        <Text style={[styles.cellPos, styles.headerText]}>#</Text>
        <Text style={[styles.cellTeam, styles.headerText]}>TIME</Text>
        {showMovement && <Text style={[styles.cellMove, styles.headerText]}>▲▼</Text>}
        <Text style={[styles.cellNum, styles.headerText]}>P</Text>
        <Text style={[styles.cellNum, styles.headerText]}>J</Text>
        <Text style={[styles.cellNum, styles.headerText]}>V</Text>
        <Text style={[styles.cellNum, styles.headerText]}>E</Text>
        <Text style={[styles.cellNum, styles.headerText]}>D</Text>
        <Text style={[styles.cellNum, styles.headerText]}>SG</Text>
        <Text style={[styles.cellForm, styles.headerText]}>ÚLT</Text>
      </View>

      {rows.map((row) => {
        const saldo = row.goalsFor - row.goalsAgainst;
        const stripe = positionColor(row.position);
        const live = showMovement ? (row as LiveStandingRow) : null;
        const content = (
          <View style={[styles.row, styles.dataRow]}>
            <View style={styles.cellPos}>
              <View style={[styles.stripe, { backgroundColor: stripe }]} />
              <Text style={styles.cellPosText}>{row.position}</Text>
            </View>
            <View style={styles.cellTeam}>
              <TeamCrest team={row.team} size={22} />
              <Text style={styles.teamName} numberOfLines={1}>
                {row.team.name}
              </Text>
            </View>
            {live && (
              <View style={styles.cellMove}>
                <MovementBadge row={live} />
                {!!live.liveScore && <Text style={styles.liveScore}>{live.liveScore}</Text>}
              </View>
            )}
            <Text style={[styles.cellNum, styles.points]}>{row.points}</Text>
            <Text style={styles.cellNum}>{row.played}</Text>
            <Text style={styles.cellNum}>{row.won}</Text>
            <Text style={styles.cellNum}>{row.drawn}</Text>
            <Text style={styles.cellNum}>{row.lost}</Text>
            <Text
              style={[styles.cellNum, saldo >= 0 ? styles.positive : styles.negative]}
            >
              {saldo > 0 ? `+${saldo}` : saldo}
            </Text>
            <View style={styles.cellForm}>
              <FormDot result={row.form} />
            </View>
          </View>
        );
        return onTeamPress ? (
          <Pressable
            key={row.team.id}
            onPress={() => onTeamPress(row.team.id)}
            accessibilityRole="button"
            accessibilityLabel={`Ver ${row.team.name}`}
          >
            {content}
          </Pressable>
        ) : (
          <View key={row.team.id}>{content}</View>
        );
      })}

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBar, { backgroundColor: colors.accent }]} />
          <Text style={styles.legendText}>Libertadores</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBar, { backgroundColor: colors.info }]} />
          <Text style={styles.legendText}>Pré-Libertadores</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBar, { backgroundColor: colors.danger }]} />
          <Text style={styles.legendText}>Rebaixamento</Text>
        </View>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  headerRow: {
    backgroundColor: colors.cardAlt,
    paddingVertical: spacing.sm,
  },
  dataRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  cellPos: {
    width: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stripe: {
    width: 3,
    height: 18,
    borderRadius: 2,
  },
  cellPosText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    width: 16,
    textAlign: 'center',
  },
  cellTeam: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
  },
  cellMove: {
    width: 40,
    alignItems: 'center',
  },
  moveUp: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
  },
  moveDown: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '800',
  },
  moveSame: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  liveScore: {
    color: colors.live,
    fontSize: 10,
    fontWeight: '800',
  },
  teamName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
  cellNum: {
    width: 26,
    textAlign: 'center',
    color: colors.text,
    fontSize: 13,
  },
  points: {
    fontWeight: '800',
  },
  positive: {
    color: colors.accent,
  },
  negative: {
    color: colors.danger,
  },
  cellForm: {
    width: 30,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  formDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formDotEmpty: {
    backgroundColor: colors.cardAlt,
  },
  formDotText: {
    color: '#FFF',
    fontSize: 7,
    fontWeight: '800',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.cardAlt,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBar: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendText: {
    color: colors.textMuted,
    fontSize: 11,
  },
});
