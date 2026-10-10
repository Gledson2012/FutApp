import React from 'react';
import { Image, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NewsArticle } from '../types';
import { colors, radius, spacing } from '../theme';

/** Card de notícia: imagem, título, fonte + hora; abre o link no navegador */
export function NewsCard({ article }: { article: NewsArticle }) {
  const open = () => {
    Linking.openURL(article.url).catch(() => undefined);
  };
  const when = new Date(article.publishedAt);
  const whenLabel = Number.isNaN(when.getTime())
    ? ''
    : when.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

  return (
    <TouchableOpacity style={styles.card} onPress={open} activeOpacity={0.8}>
      {article.imageUrl ? (
        <Image source={{ uri: article.imageUrl }} style={styles.image} resizeMode="cover" />
      ) : null}
      <View style={styles.body}>
        <Text style={styles.source}>
          {article.source}
          {whenLabel ? ` · ${whenLabel}` : ''}
        </Text>
        <Text style={styles.title} numberOfLines={3}>
          {article.title}
        </Text>
        {article.description ? (
          <Text style={styles.desc} numberOfLines={2}>
            {article.description}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  image: { width: '100%', height: 170, backgroundColor: colors.border },
  body: { padding: spacing.md, gap: 6 },
  source: { color: colors.accent, fontSize: 11, fontWeight: '700' },
  title: { color: colors.text, fontSize: 15, fontWeight: '700', lineHeight: 21 },
  desc: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
});
