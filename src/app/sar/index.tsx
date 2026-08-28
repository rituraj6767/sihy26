import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import {
  Compass,
  AlertTriangle,
  Clock,
  MapPin,
  Phone,
  User,
  Radio,
  Send,
  CheckCircle2,
  Package,
  Truck,
  Navigation,
  Shield,
  Layers,
  Activity,
  Flame,
  Waves,
  HeartPulse,
  Building,
  Check,
} from 'lucide-react-native';
import { AuthService, CurrentUserSession } from '@/services/authService';
import { SarService, SARMission, SARMissionStatus } from '@/services/sarService';

export default function SARHomeScreen() {
  const [session, setSession] = useState<CurrentUserSession | null>(null);
  const [missions, setMissions] = useState<SARMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'preparing' | 'dispatched' | 'resolved'>('all');
  const [selectedMission, setSelectedMission] = useState<SARMission | null>(null);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [newStatus, setNewStatus] = useState<SARMissionStatus>('preparing');
  const [operativeNote, setOperativeNote] = useState('');
  const [updating, setUpdating] = useState(false);

  const loadMissions = async () => {
    try {
      const s = await AuthService.getSession();
      setSession(s);
      const data = await SarService.fetchAssignedMissions(s?.userId);
      setMissions(data);
    } catch (e) {
      console.warn('Error loading SAR missions:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMissions();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadMissions();
  };

  const handleOpenStatusChange = (mission: SARMission) => {
    setSelectedMission(mission);
    setNewStatus(mission.status);
    setOperativeNote('');
    setStatusModalVisible(true);
  };

  const handleCommitStatusChange = async () => {
    if (!selectedMission) return;
    setUpdating(true);

    try {
      const success = await SarService.updateMissionStatus(
        selectedMission,
        newStatus,
        operativeNote.trim() || undefined
      );

      if (success) {
        setMissions((prev) =>
          prev.map((m) =>
            m.id === selectedMission.id ? { ...m, status: newStatus } : m
          )
        );
        setStatusModalVisible(false);
        Alert.alert(
          'Status Updated',
          `Mission status updated to "${newStatus.toUpperCase()}".`
        );
      } else {
        Alert.alert('Error', 'Could not update status.');
      }
    } catch {
      Alert.alert('Error', 'Could not update status.');
    } finally {
      setUpdating(false);
    }
  };

  const handleOpenTacticalMap = (mission: SARMission) => {
    router.push({
      pathname: '/sar/map' as any,
      params: {
        missionId: mission.id,
        title: mission.title,
        lat: mission.latitude.toString(),
        lng: mission.longitude.toString(),
        requester: mission.requesterName,
        address: mission.address,
      },
    });
  };

  const getDisasterIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('flood') || t.includes('water')) return <Waves size={18} color="#38BDF8" />;
    if (t.includes('fire')) return <Flame size={18} color="#FB923C" />;
    if (t.includes('medical')) return <HeartPulse size={18} color="#F87171" />;
    if (t.includes('collapse') || t.includes('building')) return <Building size={18} color="#FBBF24" />;
    return <AlertTriangle size={18} color="#FB923C" />;
  };

  const getStatusDisplay = (status: SARMissionStatus) => {
    switch (status) {
      case 'preparing':
        return {
          label: 'PREPARING',
          bg: 'rgba(234, 179, 8, 0.15)',
          border: '#EAB308',
          text: '#FDE047',
          icon: <Activity size={12} color="#FDE047" />,
        };
      case 'dispatched':
        return {
          label: 'DISPATCHED / EN ROUTE',
          bg: 'rgba(56, 189, 248, 0.15)',
          border: '#38BDF8',
          text: '#38BDF8',
          icon: <Navigation size={12} color="#38BDF8" />,
        };
      case 'resolved':
        return {
          label: 'RESOLVED / SAFE',
          bg: 'rgba(34, 197, 94, 0.15)',
          border: '#22C55E',
          text: '#4ADE80',
          icon: <CheckCircle2 size={12} color="#4ADE80" />,
        };
      default:
        return {
          label: 'PENDING ASSIGNMENT',
          bg: 'rgba(239, 68, 68, 0.15)',
          border: '#EF4444',
          text: '#FCA5A5',
          icon: <Clock size={12} color="#FCA5A5" />,
        };
    }
  };

  const filteredMissions = missions.filter((m) => {
    if (filter === 'all') return true;
    return m.status === filter;
  });

  return (
    <View style={styles.container}>
      {/* Filter Chips Bar */}
      <View style={styles.filterBar}>
        {(['all', 'preparing', 'dispatched', 'resolved'] as const).map((f) => (
          <Pressable
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}>
            <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
              {f === 'all' ? `All (${missions.length})` : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Mission Feed */}
      <ScrollView
        style={styles.feed}
        contentContainerStyle={styles.feedContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#EA580C" />}>
        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color="#EA580C" />
            <Text style={styles.loadingText}>Loading assigned missions...</Text>
          </View>
        ) : filteredMissions.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Compass size={48} color="#475569" />
            <Text style={styles.emptyTitle}>No Missions in This Filter</Text>
            <Text style={styles.emptyDesc}>No active missions assigned.</Text>
          </View>
        ) : (
          filteredMissions.map((mission) => {
            const st = getStatusDisplay(mission.status);

            return (
              <View key={mission.id} style={styles.missionCard}>
                {/* Top header row */}
                <View style={styles.missionHeader}>
                  <View style={styles.disasterTypeWrap}>
                    <View style={styles.disasterIconWrap}>
                      {getDisasterIcon(mission.disasterType)}
                    </View>
                    <View>
                      <Text style={styles.missionTitle}>{mission.title}</Text>
                      <Text style={styles.missionSub}>Team: {mission.teamName} ({mission.teamSize} members)</Text>
                    </View>
                  </View>

                  <View style={[styles.statusBadge, { backgroundColor: st.bg, borderColor: st.border }]}>
                    {st.icon}
                    <Text style={[styles.statusBadgeText, { color: st.text }]}>{st.label}</Text>
                  </View>
                </View>

                {/* Victim / Target info */}
                <View style={styles.targetSection}>
                  <View style={styles.targetRow}>
                    <User size={14} color="#EA580C" />
                    <Text style={styles.targetName}>{mission.requesterName}</Text>
                    {mission.requesterPhone && (
                      <Text style={styles.targetPhone}>• {mission.requesterPhone}</Text>
                    )}
                  </View>

                  <View style={styles.targetRow}>
                    <MapPin size={14} color="#EF4444" />
                    <Text style={styles.targetLocation} numberOfLines={1}>
                      {mission.address}
                    </Text>
                  </View>

                  {mission.additionalInfo && (
                    <Text style={styles.victimNotes}>"{mission.additionalInfo}"</Text>
                  )}
                </View>

                {/* Manager Operational Instructions */}
                {mission.managerInstructions && (
                  <View style={styles.ordersBox}>
                    <View style={styles.ordersHeader}>
                      <Radio size={14} color="#FB923C" />
                      <Text style={styles.ordersHeading}>MANAGER INSTRUCTIONS</Text>
                    </View>
                    <Text style={styles.ordersText}>{mission.managerInstructions}</Text>
                  </View>
                )}

                {/* Logistics & Supplies Strip */}
                <View style={styles.logisticsStrip}>
                  <View style={styles.logisticsItem}>
                    <Truck size={13} color="#94A3B8" />
                    <Text style={styles.logisticsText}>{mission.transportMode}</Text>
                  </View>

                  <View style={styles.logisticsItem}>
                    <Package size={13} color="#94A3B8" />
                    <Text style={styles.logisticsText}>
                      {Object.keys(mission.allocatedSupplies).length > 0
                        ? `${Object.keys(mission.allocatedSupplies).length} Stock Types Allotted`
                        : 'Standard Emergency Gear'}
                    </Text>
                  </View>
                </View>

                {/* Allocated Supplies details if present */}
                {Object.keys(mission.allocatedSupplies).length > 0 && (
                  <View style={styles.suppliesRow}>
                    {Object.entries(mission.allocatedSupplies).map(([item, qty]) => (
                      <View key={item} style={styles.supplyBadge}>
                        <Text style={styles.supplyBadgeText}>
                          {item}: {qty}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Action Buttons: Status Controller & Tactical Map */}
                <View style={styles.cardActions}>
                  <Pressable
                    style={styles.tacticalMapBtn}
                    onPress={() => handleOpenTacticalMap(mission)}>
                    <Navigation size={15} color="#F8FAFC" />
                    <Text style={styles.tacticalMapBtnText}>Tactical Map</Text>
                  </Pressable>

                  <Pressable
                    style={styles.updateStatusBtn}
                    onPress={() => handleOpenStatusChange(mission)}>
                    <Activity size={15} color="#FFFFFF" />
                    <Text style={styles.updateStatusBtnText}>Update Status</Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ── STATUS UPDATE MODAL (Preparing -> Dispatched -> Resolved) ───── */}
      {selectedMission && (
        <Modal visible={statusModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Update Mission Lifecycle Status</Text>
                <Text style={styles.modalSub}>ID: {selectedMission.id} • {selectedMission.title}</Text>
              </View>

              {/* Status Radio Choices */}
              <View style={styles.statusOptions}>
                {/* 1. Preparing */}
                <Pressable
                  style={[styles.statusOptionBtn, newStatus === 'preparing' && styles.statusOptionBtnPreparing]}
                  onPress={() => setNewStatus('preparing')}>
                  <View style={styles.statusOptionLeft}>
                    <View style={[styles.statusRadioDot, newStatus === 'preparing' && { backgroundColor: '#EAB308' }]} />
                    <View>
                      <Text style={[styles.statusOptionTitle, newStatus === 'preparing' && { color: '#FDE047' }]}>
                        🟡 PREPARING
                      </Text>
                      <Text style={styles.statusOptionDesc}>
                        Loading rescue gear, verifying rations & comms check.
                      </Text>
                    </View>
                  </View>
                </Pressable>

                {/* 2. Dispatched / En Route */}
                <Pressable
                  style={[styles.statusOptionBtn, newStatus === 'dispatched' && styles.statusOptionBtnDispatched]}
                  onPress={() => setNewStatus('dispatched')}>
                  <View style={styles.statusOptionLeft}>
                    <View style={[styles.statusRadioDot, newStatus === 'dispatched' && { backgroundColor: '#38BDF8' }]} />
                    <View>
                      <Text style={[styles.statusOptionTitle, newStatus === 'dispatched' && { color: '#38BDF8' }]}>
                        🔵 DISPATCHED / EN ROUTE
                      </Text>
                      <Text style={styles.statusOptionDesc}>
                        Active transit via {selectedMission.transportMode}. Moving to target.
                      </Text>
                    </View>
                  </View>
                </Pressable>

                {/* 3. Resolved / Safe */}
                <Pressable
                  style={[styles.statusOptionBtn, newStatus === 'resolved' && styles.statusOptionBtnResolved]}
                  onPress={() => setNewStatus('resolved')}>
                  <View style={styles.statusOptionLeft}>
                    <View style={[styles.statusRadioDot, newStatus === 'resolved' && { backgroundColor: '#22C55E' }]} />
                    <View>
                      <Text style={[styles.statusOptionTitle, newStatus === 'resolved' && { color: '#4ADE80' }]}>
                        🟢 RESOLVED / EXTRACTION COMPLETE
                      </Text>
                      <Text style={styles.statusOptionDesc}>
                        Victims safe, medical triage/rations delivered. Mission accomplished.
                      </Text>
                    </View>
                  </View>
                </Pressable>
              </View>

              {/* Field Note */}
              <View style={styles.noteInputWrap}>
                <Text style={styles.noteInputLabel}>Field Note / Update (Optional):</Text>
                <TextInput
                  style={styles.noteInput}
                  placeholder="e.g. Navigating canal, ETA 10 mins, weather holding."
                  placeholderTextColor="#64748B"
                  value={operativeNote}
                  onChangeText={setOperativeNote}
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.modalActionGroup}>
                <Pressable
                  style={styles.cancelBtn}
                  onPress={() => setStatusModalVisible(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>

                <Pressable
                  style={styles.broadcastBtn}
                  onPress={handleCommitStatusChange}
                  disabled={updating}>
                  {updating ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Send size={15} color="#FFFFFF" />
                      <Text style={styles.broadcastBtnText}>UPDATE STATUS</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#334155',
  },
  filterChipActive: {
    backgroundColor: '#EA580C',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  feed: {
    flex: 1,
  },
  feedContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  centerLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  emptyDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  missionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.2)',
    elevation: 3,
  },
  missionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  disasterTypeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  disasterIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  missionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  missionSub: {
    fontSize: 11,
    color: '#94A3B8',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  targetSection: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  targetName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  targetPhone: {
    fontSize: 12,
    color: '#94A3B8',
  },
  targetLocation: {
    fontSize: 12,
    color: '#CBD5E1',
    flex: 1,
  },
  victimNotes: {
    fontSize: 12,
    color: '#FDE047',
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    padding: 8,
    borderRadius: 6,
    lineHeight: 16,
    marginTop: 2,
  },
  ordersBox: {
    backgroundColor: 'rgba(234, 88, 12, 0.1)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(234, 88, 12, 0.3)',
    gap: 4,
  },
  ordersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ordersHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FB923C',
    letterSpacing: 0.5,
  },
  ordersText: {
    fontSize: 12,
    color: '#FED7AA',
    lineHeight: 18,
    fontWeight: '500',
  },
  logisticsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 8,
  },
  logisticsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  logisticsText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  suppliesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  supplyBadge: {
    backgroundColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  supplyBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 4,
  },
  tacticalMapBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#334155',
    paddingVertical: 10,
    borderRadius: 10,
  },
  tacticalMapBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  updateStatusBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EA580C',
    paddingVertical: 10,
    borderRadius: 10,
  },
  updateStatusBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalHeader: {
    gap: 2,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  modalSub: {
    fontSize: 11,
    color: '#94A3B8',
  },
  statusOptions: {
    gap: 8,
  },
  statusOptionBtn: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  statusOptionBtnPreparing: {
    borderColor: '#EAB308',
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
  },
  statusOptionBtnDispatched: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  statusOptionBtnResolved: {
    borderColor: '#22C55E',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  statusOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#475569',
  },
  statusOptionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  statusOptionDesc: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  noteInputWrap: {
    gap: 6,
  },
  noteInputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  noteInput: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#F8FAFC',
  },
  modalActionGroup: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 4,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  broadcastBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#EA580C',
  },
  broadcastBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
