import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '@/src/theme';

interface Props {
  kicker?: string;
  title: string;
  count?: string;
  right?: React.ReactNode;
  testID?: string;
}

/** Shared "kicker + title (+ count) (+ right slot)" header, replacing four slightly different reimplementations across the utility list screens. */
export function ScreenHeader({ kicker, title, count, right, testID }: Props) {
  return (
    <View style={styles.header} testID={testID}>
      <View style={{ flex: 1 }}>
        {kicker ? <Text style={styles.kicker}>{kicker}</Text> : null}
        <Text style={styles.title}>{title}</Text>
        {count ? <Text style={styles.count}>{count}</Text> : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', padding: theme.spacing.xl, paddingBottom: theme.spacing.md },
  kicker: { fontSize: 11, letterSpacing: 2, color: theme.color.muted },
  title: { fontFamily: theme.font.heading, fontSize: 28, color: theme.color.onSurface, marginTop: 2 },
  count: { color: theme.color.muted, marginTop: 4, fontSize: 13 },
});
