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
  Radio,
  MapPin,
  Inbox,
  Send,
  Boxes,
  LogOut,
  Building2,
  ShieldAlert,
} from 'lucide-react-native';
import { AuthService, CurrentUserSession } from '@/services/authService';

type ManagerTab = 'alerts' | 'map' | 'requests' | 'dispatch' | 'config';

export default function ManagerLayout() {
  const [activeTab, setActiveTab] = useState<ManagerTab>('alerts');
  const [session, setSession] = useState<CurrentUserSession | null>(null);
  const segments = useSegments();

  useEffect(() => {
    AuthService.getSession().then((s) => setSession(s));
  }, []);

  useEffect(() => {
    const last = segments[segments.length - 1] as ManagerTab;
    if (['alerts', 'map', 'requests', 'dispatch', 'config'].includes(last)) {
      setActiveTab(last);
    } else {
      setActiveTab('alerts');
    }
  }, [segments]);

  const navigateTo = (tab: ManagerTab) => {
    setActiveTab(tab);
    if (tab === 'alerts') {
      router.replace('/manager/alerts' as any);
    } else {
      router.replace(`/manager/${tab}` as any);
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out from Manager Command?', [
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

  const managerState = session?.details?.state_of_operations || session?.details?.state || 'Assam';

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.roleIconWrap}>
            <Building2 size={20} color="#7C3AED" />
          </View>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.roleTitle}>
                {session?.details?.org_name || session?.name || 'NDMA Control Command'}
              </Text>
              <View style={styles.stateBadge}>
                <MapPin size={11} color="#7C3AED" />
                <Text style={styles.stateBadgeText}>{managerState}</Text>
              </View>
            </View>
            <Text style={styles.userSubtitle} numberOfLines={1}>
              {session?.details?.representative_name || session?.identifier || 'Relief Operations Manager'}
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

      {/* Modern Bottom Navigation */}
      <View style={styles.tabBar}>
        <Pressable
          style={({ pressed }) => [
            styles.tabItem,
            activeTab === 'alerts' && styles.tabItemActive,
            pressed && styles.pressed,
          ]}
          onPress={() => navigateTo('alerts')}>
          <Radio size={20} color={activeTab === 'alerts' ? '#7C3AED' : '#94A3B8'} />
          <Text style={[styles.tabLabel, activeTab === 'alerts' && styles.tabLabelActive]}>
            Alerts
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.tabItem,
            activeTab === 'map' && styles.tabItemActive,
            pressed && styles.pressed,
          ]}
          onPress={() => navigateTo('map')}>
          <ShieldAlert size={20} color={activeTab === 'map' ? '#7C3AED' : '#94A3B8'} />
          <Text style={[styles.tabLabel, activeTab === 'map' && styles.tabLabelActive]}>
            Grid Map
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.tabItem,
            activeTab === 'requests' && styles.tabItemActive,
            pressed && styles.pressed,
          ]}
          onPress={() => navigateTo('requests')}>
          <Inbox size={20} color={activeTab === 'requests' ? '#7C3AED' : '#94A3B8'} />
          <Text style={[styles.tabLabel, activeTab === 'requests' && styles.tabLabelActive]}>
            Requests
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.tabItem,
            activeTab === 'dispatch' && styles.tabItemActive,
            pressed && styles.pressed,
          ]}
          onPress={() => navigateTo('dispatch')}>
          <Send size={20} color={activeTab === 'dispatch' ? '#7C3AED' : '#94A3B8'} />
          <Text style={[styles.tabLabel, activeTab === 'dispatch' && styles.tabLabelActive]}>
            Dispatch
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.tabItem,
            activeTab === 'config' && styles.tabItemActive,
            pressed && styles.pressed,
          ]}
          onPress={() => navigateTo('config')}>
          <Boxes size={20} color={activeTab === 'config' ? '#7C3AED' : '#94A3B8'} />
          <Text style={[styles.tabLabel, activeTab === 'config' && styles.tabLabelActive]}>
            Stock & Teams
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: 52,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
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
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
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
    color: '#0F172A',
  },
  stateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  stateBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7C3AED',
  },
  userSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
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
    paddingBottom: 24,
    paddingTop: 8,
    paddingHorizontal: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 4,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  tabItemActive: {
    backgroundColor: '#F5F3FF',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#94A3B8',
  },
  tabLabelActive: {
    color: '#7C3AED',
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.7,
  },
});
