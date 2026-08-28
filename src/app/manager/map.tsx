import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import {
  ShieldAlert,
  Users,
  CheckCircle,
  AlertOctagon,
  Layers,
  MapPin,
  RefreshCw,
  Plus,
  Minus,
  Info,
  Building,
  Shield,
} from 'lucide-react-native';
import { AuthService, CurrentUserSession } from '@/services/authService';
import { ManagerService, GridCellData, AgencySectorAssignment } from '@/services/managerService';
import { GdacsGeometry } from '@/services/gdacsService';

// Safely import react-native-maps for native platforms
let MapView: any = null;
let Polygon: any = null;
let Marker: any = null;

if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default || Maps;
    Polygon = Maps.Polygon;
    Marker = Maps.Marker;
  } catch (e) {
    console.warn('react-native-maps load note:', e);
  }
}

export default function MapGridScreen() {
  const params = useLocalSearchParams<{
    disasterGuid?: string;
    title?: string;
    lat?: string;
    lng?: string;
    state?: string;
  }>();

  const [session, setSession] = useState<CurrentUserSession | null>(null);
  const [managerId, setManagerId] = useState<string>('');
  const [managerOrgName, setManagerOrgName] = useState<string>('National Relief Force');
  const [managerState, setManagerState] = useState<string>('Assam');
  const [activeDisasterGuid, setActiveDisasterGuid] = useState<string>(
    params.disasterGuid || '1787749908017010'
  );
  const [disasterTitle, setDisasterTitle] = useState<string>(
    params.title || 'River Beki Flood Warning, Barpeta District'
  );

  const centerLat = parseFloat(params.lat || '26.49');
  const centerLng = parseFloat(params.lng || '90.91');

  const [cells, setCells] = useState<GridCellData[]>([]);
  const [selectedCellIds, setSelectedCellIds] = useState<string[]>([]);
  const [inspectedCellId, setInspectedCellId] = useState<string | null>('cell-2-3');
  const [gdacsPolygon, setGdacsPolygon] = useState<GdacsGeometry | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [assignTeamCount, setAssignTeamCount] = useState<number>(1);

  // Initialize and load
  const loadGrid = async () => {
    setLoading(true);
    try {
      const s = await AuthService.getSession();
      setSession(s);
      const userId = s?.userId || 'manager-1';
      const org = s?.details?.org_name || s?.name || 'Relief Agency Command';
      const st = s?.details?.state_of_operations || params.state || 'Assam';

      setManagerId(userId);
      setManagerOrgName(org);
      setManagerState(st);

      // 1. Generate base 6x6 grid cells around center coordinates
      const baseCells = ManagerService.generateGridCells(centerLat, centerLng, 6, 0.5);

      // 2. Fetch live multi-agency coverage data across ALL organizations from Supabase
      const assignments = await ManagerService.getGridAssignments(activeDisasterGuid, userId);

      // 3. Merge coverage: Red (0), Grey (1-2), Green (3+)
      const mergedCells = baseCells.map((cell) => {
        const record = assignments[cell.id] || {
          teamCount: 0,
          assignedByMe: false,
          myOrgTeamCount: 0,
          agencies: [],
        };

        let coverage: GridCellData['coverage'] = 'uncovered';
        if (record.teamCount >= 3) coverage = 'covered';
        else if (record.teamCount >= 1) coverage = 'partial';

        return {
          ...cell,
          teamCount: record.teamCount,
          coverage,
          assignedByMe: record.assignedByMe,
          myOrgTeamCount: record.myOrgTeamCount,
          agencies: record.agencies,
        };
      });

      setCells(mergedCells);

      // 4. Try fetching GDACS polygon for event if available
      const gdacs = await ManagerService.fetchGdacsGeometry(centerLat, centerLng);
      setGdacsPolygon(gdacs);
    } catch (e) {
      console.warn('Error loading grid:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGrid();
  }, [activeDisasterGuid, centerLat, centerLng]);

  const handleSelectCell = (cellId: string) => {
    setInspectedCellId(cellId);
    if (selectedCellIds.includes(cellId)) {
      setSelectedCellIds(selectedCellIds.filter((id) => id !== cellId));
    } else {
      setSelectedCellIds([...selectedCellIds, cellId]);
    }
  };

  const handleAssignTeams = async () => {
    const targetCellIds = selectedCellIds.length > 0 ? selectedCellIds : (inspectedCellId ? [inspectedCellId] : []);

    if (targetCellIds.length === 0) {
      Alert.alert('Select Sector', 'Please tap a grid sector on the map to assign teams.');
      return;
    }

    setSaving(true);
    try {
      await ManagerService.saveGridAssignments(
        activeDisasterGuid,
        managerId,
        managerOrgName,
        targetCellIds,
        assignTeamCount
      );

      // Optimistically update local state
      setCells((prev) =>
        prev.map((c) => {
          if (targetCellIds.includes(c.id)) {
            const newTotalCount = c.teamCount + assignTeamCount;
            const newMyCount = (c.myOrgTeamCount || 0) + assignTeamCount;

            const updatedAgencies: AgencySectorAssignment[] = [
              ...c.agencies.filter((a) => a.managerId !== managerId),
              {
                managerId,
                orgName: `${managerOrgName} (Your Org)`,
                teamCount: newMyCount,
                updatedAt: new Date().toISOString(),
              },
            ];

            return {
              ...c,
              teamCount: newTotalCount,
              myOrgTeamCount: newMyCount,
              coverage: newTotalCount >= 3 ? 'covered' : 'partial',
              assignedByMe: true,
              agencies: updatedAgencies,
            };
          }
          return c;
        })
      );

      Alert.alert(
        'Sector Deployment Authorized',
        `Successfully registered ${assignTeamCount} team(s) from "${managerOrgName}" to sector(s): ${targetCellIds.map((s) => s.replace('cell-', '')).join(', ')}.`
      );
      setSelectedCellIds([]);
    } catch (e) {
      Alert.alert('Error', 'Could not save grid assignment.');
    } finally {
      setSaving(false);
    }
  };

  // Stats calculation across the whole incident
  const stats = useMemo(() => {
    const total = cells.length;
    const uncovered = cells.filter((c) => c.coverage === 'uncovered').length;
    const partial = cells.filter((c) => c.coverage === 'partial').length;
    const covered = cells.filter((c) => c.coverage === 'covered').length;
    const totalTeams = cells.reduce((acc, c) => acc + c.teamCount, 0);
    return { total, uncovered, partial, covered, totalTeams };
  }, [cells]);

  const inspectedCell = useMemo(() => {
    if (!inspectedCellId) return null;
    return cells.find((c) => c.id === inspectedCellId) || null;
  }, [cells, inspectedCellId]);

  const getCoverageColor = (coverage: GridCellData['coverage'], opacity: number = 0.35) => {
    switch (coverage) {
      case 'covered':
        return `rgba(34, 197, 94, ${opacity})`; // Green (3+ teams)
      case 'partial':
        return `rgba(148, 163, 184, ${opacity + 0.15})`; // Grey (1-2 teams)
      default:
        return `rgba(239, 68, 68, ${opacity})`; // Red (0 teams)
    }
  };

  const getCoverageBorderColor = (coverage: GridCellData['coverage']) => {
    switch (coverage) {
      case 'covered':
        return '#16A34A';
      case 'partial':
        return '#64748B';
      default:
        return '#DC2626';
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Context Strip */}
      <View style={styles.headerStrip}>
        <View style={styles.headerTextWrap}>
          <View style={styles.badgeRow}>
            <View style={styles.disasterBadge}>
              <ShieldAlert size={12} color="#DC2626" />
              <Text style={styles.disasterBadgeText}>MULTI-AGENCY ZONE</Text>
            </View>
            <View style={styles.orgBadge}>
              <Building size={11} color="#7C3AED" />
              <Text style={styles.orgBadgeText} numberOfLines={1}>{managerOrgName}</Text>
            </View>
            {gdacsPolygon && (
              <View style={styles.gdacsBadge}>
                <Layers size={12} color="#0284C7" />
                <Text style={styles.gdacsBadgeText}>GDACS Polygon</Text>
              </View>
            )}
          </View>
          <Text style={styles.disasterTitle} numberOfLines={1}>
            {disasterTitle}
          </Text>
        </View>

        <Pressable onPress={loadGrid} style={styles.refreshBtn}>
          <RefreshCw size={16} color="#475569" />
        </Pressable>
      </View>

      {/* Legend & Multi-Agency Stats Banner */}
      <View style={styles.legendBar}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
          <Text style={styles.legendLabel}>
            🔴 Red ({stats.uncovered}): 0 Teams
          </Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#94A3B8' }]} />
          <Text style={styles.legendLabel}>
            ⚫ Grey ({stats.partial}): 1-2 Teams
          </Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#22C55E' }]} />
          <Text style={styles.legendLabel}>
            🟢 Green ({stats.covered}): 3+ Teams
          </Text>
        </View>
      </View>

      <ScrollView style={styles.mainScroll} contentContainerStyle={styles.mainScrollContent}>
        {/* Map & Grid View Area */}
        <View style={styles.mapContainer}>
          {loading ? (
            <View style={styles.loadingCenter}>
              <ActivityIndicator size="large" color="#7C3AED" />
              <Text style={styles.loadingText}>Loading map & sector data...</Text>
            </View>
          ) : (
            <View style={styles.interactiveGrid}>
              {/* Native MapView if available */}
              {Platform.OS !== 'web' && MapView ? (
                <View style={styles.nativeMapWrap}>
                  <MapView
                    style={StyleSheet.absoluteFill}
                    initialRegion={{
                      latitude: centerLat,
                      longitude: centerLng,
                      latitudeDelta: 0.7,
                      longitudeDelta: 0.7,
                    }}>
                    {Marker && (
                      <Marker
                        coordinate={{ latitude: centerLat, longitude: centerLng }}
                        title={disasterTitle}
                        description="Incident Location"
                      />
                    )}

                    {/* Render Grid Polygons */}
                    {Polygon &&
                      cells.map((cell) => {
                        const isSelected = selectedCellIds.includes(cell.id);
                        const isInspected = inspectedCellId === cell.id;
                        const coords = [
                          { latitude: cell.bounds.north, longitude: cell.bounds.west },
                          { latitude: cell.bounds.north, longitude: cell.bounds.east },
                          { latitude: cell.bounds.south, longitude: cell.bounds.east },
                          { latitude: cell.bounds.south, longitude: cell.bounds.west },
                        ];
                        return (
                          <Polygon
                            key={cell.id}
                            coordinates={coords}
                            fillColor={isSelected || isInspected ? 'rgba(124, 58, 237, 0.6)' : getCoverageColor(cell.coverage)}
                            strokeColor={isSelected || isInspected ? '#7C3AED' : getCoverageBorderColor(cell.coverage)}
                            strokeWidth={isSelected || isInspected ? 3 : 1.5}
                            tappable
                            onPress={() => handleSelectCell(cell.id)}
                          />
                        );
                      })}
                  </MapView>
                </View>
              ) : null}

              {/* Grid Overlay Matrix & Cell Selector */}
              <View style={styles.gridMatrixContainer}>
                <View style={styles.matrixCard}>
                  <View style={styles.matrixHeader}>
                    <Text style={styles.matrixTitle}>6×6 Sector Grid</Text>
                    <Text style={styles.matrixHint}>
                      Tap any sector to view assigned relief teams
                    </Text>
                  </View>

                  <View style={styles.grid6x6}>
                    {cells.map((cell) => {
                      const isSelected = selectedCellIds.includes(cell.id);
                      const isInspected = inspectedCellId === cell.id;
                      const cov = cell.coverage;

                      let bg = '#FEE2E2';
                      let border = '#F87171';
                      let label = '0';

                      if (cov === 'covered') {
                        bg = '#DCFCE7';
                        border = '#4ADE80';
                        label = `${cell.teamCount}T`;
                      } else if (cov === 'partial') {
                        bg = '#F1F5F9';
                        border = '#94A3B8';
                        label = `${cell.teamCount}T`;
                      }

                      if (isInspected || isSelected) {
                        bg = '#EDE9FE';
                        border = '#7C3AED';
                      }

                      return (
                        <Pressable
                          key={cell.id}
                          style={[
                            styles.gridBox,
                            { backgroundColor: bg, borderColor: border },
                            (isInspected || isSelected) && styles.gridBoxSelected,
                          ]}
                          onPress={() => handleSelectCell(cell.id)}>
                          <Text style={[styles.gridBoxLabel, (isInspected || isSelected) && styles.gridBoxLabelSelected]}>
                            {cell.id.replace('cell-', '')}
                          </Text>
                          <Text style={[styles.gridBoxCount, (isInspected || isSelected) && styles.gridBoxLabelSelected]}>
                            {cov === 'uncovered' ? '🔴' : cov === 'partial' ? '⚫' : '🟢'} {label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* ── SECTOR INSPECTOR PANEL ────────────────────────── */}
        {inspectedCell && (
          <View style={styles.inspectorCard}>
            <View style={styles.inspectorHeader}>
              <View style={styles.inspectorHeaderLeft}>
                <View style={[
                  styles.statusCircle,
                  { backgroundColor: inspectedCell.coverage === 'covered' ? '#22C55E' : inspectedCell.coverage === 'partial' ? '#94A3B8' : '#EF4444' }
                ]} />
                <View>
                  <Text style={styles.inspectorTitle}>
                    Sector [{inspectedCell.id.replace('cell-', '').replace('-', ', ')}] Status
                  </Text>
                  <Text style={styles.inspectorSub}>
                    {inspectedCell.teamCount === 0
                      ? '🔴 Uncovered: 0 rescue teams deployed'
                      : inspectedCell.coverage === 'covered'
                      ? `🟢 Well-Covered: ${inspectedCell.teamCount} total rescue teams active`
                      : `⚫ Partial Coverage: ${inspectedCell.teamCount} rescue team(s) active`}
                  </Text>
                </View>
              </View>
            </View>

            {/* Organizations operating in this cell */}
            <View style={styles.agencySection}>
              <Text style={styles.agencySectionHeading}>ASSIGNED RELIEF ORGANIZATIONS:</Text>

              {inspectedCell.agencies && inspectedCell.agencies.length > 0 ? (
                <View style={styles.agencyList}>
                  {inspectedCell.agencies.map((agency, i) => (
                    <View key={i} style={styles.agencyRow}>
                      <View style={styles.agencyRowLeft}>
                        <Shield size={16} color="#7C3AED" />
                        <Text style={styles.agencyOrgName}>{agency.orgName}</Text>
                      </View>
                      <View style={styles.agencyCountBadge}>
                        <Text style={styles.agencyCountText}>{agency.teamCount} Team{agency.teamCount > 1 ? 's' : ''}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.noAgenciesBox}>
                  <AlertOctagon size={16} color="#DC2626" />
                  <Text style={styles.noAgenciesText}>
                    No relief teams currently deployed in this sector.
                  </Text>
                </View>
              )}
            </View>

            {/* My Organization Status */}
            <View style={styles.myOrgStatusBox}>
              <Text style={styles.myOrgStatusLabel}>YOUR TEAM DEPLOYMENT ({managerOrgName}):</Text>
              <Text style={styles.myOrgStatusValue}>
                {inspectedCell.myOrgTeamCount && inspectedCell.myOrgTeamCount > 0
                  ? `You have ${inspectedCell.myOrgTeamCount} team(s) active in this sector.`
                  : `Your organization currently has 0 teams in this sector.`}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Assignment Command Drawer */}
      <View style={styles.bottomDrawer}>
        <View style={styles.drawerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.selectedTitle}>
              {selectedCellIds.length === 0
                ? (inspectedCellId ? `Deploy to Sector [${inspectedCellId.replace('cell-', '')}]` : 'Select sectors to deploy')
                : `${selectedCellIds.length} Sector${selectedCellIds.length > 1 ? 's' : ''} Selected`}
            </Text>
            <Text style={styles.selectedDesc} numberOfLines={1}>
              {selectedCellIds.length === 0
                ? `Assigning from ${managerOrgName}`
                : `Allocating ${managerOrgName} units to: ${selectedCellIds.map((s) => s.replace('cell-', '')).join(', ')}`}
            </Text>
          </View>

          {/* Stepper for team count */}
          <View style={styles.stepperWrap}>
            <Text style={styles.stepperLabel}>Teams:</Text>
            <Pressable
              style={styles.stepBtn}
              onPress={() => setAssignTeamCount(Math.max(1, assignTeamCount - 1))}>
              <Minus size={14} color="#0F172A" />
            </Pressable>
            <Text style={styles.stepVal}>{assignTeamCount}</Text>
            <Pressable
              style={styles.stepBtn}
              onPress={() => setAssignTeamCount(Math.min(5, assignTeamCount + 1))}>
              <Plus size={14} color="#0F172A" />
            </Pressable>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.assignBtn,
            saving && styles.assignBtnDisabled,
            pressed && styles.pressed,
          ]}
          disabled={saving}
          onPress={handleAssignTeams}>
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Users size={18} color="#FFFFFF" />
              <Text style={styles.assignBtnText}>
                Deploy {assignTeamCount} Team(s) from {managerOrgName.split(' ')[0]}
              </Text>
            </>
          )}
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
  headerStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTextWrap: {
    flex: 1,
    gap: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  disasterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  disasterBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#991B1B',
    letterSpacing: 0.5,
  },
  orgBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    maxWidth: 140,
  },
  orgBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#7C3AED',
  },
  gdacsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  gdacsBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#0369A1',
  },
  disasterTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  refreshBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginLeft: 8,
  },
  legendBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  mainScroll: {
    flex: 1,
  },
  mainScrollContent: {
    paddingBottom: 90,
  },
  mapContainer: {
    position: 'relative',
  },
  nativeMapWrap: {
    height: 240,
    width: '100%',
  },
  loadingCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    paddingHorizontal: 20,
    textAlign: 'center',
  },
  interactiveGrid: {
    backgroundColor: '#EEF2F6',
  },
  gridMatrixContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  matrixCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    boxShadow: '0px 4px 14px rgba(0, 0, 0, 0.08)',
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    maxWidth: 380,
    width: '100%',
  },
  matrixHeader: {
    marginBottom: 12,
    alignItems: 'center',
  },
  matrixTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  matrixHint: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  grid6x6: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 6,
  },
  gridBox: {
    width: '14.5%',
    aspectRatio: 1,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  gridBoxSelected: {
    borderWidth: 2.5,
    transform: [{ scale: 1.05 }],
  },
  gridBoxLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#334155',
  },
  gridBoxCount: {
    fontSize: 8,
    fontWeight: '600',
    color: '#475569',
    marginTop: 1,
  },
  gridBoxLabelSelected: {
    color: '#7C3AED',
  },
  inspectorCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.04)',
    elevation: 2,
  },
  inspectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  inspectorHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  statusCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  inspectorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  inspectorSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  agencySection: {
    gap: 8,
  },
  agencySectionHeading: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  agencyList: {
    gap: 6,
  },
  agencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  agencyRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  agencyOrgName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
  },
  agencyCountBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  agencyCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7C3AED',
  },
  noAgenciesBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 8,
  },
  noAgenciesText: {
    fontSize: 12,
    color: '#991B1B',
    flex: 1,
    lineHeight: 16,
  },
  myOrgStatusBox: {
    backgroundColor: '#F5F3FF',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    gap: 2,
  },
  myOrgStatusLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7C3AED',
    letterSpacing: 0.5,
  },
  myOrgStatusValue: {
    fontSize: 12,
    color: '#4C1D95',
    fontWeight: '600',
  },
  bottomDrawer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    padding: 14,
    gap: 10,
    boxShadow: '0px -2px 10px rgba(0, 0, 0, 0.08)',
    elevation: 6,
  },
  drawerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  selectedTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  selectedDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stepperLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  stepBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  stepVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    minWidth: 14,
    textAlign: 'center',
  },
  assignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7C3AED',
    paddingVertical: 12,
    borderRadius: 10,
  },
  assignBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  assignBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.75,
  },
});
