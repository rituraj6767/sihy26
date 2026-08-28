import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { User, Building2, Compass, ArrowRight } from 'lucide-react-native';

export default function AuthHubScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appTitle}>RescueNetAI</Text>
          <Text style={styles.subtitle}>
            Multi-Agency Coordination Platform for Search and Rescue
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonGroup}>
          {/* 1. Login as User */}
          <Pressable
            style={({ pressed }) => [styles.btn, styles.userBtn, pressed && styles.pressed]}
            onPress={() => router.push('/auth/user')}>
            <View style={styles.btnLeft}>
              <User size={20} color="#2563EB" />
              <Text style={styles.btnText}>Login as User</Text>
            </View>
            <ArrowRight size={18} color="#2563EB" />
          </Pressable>

          {/* 2. Login as Relief Manager */}
          <Pressable
            style={({ pressed }) => [styles.btn, styles.managerBtn, pressed && styles.pressed]}
            onPress={() => router.push('/auth/manager')}>
            <View style={styles.btnLeft}>
              <Building2 size={20} color="#7C3AED" />
              <Text style={styles.btnText}>Login as Relief Manager</Text>
            </View>
            <ArrowRight size={18} color="#7C3AED" />
          </Pressable>

          {/* 3. Login as SAR Team */}
          <Pressable
            style={({ pressed }) => [styles.btn, styles.sarBtn, pressed && styles.pressed]}
            onPress={() => router.push('/auth/sar')}>
            <View style={styles.btnLeft}>
              <Compass size={20} color="#EA580C" />
              <Text style={styles.btnText}>Login as SAR Team</Text>
            </View>
            <ArrowRight size={18} color="#EA580C" />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  buttonGroup: {
    gap: 14,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.04)',
    elevation: 1,
  },
  userBtn: {
    borderColor: '#DBEAFE',
  },
  managerBtn: {
    borderColor: '#EDE9FE',
  },
  sarBtn: {
    borderColor: '#FFEDD5',
  },
  btnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  btnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },
});
