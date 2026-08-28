import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Users,
  Package,
  Truck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Plus,
  Minus,
  Sparkles,
  Plane,
  Sailboat,
  Car,
  Footprints,
  FileCheck,
} from 'lucide-react-native';
import { AuthService, CurrentUserSession } from '@/services/authService';
import { ManagerService, TeamData, InventoryItem } from '@/services/managerService';

type DispatchStep = 'team' | 'supplies' | 'transport' | 'review' | 'success';

const TRANSPORTS = [
  { id: 'boat', label: 'Motorized Rescue Raft / Boat', icon: Sailboat, desc: 'Ideal for flood waters & submerged roads' },
  { id: 'helicopter', label: 'Helicopter / Aerial Airdrop', icon: Plane, desc: 'Rapid insertion & isolated roofs/hills' },
  { id: 'truck', label: '4x4 Heavy Disaster Truck', icon: Car, desc: 'Heavy gear transport & road transit' },
  { id: 'foot', label: 'Amphibious / On-Foot Search Unit', icon: Footprints, desc: 'Dense alleyways & structural rubble' },
];

export default function DispatchScreen() {
  const params = useLocalSearchParams<{
    helpRequestId?: string;
    disasterType?: string;
    location?: string;
    requester?: string;
  }>();

  const [session, setSession] = useState<CurrentUserSession | null>(null);
  const [step, setStep] = useState<DispatchStep>('team');
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dispatching, setDispatching] = useState(false);

  // Wizard Selections
  const [selectedTeam, setSelectedTeam] = useState<TeamData | null>(null);
  const [selectedSupplies, setSelectedSupplies] = useState<Record<string, number>>({});
  const [selectedTransport, setSelectedTransport] = useState<string>('boat');
  const [transportNotes, setTransportNotes] = useState<string>('');

  const loadData = async () => {
    try {
      const s = await AuthService.getSession();
      setSession(s);
      const userId = s?.userId;

      const [teamsData, invData] = await Promise.all([
        ManagerService.fetchTeams(userId),
        ManagerService.fetchInventory(userId),
      ]);

      setTeams(teamsData);
      setInventory(invData);

      // Pre-select first team
      if (teamsData.length > 0) setSelectedTeam(teamsData[0]);

      // Initialize default supply allocation suggestions (clamped to available stock)
      const defaultAllocation: Record<string, number> = {};
      invData.forEach((item) => {
        if (item.item_name.includes('Ration')) defaultAllocation[item.item_name] = Math.min(item.quantity, 20);
        else if (item.item_name.includes('Water')) defaultAllocation[item.item_name] = Math.min(item.quantity, 50);
        else if (item.item_name.includes('First Aid')) defaultAllocation[item.item_name] = Math.min(item.quantity, 5);
        else if (item.item_name.includes('Life Jacket')) defaultAllocation[item.item_name] = Math.min(item.quantity, 6);
        else defaultAllocation[item.item_name] = 0;
      });
      setSelectedSupplies(defaultAllocation);
    } catch (e) {
      console.warn('Error loading dispatch data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateSupplyQty = (itemName: string, delta: number, maxAvailable: number) => {
    const current = selectedSupplies[itemName] || 0;
    const next = Math.max(0, Math.min(maxAvailable, current + delta));
    setSelectedSupplies({ ...selectedSupplies, [itemName]: next });
  };

  const handleConfirmDispatch = async () => {
    if (!selectedTeam) {
      Alert.alert('Error', 'Please select a response team');
      return;
    }

    setDispatching(true);
    try {
      const userId = session?.userId || 'manager-1';
      const result = await ManagerService.dispatchMission(userId, {
        team_id: selectedTeam.id,
        team_name: selectedTeam.name,
        team_size: selectedTeam.size,
        help_request_id: params.helpRequestId,
        grid_cells: [],
        supplies: selectedSupplies,
        transport: TRANSPORTS.find((t) => t.id === selectedTransport)?.label || selectedTransport,
        transport_notes: transportNotes,
      });

      if (result.success) {
        setStep('success');
      } else {
        Alert.alert('Dispatch Warning', result.error || 'Failed to dispatch');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not complete dispatch');
    } finally {
      setDispatching(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerLoading}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.loadingText}>Loading dispatch resources...</Text>
      </View>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SUCCESS SCREEN
  // ───────────────────────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successCard}>
          <View style={styles.successIconCircle}>
            <CheckCircle2 size={54} color="#16A34A" />
          </View>

          <Text style={styles.successTitle}>Mission Dispatched!</Text>
          <Text style={styles.successSubtitle}>
            {selectedTeam?.name} ({selectedTeam?.size} members) is en route via {TRANSPORTS.find((t) => t.id === selectedTransport)?.label}.
          </Text>

          {/* Allocation summary */}
          <View style={styles.summaryBox}>
            <Text style={styles.summaryHeading}>SUPPLIES ALLOTTED & DEDUCTED</Text>
            {Object.entries(selectedSupplies)
              .filter(([_, qty]) => qty > 0)
              .map(([item, qty]) => (
                <View key={item} style={styles.summaryItemRow}>
                  <Text style={styles.summaryItemName}>{item}</Text>
                  <Text style={styles.summaryItemQty}>− {qty}</Text>
                </View>
              ))}
          </View>

          <View style={styles.successBtnGroup}>
            <Pressable
              style={styles.primaryActionBtn}
              onPress={() => router.replace('/manager/requests' as any)}>
              <Text style={styles.primaryActionBtnText}>Back to Requests</Text>
            </Pressable>

            <Pressable
              style={styles.secondaryActionBtn}
              onPress={() => {
                setStep('team');
                loadData();
              }}>
              <Text style={styles.secondaryActionBtnText}>Dispatch Another Team</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Stepper Progress Bar */}
      <View style={styles.stepperHeader}>
        {(['team', 'supplies', 'transport', 'review'] as const).map((s, idx) => {
          const stepNames = ['1. Team', '2. Supplies', '3. Transport', '4. Review'];
          const isDone = ['team', 'supplies', 'transport', 'review'].indexOf(step) > idx;
          const isCurrent = step === s;

          return (
            <View key={s} style={styles.stepItem}>
              <View
                style={[
                  styles.stepIndicator,
                  isCurrent && styles.stepIndicatorCurrent,
                  isDone && styles.stepIndicatorDone,
                ]}>
                <Text
                  style={[
                    styles.stepIndicatorText,
                    (isCurrent || isDone) && styles.stepIndicatorTextActive,
                  ]}>
                  {idx + 1}
                </Text>
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  isCurrent && styles.stepLabelCurrent,
                  isDone && styles.stepLabelDone,
                ]}>
                {stepNames[idx].split(' ')[1]}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Target Incident Context if applicable */}
      {params.helpRequestId && (
        <View style={styles.contextBanner}>
          <Text style={styles.contextBannerTitle}>
            Responding to SOS: {params.disasterType} • {params.requester}
          </Text>
          <Text style={styles.contextBannerSub} numberOfLines={1}>{params.location}</Text>
        </View>
      )}

      {/* Main Wizard Content */}
      <ScrollView style={styles.wizardContent} contentContainerStyle={styles.wizardInner}>
        {/* ── STEP 1: SELECT TEAM ─────────────────────────────────────── */}
        {step === 'team' && (
          <View style={styles.stepSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Select Response Team</Text>
              <Text style={styles.sectionSub}>Choose from preset response teams</Text>
            </View>

            <View style={styles.teamsList}>
              {teams.map((t) => {
                const isSelected = selectedTeam?.id === t.id;

                return (
                  <Pressable
                    key={t.id}
                    style={[styles.teamCard, isSelected && styles.teamCardSelected]}
                    onPress={() => setSelectedTeam(t)}>
                    <View style={styles.teamCardTop}>
                      <View style={styles.teamTitleWrap}>
                        <Users size={20} color={isSelected ? '#7C3AED' : '#475569'} />
                        <Text style={[styles.teamName, isSelected && styles.teamNameSelected]}>
                          {t.name}
                        </Text>
                      </View>
                      <View style={[styles.sizePill, t.size === 10 ? styles.size10Pill : styles.size5Pill]}>
                        <Text style={[styles.sizePillText, t.size === 10 ? styles.size10Text : styles.size5Text]}>
                          {t.size} Members
                        </Text>
                      </View>
                    </View>

                    <View style={styles.memberChipsWrap}>
                      {t.members?.map((m, i) => (
                        <View key={i} style={styles.memberChip}>
                          <Text style={styles.memberChipText}>{m}</Text>
                        </View>
                      ))}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* ── STEP 2: SELECT SUPPLIES ─────────────────────────────────── */}
        {step === 'supplies' && (
          <View style={styles.stepSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Allocate Supplies & Rations</Text>
              <Text style={styles.sectionSub}>Stock is updated upon dispatch</Text>
            </View>

            <View style={styles.suppliesList}>
              {inventory.map((item) => {
                const allotted = selectedSupplies[item.item_name] || 0;
                const remaining = Math.max(0, item.quantity - allotted);

                return (
                  <View key={item.item_name} style={styles.supplyRowCard}>
                    <View style={styles.supplyInfo}>
                      <Text style={styles.supplyName}>{item.item_name}</Text>
                      <Text style={styles.supplyStockSub}>
                        Stock: {remaining} {item.unit} available
                      </Text>
                    </View>

                    <View style={styles.supplyControls}>
                      <Pressable
                        style={styles.counterBtn}
                        onPress={() => updateSupplyQty(item.item_name, -10, item.quantity)}>
                        <Minus size={14} color="#0F172A" />
                      </Pressable>
                      <Text style={styles.counterVal}>{allotted}</Text>
                      <Pressable
                        style={styles.counterBtn}
                        onPress={() => updateSupplyQty(item.item_name, 10, item.quantity)}>
                        <Plus size={14} color="#0F172A" />
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ── STEP 3: TRANSPORT ───────────────────────────────────────── */}
        {step === 'transport' && (
          <View style={styles.stepSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Transport Mode</Text>
              <Text style={styles.sectionSub}>Select primary vehicle for mission</Text>
            </View>

            <View style={styles.transportsList}>
              {TRANSPORTS.map((t) => {
                const IconComponent = t.icon;
                const isSelected = selectedTransport === t.id;

                return (
                  <Pressable
                    key={t.id}
                    style={[styles.transportCard, isSelected && styles.transportCardSelected]}
                    onPress={() => setSelectedTransport(t.id)}>
                    <View style={[styles.transportIconWrap, isSelected && styles.transportIconSelected]}>
                      <IconComponent size={24} color={isSelected ? '#7C3AED' : '#475569'} />
                    </View>
                    <View style={styles.transportTextWrap}>
                      <Text style={[styles.transportTitle, isSelected && styles.transportTitleSelected]}>
                        {t.label}
                      </Text>
                      <Text style={styles.transportDesc}>{t.desc}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* Optional Logistics Note */}
            <View style={styles.noteFieldWrap}>
              <Text style={styles.noteFieldLabel}>Special Instructions / Notes</Text>
              <TextInput
                style={styles.noteInput}
                placeholder="e.g. Approach via North-West Causeway, VHF Ch 16, ETA 25m"
                placeholderTextColor="#94A3B8"
                value={transportNotes}
                onChangeText={setTransportNotes}
              />
            </View>
          </View>
        )}

        {/* ── STEP 4: REVIEW & CONFIRM ────────────────────────────────── */}
        {step === 'review' && (
          <View style={styles.stepSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Review Mission Details</Text>
              <Text style={styles.sectionSub}>Confirm team, supplies, and route</Text>
            </View>

            <View style={styles.manifestCard}>
              <View style={styles.manifestItem}>
                <Text style={styles.manifestLabel}>ASSIGNED TEAM</Text>
                <Text style={styles.manifestValPrimary}>{selectedTeam?.name}</Text>
                <Text style={styles.manifestValSub}>{selectedTeam?.size} Members</Text>
              </View>

              <View style={styles.manifestItem}>
                <Text style={styles.manifestLabel}>TRANSPORTATION</Text>
                <Text style={styles.manifestValPrimary}>
                  {TRANSPORTS.find((t) => t.id === selectedTransport)?.label}
                </Text>
                {transportNotes ? <Text style={styles.manifestValSub}>{transportNotes}</Text> : null}
              </View>

              <View style={styles.manifestItem}>
                <Text style={styles.manifestLabel}>SUPPLIES ALLOTTED</Text>
                {Object.entries(selectedSupplies)
                  .filter(([_, qty]) => qty > 0)
                  .map(([item, qty]) => (
                    <View key={item} style={styles.manifestSupplyRow}>
                      <Text style={styles.manifestSupplyName}>{item}</Text>
                      <Text style={styles.manifestSupplyQty}>{qty} units</Text>
                    </View>
                  ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Wizard Bottom Controls */}
      <View style={styles.bottomControls}>
        {step !== 'team' && (
          <Pressable
            style={styles.backBtn}
            onPress={() => {
              if (step === 'supplies') setStep('team');
              else if (step === 'transport') setStep('supplies');
              else if (step === 'review') setStep('transport');
            }}>
            <ArrowLeft size={16} color="#475569" />
            <Text style={styles.backBtnText}>Back</Text>
          </Pressable>
        )}

        {step !== 'review' ? (
          <Pressable
            style={styles.nextBtn}
            onPress={() => {
              if (step === 'team') setStep('supplies');
              else if (step === 'supplies') setStep('transport');
              else if (step === 'transport') setStep('review');
            }}>
            <Text style={styles.nextBtnText}>Next Step</Text>
            <ArrowRight size={16} color="#FFFFFF" />
          </Pressable>
        ) : (
          <Pressable
            style={styles.dispatchConfirmBtn}
            onPress={handleConfirmDispatch}
            disabled={dispatching}>
            {dispatching ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <FileCheck size={18} color="#FFFFFF" />
                <Text style={styles.dispatchConfirmBtnText}>AUTHORIZE & DISPATCH</Text>
              </>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  stepperHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  stepItem: {
    alignItems: 'center',
    gap: 4,
  },
  stepIndicator: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIndicatorCurrent: {
    backgroundColor: '#7C3AED',
  },
  stepIndicatorDone: {
    backgroundColor: '#10B981',
  },
  stepIndicatorText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  stepIndicatorTextActive: {
    color: '#FFFFFF',
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  stepLabelCurrent: {
    color: '#7C3AED',
    fontWeight: '700',
  },
  stepLabelDone: {
    color: '#10B981',
  },
  contextBanner: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  contextBannerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  contextBannerSub: {
    fontSize: 11,
    color: '#B45309',
  },
  wizardContent: {
    flex: 1,
  },
  wizardInner: {
    padding: 16,
    paddingBottom: 90,
  },
  stepSection: {
    gap: 14,
  },
  sectionHeader: {
    gap: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionSub: {
    fontSize: 12,
    color: '#64748B',
  },
  teamsList: {
    gap: 10,
  },
  teamCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  teamCardSelected: {
    borderColor: '#7C3AED',
    backgroundColor: '#FAF5FF',
  },
  teamCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teamName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  teamNameSelected: {
    color: '#7C3AED',
  },
  sizePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  size5Pill: {
    backgroundColor: '#EFF6FF',
  },
  size10Pill: {
    backgroundColor: '#FEF3C7',
  },
  sizePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  size5Text: {
    color: '#1D4ED8',
  },
  size10Text: {
    color: '#B45309',
  },
  memberChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  memberChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  memberChipText: {
    fontSize: 11,
    color: '#475569',
  },
  suppliesList: {
    gap: 8,
  },
  supplyRowCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  supplyInfo: {
    flex: 1,
    gap: 2,
  },
  supplyName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  supplyStockSub: {
    fontSize: 11,
    color: '#64748B',
  },
  supplyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  counterBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    minWidth: 24,
    textAlign: 'center',
  },
  transportsList: {
    gap: 10,
  },
  transportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  transportCardSelected: {
    borderColor: '#7C3AED',
    backgroundColor: '#FAF5FF',
  },
  transportIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transportIconSelected: {
    backgroundColor: '#EDE9FE',
  },
  transportTextWrap: {
    flex: 1,
    gap: 2,
  },
  transportTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  transportTitleSelected: {
    color: '#7C3AED',
  },
  transportDesc: {
    fontSize: 11,
    color: '#64748B',
  },
  noteFieldWrap: {
    gap: 6,
    marginTop: 8,
  },
  noteFieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  noteInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  manifestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 16,
  },
  manifestItem: {
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
  },
  manifestLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  manifestValPrimary: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  manifestValSub: {
    fontSize: 12,
    color: '#64748B',
  },
  manifestSupplyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  manifestSupplyName: {
    fontSize: 12,
    color: '#334155',
  },
  manifestSupplyQty: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7C3AED',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#7C3AED',
  },
  nextBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dispatchConfirmBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: '#16A34A',
  },
  dispatchConfirmBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#F8FAFC',
  },
  successCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    maxWidth: 380,
    width: '100%',
    boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.08)',
    elevation: 4,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  successSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  summaryBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryHeading: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  summaryItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItemName: {
    fontSize: 12,
    color: '#334155',
  },
  summaryItemQty: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  successBtnGroup: {
    width: '100%',
    gap: 8,
    marginTop: 8,
  },
  primaryActionBtn: {
    backgroundColor: '#7C3AED',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryActionBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryActionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
});
