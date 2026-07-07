import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '@/src/auth';
import { theme } from '@/src/theme';

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.center} testID="root-loader">
        <ActivityIndicator color={theme.color.brand} />
      </View>
    );
  }

  if (!user) return <Redirect href="/login" />;
  if (user.role === 'seller') return <Redirect href="/(seller)/dashboard" />;
  if (user.role === 'admin') return <Redirect href="/(admin)/queue" />;
  return <Redirect href="/(customer)/home" />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.color.surface },
});
