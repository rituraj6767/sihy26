import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import { router, Slot, useSegments } from 'expo-router';
import {
  Compass,
  Radio,
  MapPin,
  ListTodo,
  LogOut,
  Shield,
  Navigation,
  Activity,
} from 'lucide-react-native';
import { AuthService, CurrentUserSession } from '@/services/authService';

type SARTab = 'index' | 'map' | 'comms';

export default function SARLayout() {
  const [activeTab, setActiveTab] = useState<SARTab>('index');
  const [session, setSession] = useState<CurrentUserSession | null>(null);
  const segments = useSegments();

  useEffect(() => {
    AuthService.getSession().then((s) => setSession(s));
  }, []);

  useEffect(() => {
    const last = segments[segments.length - 1] as SARTab;
    if (['index', 'map', 'comms'].includes(last)) {
      setActiveTab(last);
    } else {
      setActiveTab('index');
    }
  }, [segments]);

  const navigateTo = (tab: SARTab) => {
    setActiveTab(tab);
    if (tab === 'index') {
      router.replace('/sar' as any);
    } else {
      router.replace(`/sar/${tab}` as any);
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Sign out of SAR Operative Field Command?', [
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

  const badgeId = session?.details?.badge_id || session?.details?.badgeId || 'SAR-8821';
  const spec = session?.details?.specialization || 'Flood Rescue & Extraction';

  return (
    <View style={styles.container}>
      {/* SAR Field Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.roleIconWrap}>
            <Compass size={22} color="#EA580C" />
          </View>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.roleTitle}>
                {session?.name || session?.identifier || 'SAR Operative'}
              </Text>
              <View style={styles.badgePill}>
                <Shield size={10} color="#EA580C" />
                <Text style={styles.badgePillText}>{badgeId}</Text>
              </View>
            </View>
            <Text style={styles.specSubtitle} numberOfLines={1}>
              {spec} • Active Field Unit
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

      {/* Screen Content */}
      <View style={styles.content}>
        <Slot />
      </View>

      {/* SAR Tactical Navigation Bar */}
      <View style={styles.tabBar}>
        <Pressable
          style={({ pressed }) => [
            styles.tabItem,
            activeTab === 'index' && styles.tabItemActive,
            pressed && styles.pressed,
          ]}
          onPress={() => navigateTo('index')}>
          <ListTodo size={20} color={activeTab === 'index' ? '#EA580C' : '#94A3B8'} />
          <Text style={[styles.tabLabel, activeTab === 'index' && styles.tabLabelActive]}>
            Missions
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.tabItem,
            activeTab === 'map' && styles.tabItemActive,
            pressed && styles.pressed,
          ]}
          onPress={() => navigateTo('map')}>
          <Navigation size={20} color={activeTab === 'map' ? '#EA580C' : '#94A3B8'} />
          <Text style={[styles.tabLabel, activeTab === 'map' && styles.tabLabelActive]}>
            Tactical Map
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.tabItem,
            activeTab === 'comms' && styles.tabItemActive,
            pressed && styles.pressed,
          ]}
          onPress={() => navigateTo('comms')}>
          <Radio size={20} color={activeTab === 'comms' ? '#EA580C' : '#94A3B8'} />
          <Text style={[styles.tabLabel, activeTab === 'comms' && styles.tabLabelActive]}>
            Field Comms
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Tactical dark theme for SAR operatives
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: 52,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  roleIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(234, 88, 12, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(234, 88, 12, 0.3)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  roleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(234, 88, 12, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#EA580C',
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FB923C',
  },
  specSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#334155',
  },
  signOutText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingBottom: 24,
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 6,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  tabItemActive: {
    backgroundColor: 'rgba(234, 88, 12, 0.15)',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  tabLabelActive: {
    color: '#FB923C',
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.75,
  },
});
