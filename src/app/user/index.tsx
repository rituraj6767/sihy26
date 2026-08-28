import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Shield } from 'lucide-react-native';

export default function UserHomeScreen() {
  return (
    <View style={styles.content}>
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Shield size={40} color="#94A3B8" />
        </View>
        <Text style={styles.emptyTitle}>Welcome to RescueNetAI</Text>
        <Text style={styles.emptySubtitle}>
          Use the tabs below to ask for help in an emergency or track your existing requests.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  emptyContainer: {
    alignItems: 'center',
    maxWidth: 320,
    gap: 12,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
  },
});


