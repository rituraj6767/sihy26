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
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import {
  Inbox,
  Clock,
  MapPin,
  Phone,
  User,
  AlertTriangle,
  Send,
  CheckCircle2,
  X,
  Radio,
  FileText,
  Flame,
  Waves,
  HeartPulse,
  Building,
} from 'lucide-react-native';
import { AuthService, CurrentUserSession } from '@/services/authService';
import { ManagerService, CitizenHelpRequest } from '@/services/managerService';

export default function RequestsScreen() {
  const [session, setSession] = useState<CurrentUserSession | null>(null);
  const [requests, setRequests] = useState<CitizenHelpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'dispatched' | 'resolved'>('all');
  const [selectedReq, setSelectedReq] = useState<CitizenHelpRequest | null>(null);
  const [updating, setUpdating] = useState(false);

  const managerState = session?.details?.state_of_operations || session?.details?.state || 'Assam';

  const loadRequests = async () => {
    try {
      const s = await AuthService.getSession();
      setSession(s);
      const st = s?.details?.state_of_operations || 'Assam';
      const data = await ManagerService.fetchHelpRequests(st);
      setRequests(data);
    } catch (e) {
      console.warn('Error loading requests:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadRequests();
  };

  const handleAcknowledge = async (reqId: string) => {
    setUpdating(true);
    try {
      await ManagerService.updateHelpRequestStatus(
        reqId,
        'acknowledged',
        'Relief Manager acknowledged request. Team standby.',
        session?.userId
      );
      setRequests((prev) =>
        prev.map((r) => (r.id === reqId ? { ...r, status: 'acknowledged' } : r))
      );
      if (selectedReq?.id === reqId) {
        setSelectedReq({ ...selectedReq, status: 'acknowledged' });
      }
    } catch {
      Alert.alert('Error', 'Could not update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleMarkResolved = async (reqId: string) => {
    setUpdating(true);
    try {
      await ManagerService.updateHelpRequestStatus(
        reqId,
        'resolved',
        'Citizen rescued / relief supplies delivered safely.',
        session?.userId
      );
      setRequests((prev) =>
        prev.map((r) => (r.id === reqId ? { ...r, status: 'resolved' } : r))
      );
      setSelectedReq(null);
      Alert.alert('Mission Resolved', 'Request has been marked resolved.');
    } catch {
      Alert.alert('Error', 'Could not update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleOpenDispatch = (req: CitizenHelpRequest) => {
    setSelectedReq(null);
    router.push({
      pathname: '/manager/dispatch' as any,
      params: {
        helpRequestId: req.id,
        disasterType: req.disaster_type,
        location: req.address || 'Reported Location',
        requester: req.person_name || 'Citizen',
      },
    });
  };

  const getDisasterIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('flood') || t.includes('water')) return <Waves size={18} color="#0284C7" />;
    if (t.includes('fire')) return <Flame size={18} color="#EA580C" />;
    if (t.includes('medical')) return <HeartPulse size={18} color="#DC2626" />;
    if (t.includes('collapse') || t.includes('building')) return <Building size={18} color="#D97706" />;
    return <AlertTriangle size={18} color="#7C3AED" />;
  };

  const getStatusBadge = (status: CitizenHelpRequest['status']) => {
    switch (status) {
      case 'pending':
        return { label: 'Pending SOS', bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' };
      case 'acknowledged':
        return { label: 'Acknowledged', bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' };
      case 'dispatched':
        return { label: 'Team Dispatched', bg: '#EDE9FE', text: '#6D28D9', border: '#C4B5FD' };
      case 'resolved':
        return { label: 'Resolved / Safe', bg: '#DCFCE7', text: '#166534', border: '#86EFAC' };
      default:
        return { label: status, bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' };
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  return (
    <View style={styles.container}>
      {/* Top Filter Strip */}
      <View style={styles.filterStrip}>
        {(['all', 'pending', 'dispatched', 'resolved'] as const).map((f) => (
          <Pressable
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}>
            <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
              {f === 'all' ? `All (${requests.length})` : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Requests Feed List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#7C3AED']} />}>
        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text style={styles.loadingText}>Loading requests...</Text>
          </View>
        ) : filteredRequests.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Inbox size={44} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Requests</Text>
            <Text style={styles.emptyDesc}>
              No citizen help requests found under this filter.
            </Text>
          </View>
        ) : (
          filteredRequests.map((req) => {
            const badge = getStatusBadge(req.status);

            return (
              <Pressable
                key={req.id}
                style={({ pressed }) => [styles.reqCard, pressed && styles.pressed]}
                onPress={() => setSelectedReq(req)}>
                {/* Header row */}
                <View style={styles.cardHeader}>
                  <View style={styles.disasterTypeWrap}>
                    <View style={styles.disasterIconCircle}>
                      {getDisasterIcon(req.disaster_type)}
                    </View>
                    <Text style={styles.disasterTypeLabel}>{req.disaster_type}</Text>
                  </View>

                  <View style={[styles.statusBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                    <Text style={[styles.statusBadgeText, { color: badge.text }]}>{badge.label}</Text>
                  </View>
                </View>

                {/* Requester & Location */}
                <View style={styles.infoRow}>
                  <User size={14} color="#64748B" />
                  <Text style={styles.infoTextPrimary}>{req.person_name || 'Citizen'}</Text>
                  {req.for_whom === 'someone' && (
                    <View style={styles.onBehalfTag}>
                      <Text style={styles.onBehalfText}>On Behalf</Text>
                    </View>
                  )}
                </View>

                <View style={styles.infoRow}>
                  <MapPin size={14} color="#64748B" />
                  <Text style={styles.infoTextSecondary} numberOfLines={1}>
                    {req.address || `${req.latitude?.toFixed(4)}, ${req.longitude?.toFixed(4)}`}
                  </Text>
                </View>

                {req.additional_info ? (
                  <Text style={styles.notesText} numberOfLines={2}>
                    "{req.additional_info}"
                  </Text>
                ) : null}

                {/* Card Footer Actions */}
                <View style={styles.cardFooter}>
                  <View style={styles.timeWrap}>
                    <Clock size={12} color="#94A3B8" />
                    <Text style={styles.timeText}>
                      {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>

                  <Pressable
                    style={styles.quickDispatchBtn}
                    onPress={() => handleOpenDispatch(req)}>
                    <Send size={14} color="#FFFFFF" />
                    <Text style={styles.quickDispatchText}>Dispatch Team</Text>
                  </Pressable>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      {/* Request Details & Action Modal */}
      {selectedReq && (
        <Modal visible transparent animationType="slide" onRequestClose={() => setSelectedReq(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderLeft}>
                  {getDisasterIcon(selectedReq.disaster_type)}
                  <View>
                    <Text style={styles.modalTitle}>{selectedReq.disaster_type} Emergency</Text>
                    <Text style={styles.modalSub}>ID: {selectedReq.id}</Text>
                  </View>
                </View>
                <Pressable onPress={() => setSelectedReq(null)} style={styles.closeBtn}>
                  <X size={20} color="#64748B" />
                </Pressable>
              </View>

              {/* Details Body */}
              <ScrollView style={styles.modalBody}>
                <View style={styles.detailSection}>
                  <Text style={styles.sectionLabel}>CITIZEN CONTACT</Text>
                  <View style={styles.detailBox}>
                    <View style={styles.detailItem}>
                      <User size={15} color="#7C3AED" />
                      <Text style={styles.detailValue}>{selectedReq.person_name || 'Self'}</Text>
                    </View>
                    {selectedReq.person_phone && (
                      <View style={styles.detailItem}>
                        <Phone size={15} color="#7C3AED" />
                        <Text style={styles.detailValue}>{selectedReq.person_phone}</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.sectionLabel}>LOCATION</Text>
                  <View style={styles.detailBox}>
                    <View style={styles.detailItem}>
                      <MapPin size={15} color="#DC2626" />
                      <Text style={styles.detailValue}>{selectedReq.address || 'GPS Location'}</Text>
                    </View>
                    {selectedReq.latitude && (
                      <Text style={styles.coordText}>
                        Lat: {selectedReq.latitude.toFixed(5)} • Lon: {selectedReq.longitude?.toFixed(5)}
                      </Text>
                    )}
                  </View>
                </View>

                {selectedReq.additional_info && (
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionLabel}>ADDITIONAL DETAILS</Text>
                    <View style={[styles.detailBox, { backgroundColor: '#FFFBEB' }]}>
                      <Text style={styles.situationText}>{selectedReq.additional_info}</Text>
                    </View>
                  </View>
                )}

                {selectedReq.status_note && (
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionLabel}>OPERATIONAL LOG</Text>
                    <Text style={styles.commandLogText}>{selectedReq.status_note}</Text>
                  </View>
                )}
              </ScrollView>

              {/* Modal Actions */}
              <View style={styles.modalActions}>
                {selectedReq.status === 'pending' && (
                  <Pressable
                    style={styles.ackBtn}
                    onPress={() => handleAcknowledge(selectedReq.id)}
                    disabled={updating}>
                    <Text style={styles.ackBtnText}>Acknowledge</Text>
                  </Pressable>
                )}

                {selectedReq.status !== 'resolved' && (
                  <Pressable
                    style={styles.resolveBtn}
                    onPress={() => handleMarkResolved(selectedReq.id)}
                    disabled={updating}>
                    <CheckCircle2 size={16} color="#16A34A" />
                    <Text style={styles.resolveBtnText}>Mark Resolved</Text>
                  </Pressable>
                )}

                <Pressable
                  style={styles.primaryDispatchBtn}
                  onPress={() => handleOpenDispatch(selectedReq)}>
                  <Send size={16} color="#FFFFFF" />
                  <Text style={styles.primaryDispatchBtnText}>Open Dispatch Wizard</Text>
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
    backgroundColor: '#F8FAFC',
  },
  filterStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  filterChipActive: {
    backgroundColor: '#7C3AED',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 12,
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
    color: '#64748B',
    fontWeight: '500',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptyDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  reqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.05)',
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  disasterTypeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  disasterIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disasterTypeLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoTextPrimary: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  infoTextSecondary: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
  },
  onBehalfTag: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  onBehalfText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#EA580C',
  },
  notesText: {
    fontSize: 12,
    color: '#334155',
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 6,
    lineHeight: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
    marginTop: 2,
  },
  timeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  quickDispatchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#7C3AED',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  quickDispatchText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    padding: 20,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 11,
    color: '#64748B',
  },
  closeBtn: {
    padding: 4,
  },
  modalBody: {
    maxHeight: 340,
  },
  detailSection: {
    marginBottom: 14,
    gap: 6,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  detailBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
  },
  coordText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  situationText: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  commandLogText: {
    fontSize: 12,
    color: '#475569',
    backgroundColor: '#F1F5F9',
    padding: 8,
    borderRadius: 6,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 8,
  },
  ackBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ackBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  resolveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
  },
  resolveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
  },
  primaryDispatchBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#7C3AED',
  },
  primaryDispatchBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.75,
  },
});
