import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import {
  Radio,
  AlertTriangle,
  Flame,
  Waves,
  Wind,
  CheckSquare,
  Square,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  Building,
  Clock,
  MapPin,
  ExternalLink,
} from 'lucide-react-native';
import { AuthService, CurrentUserSession } from '@/services/authService';
import { ManagerService } from '@/services/managerService';
import { DisasterAlert } from '@/services/rssParser';

export default function AlertsScreen() {
  const [session, setSession] = useState<CurrentUserSession | null>(null);
  const [alerts, setAlerts] = useState<DisasterAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyMyState, setOnlyMyState] = useState(true);
  const [selectedGuids, setSelectedGuids] = useState<string[]>([]);
  const [claiming, setClaiming] = useState(false);

  const managerState = session?.details?.state_of_operations || session?.details?.state || 'Assam';

  const loadAlerts = async () => {
    try {
      const s = await AuthService.getSession();
      setSession(s);
      const stateToQuery = onlyMyState ? (s?.details?.state_of_operations || 'Assam') : 'all';
      const data = await ManagerService.fetchDisasterAlerts(stateToQuery);
      setAlerts(data);
    } catch (e) {
      console.warn('Error loading alerts:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [onlyMyState]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAlerts();
  };

  const toggleSelect = (guid: string) => {
    if (selectedGuids.includes(guid)) {
      setSelectedGuids(selectedGuids.filter((g) => g !== guid));
    } else {
      setSelectedGuids([...selectedGuids, guid]);
    }
  };

  const selectAll = () => {
    if (selectedGuids.length === filteredAlerts.length) {
      setSelectedGuids([]);
    } else {
      setSelectedGuids(filteredAlerts.map((a) => a.guid));
    }
  };

  const handleOpenMapWithSelected = async () => {
    if (selectedGuids.length === 0) return;
    setClaiming(true);

    try {
      const selectedAlerts = alerts.filter((a) => selectedGuids.includes(a.guid));
      const userId = session?.userId || 'manager-anon';

      for (const alert of selectedAlerts) {
        await ManagerService.claimDisaster(userId, alert, managerState);
      }

      // Navigate to Map tab with primary selected disaster
      const primary = selectedAlerts[0];
      router.push({
        pathname: '/manager/map' as any,
        params: {
          disasterGuid: primary.guid,
          title: primary.title,
          lat: primary.latitude?.toString() || '26.20',
          lng: primary.longitude?.toString() || '92.93',
          state: primary.extractedState || managerState,
        },
      });
    } catch (e) {
      console.warn('Error claiming disaster:', e);
    } finally {
      setClaiming(false);
    }
  };

  const getEventIcon = (category: string, title: string) => {
    const text = (category + ' ' + title).toLowerCase();
    if (text.includes('flood') || text.includes('river') || text.includes('water')) {
      return <Waves size={18} color="#0284C7" />;
    }
    if (text.includes('fire') || text.includes('heat')) {
      return <Flame size={18} color="#EA580C" />;
    }
    if (text.includes('wind') || text.includes('cyclone') || text.includes('storm')) {
      return <Wind size={18} color="#7C3AED" />;
    }
    return <AlertTriangle size={18} color="#DC2626" />;
  };

  const getSeverityStyle = (severity?: string) => {
    switch (severity) {
      case 'Extreme':
        return { bg: '#FEE2E2', border: '#FCA5A5', text: '#991B1B' };
      case 'Severe':
        return { bg: '#FFEDD5', border: '#FDBA74', text: '#9A3412' };
      default:
        return { bg: '#FEF3C7', border: '#FCD34D', text: '#92400E' };
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      alert.title.toLowerCase().includes(q) ||
      alert.author.toLowerCase().includes(q) ||
      alert.category.toLowerCase().includes(q)
    );
  });

  return (
    <View style={styles.container}>
      {/* Subheader & Filters */}
      <View style={styles.topBar}>
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Search size={18} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search alerts, rivers, districts..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <Pressable
            style={[styles.filterToggle, onlyMyState && styles.filterToggleActive]}
            onPress={() => setOnlyMyState(!onlyMyState)}>
            <Filter size={16} color={onlyMyState ? '#FFFFFF' : '#475569'} />
            <Text style={[styles.filterToggleText, onlyMyState && styles.filterToggleTextActive]}>
              {onlyMyState ? managerState : 'All India'}
            </Text>
          </Pressable>
        </View>

        {/* Action strip */}
        <View style={styles.actionStrip}>
          <View style={styles.feedStatus}>
            <View style={styles.livePulse} />
            <Text style={styles.feedStatusText}>
              NDMA SACHET Live Feed • {filteredAlerts.length} active
            </Text>
          </View>

          {filteredAlerts.length > 0 && (
            <Pressable onPress={selectAll} style={styles.selectAllBtn}>
              <Text style={styles.selectAllText}>
                {selectedGuids.length === filteredAlerts.length ? 'Deselect All' : 'Select All'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Alerts Feed List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#7C3AED']} />}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text style={styles.loadingText}>Loading alerts...</Text>
          </View>
        ) : filteredAlerts.length === 0 ? (
          <View style={styles.emptyBox}>
            <ShieldCheck size={48} color="#10B981" />
            <Text style={styles.emptyTitle}>No Critical Alerts Active</Text>
            <Text style={styles.emptySubtitle}>
              No emergency alerts found for {onlyMyState ? managerState : 'the selected filter'}. Pull down to refresh.
            </Text>
            {onlyMyState && (
              <Pressable style={styles.viewAllBtn} onPress={() => setOnlyMyState(false)}>
                <Text style={styles.viewAllText}>View All India Feed</Text>
              </Pressable>
            )}
          </View>
        ) : (
          filteredAlerts.map((alert) => {
            const isSelected = selectedGuids.includes(alert.guid);
            const sev = getSeverityStyle(alert.severity);

            return (
              <Pressable
                key={alert.guid}
                style={({ pressed }) => [
                  styles.alertCard,
                  isSelected && styles.alertCardSelected,
                  pressed && styles.pressed,
                ]}
                onPress={() => toggleSelect(alert.guid)}>
                {/* Header row */}
                <View style={styles.cardHeader}>
                  <View style={styles.eventBadgeRow}>
                    <View style={styles.eventIconWrap}>
                      {getEventIcon(alert.category, alert.title)}
                    </View>
                    <View style={[styles.severityBadge, { backgroundColor: sev.bg, borderColor: sev.border }]}>
                      <Text style={[styles.severityText, { color: sev.text }]}>
                        {alert.severity || 'Moderate'}
                      </Text>
                    </View>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>{alert.category || 'Disaster'}</Text>
                    </View>
                  </View>

                  <View style={styles.checkboxWrap}>
                    {isSelected ? (
                      <CheckSquare size={22} color="#7C3AED" />
                    ) : (
                      <Square size={22} color="#CBD5E1" />
                    )}
                  </View>
                </View>

                {/* Title & Description */}
                <Text style={styles.alertTitle}>{alert.title}</Text>

                {/* Metadata Footer */}
                <View style={styles.cardFooter}>
                  <View style={styles.footerItem}>
                    <Building size={13} color="#64748B" />
                    <Text style={styles.footerText} numberOfLines={1}>
                      {alert.author.replace('controlroom@ndma.gov.in', '').replace(/[()]/g, '').trim() || 'NDMA Control'}
                    </Text>
                  </View>

                  {alert.areaDesc && (
                    <View style={styles.footerItem}>
                      <MapPin size={13} color="#64748B" />
                      <Text style={styles.footerText} numberOfLines={1}>{alert.areaDesc}</Text>
                    </View>
                  )}

                  <View style={styles.footerItem}>
                    <Clock size={13} color="#64748B" />
                    <Text style={styles.footerText}>
                      {alert.pubDate ? new Date(alert.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live'}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      {/* Floating Bottom Assignment CTA */}
      {selectedGuids.length > 0 && (
        <View style={styles.floatingBar}>
          <View>
            <Text style={styles.selectedCountText}>
              {selectedGuids.length} Disaster{selectedGuids.length > 1 ? 's' : ''} Selected
            </Text>
            <Text style={styles.selectedHintText}>Ready for grid mapping & SAR coverage</Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.claimBtn, pressed && styles.pressed]}
            onPress={handleOpenMapWithSelected}
            disabled={claiming}>
            {claiming ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.claimBtnText}>Open Grid Map</Text>
                <ArrowRight size={18} color="#FFFFFF" />
              </>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 10,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    padding: 0,
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterToggleActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  filterToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  filterToggleTextActive: {
    color: '#FFFFFF',
  },
  actionStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  feedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  livePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  feedStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  selectAllBtn: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  selectAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7C3AED',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 90,
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  viewAllBtn: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7C3AED',
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.05)',
    elevation: 1,
    gap: 10,
  },
  alertCardSelected: {
    borderColor: '#7C3AED',
    backgroundColor: '#FAF5FF',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eventBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  eventIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  severityBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  severityText: {
    fontSize: 11,
    fontWeight: '700',
  },
  categoryBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  checkboxWrap: {
    padding: 2,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 11,
    color: '#64748B',
    maxWidth: 180,
  },
  floatingBar: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.2)',
    elevation: 5,
  },
  selectedCountText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  selectedHintText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  claimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#7C3AED',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  claimBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.75,
  },
});
