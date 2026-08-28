import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import { router, Slot, useSegments } from 'expo-router';
import { Home, HeartPulse, ClipboardList, LogOut, User } from 'lucide-react-native';
import { AuthService, CurrentUserSession } from '@/services/authService';

type Tab = 'index' | 'help' | 'tracker';

export default function UserLayout() {
  const [activeTab, setActiveTab] = useState<Tab>('index');
  const [session, setSession] = useState<CurrentUserSession | null>(null);
  const segments = useSegments();

  useEffect(() => {
    AuthService.getSession().then((s) => setSession(s));
  }, []);

  useEffect(() => {
    const last = segments[segments.length - 1] as Tab;
    if (last === 'help' || last === 'tracker') {
      setActiveTab(last);
    } else {
      setActiveTab('index');
    }
  }, [segments]);

  const navigateTo = (tab: Tab) => {
    setActiveTab(tab);
    if (tab === 'index') {
      router.replace('/user');
    } else {
      router.replace(`/user/${tab}` as any);
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await AuthService.clearSession();
          router.replace('/auth');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.roleIconWrap}>
            <User size={20} color="#2563EB" />
          </View>
          <View>
            <Text style={styles.roleTitle}>Citizen Portal</Text>
            <Text style={styles.userSubtitle} numberOfLines={1}>
              {session?.name || session?.identifier || 'Registered Citizen'}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={handleSignOut}
          style={({ pressed }) => [styles.signOutBtn, pressed && styles.pressed]}>
          <LogOut size={16} color="#64748B" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Slot />
      </View>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <Pressable
          style={({ pressed }) => [
            styles.tabItem,
            activeTab === 'index' && styles.tabItemActive,
            pressed && styles.pressed,
          ]}
          onPress={() => navigateTo('index')}>
          <Home size={22} color={activeTab === 'index' ? '#2563EB' : '#94A3B8'} />
          <Text style={[styles.tabLabel, activeTab === 'index' && styles.tabLabelActive]}>
            Home
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.tabItem,
            activeTab === 'help' && styles.tabItemActiveRed,
            pressed && styles.pressed,
          ]}
          onPress={() => navigateTo('help')}>
          <HeartPulse size={22} color={activeTab === 'help' ? '#DC2626' : '#94A3B8'} />
          <Text style={[styles.tabLabel, activeTab === 'help' && styles.tabLabelActiveRed]}>
            Ask for Help
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.tabItem,
            activeTab === 'tracker' && styles.tabItemActive,
            pressed && styles.pressed,
          ]}
          onPress={() => navigateTo('tracker')}>
          <ClipboardList size={22} color={activeTab === 'tracker' ? '#2563EB' : '#94A3B8'} />
          <Text style={[styles.tabLabel, activeTab === 'tracker' && styles.tabLabelActive]}>
            My Requests
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingTop: 54,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  roleIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  userSubtitle: {
    fontSize: 11,
    color: '#64748B',
    maxWidth: 160,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  signOutText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingBottom: 28,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 4,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  tabItemActive: {
    backgroundColor: '#EFF6FF',
  },
  tabItemActiveRed: {
    backgroundColor: '#FEF2F2',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#94A3B8',
  },
  tabLabelActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
  tabLabelActiveRed: {
    color: '#DC2626',
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.7,
  },
});
