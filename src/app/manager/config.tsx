import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Users,
  Boxes,
  Plus,
  Minus,
  Edit2,
  Trash2,
  Check,
  X,
  PackagePlus,
  UserPlus,
  Shield,
  Save,
} from 'lucide-react-native';
import { AuthService, CurrentUserSession } from '@/services/authService';
import { ManagerService, TeamData, InventoryItem } from '@/services/managerService';

export default function ConfigScreen() {
  const [session, setSession] = useState<CurrentUserSession | null>(null);
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<'inventory' | 'teams'>('inventory');
  const [loading, setLoading] = useState(true);

  // Modal states
  const [teamModalVisible, setTeamModalVisible] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Partial<TeamData>>({
    name: '',
    size: 5,
    members: [],
  });
  const [newMemberName, setNewMemberName] = useState('');

  const [invModalVisible, setInvModalVisible] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('100');
  const [newItemUnit, setNewItemUnit] = useState('units');

  const loadConfig = async () => {
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
    } catch (e) {
      console.warn('Error loading config:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  // ── Inventory Handlers ───────────────────────────────────────────────────────
  const handleAdjustStock = async (item: InventoryItem, delta: number) => {
    const newQty = Math.max(0, item.quantity + delta);
    setInventory((prev) =>
      prev.map((i) => (i.item_name === item.item_name ? { ...i, quantity: newQty } : i))
    );

    if (session?.userId) {
      await ManagerService.updateInventoryItem(
        session.userId,
        item.item_name,
        newQty,
        item.unit
      );
    }
  };

  const handleAddNewItem = async () => {
    if (!newItemName.trim()) {
      Alert.alert('Item Name', 'Please enter a name for the stock item.');
      return;
    }

    const qty = parseInt(newItemQty) || 0;
    const unit = newItemUnit.trim() || 'units';

    setInventory((prev) => [
      ...prev,
      { item_name: newItemName.trim(), quantity: qty, unit, category: 'General' },
    ]);

    if (session?.userId) {
      await ManagerService.updateInventoryItem(
        session.userId,
        newItemName.trim(),
        qty,
        unit
      );
    }

    setNewItemName('');
    setNewItemQty('100');
    setInvModalVisible(false);
    Alert.alert('Stock Added', `${newItemName} added to inventory.`);
  };

  // ── Team Handlers ───────────────────────────────────────────────────────────
  const handleSaveTeam = async () => {
    if (!editingTeam.name?.trim()) {
      Alert.alert('Team Name', 'Please enter a team name.');
      return;
    }

    const teamToSave: Partial<TeamData> = {
      ...editingTeam,
      name: editingTeam.name.trim(),
      size: (editingTeam.size === 10 ? 10 : 5) as 5 | 10,
      members: editingTeam.members || [],
    };

    if (session?.userId) {
      await ManagerService.saveTeam(session.userId, teamToSave);
    }

    setTeamModalVisible(false);
    loadConfig();
    Alert.alert('Team Saved', `Preset team "${teamToSave.name}" configured.`);
  };

  const handleAddMemberToTeam = () => {
    if (!newMemberName.trim()) return;
    const current = editingTeam.members || [];
    if (current.length >= (editingTeam.size || 5)) {
      Alert.alert('Capacity Reached', `A team of ${editingTeam.size} can only have ${editingTeam.size} roster members.`);
      return;
    }
    setEditingTeam({
      ...editingTeam,
      members: [...current, newMemberName.trim()],
    });
    setNewMemberName('');
  };

  const handleRemoveMember = (index: number) => {
    const current = [...(editingTeam.members || [])];
    current.splice(index, 1);
    setEditingTeam({ ...editingTeam, members: current });
  };

  if (loading) {
    return (
      <View style={styles.centerLoading}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.loadingText}>Loading resources...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tab Switcher */}
      <View style={styles.tabToggleRow}>
        <Pressable
          style={[styles.toggleBtn, activeTab === 'inventory' && styles.toggleBtnActive]}
          onPress={() => setActiveTab('inventory')}>
          <Boxes size={18} color={activeTab === 'inventory' ? '#FFFFFF' : '#475569'} />
          <Text style={[styles.toggleBtnText, activeTab === 'inventory' && styles.toggleBtnTextActive]}>
            Supplies & Stock ({inventory.length})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.toggleBtn, activeTab === 'teams' && styles.toggleBtnActive]}
          onPress={() => setActiveTab('teams')}>
          <Users size={18} color={activeTab === 'teams' ? '#FFFFFF' : '#475569'} />
          <Text style={[styles.toggleBtnText, activeTab === 'teams' && styles.toggleBtnTextActive]}>
            Response Teams ({teams.length})
          </Text>
        </Pressable>
      </View>

      {/* Main Content Area */}
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {/* ── INVENTORY SECTION ───────────────────────────────────────── */}
        {activeTab === 'inventory' && (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionTopHeader}>
              <View>
                <Text style={styles.sectionTitle}>Warehouse Inventory</Text>
                <Text style={styles.sectionDesc}>Updated when teams are dispatched</Text>
              </View>

              <Pressable style={styles.addBtn} onPress={() => setInvModalVisible(true)}>
                <Plus size={16} color="#FFFFFF" />
                <Text style={styles.addBtnText}>Add Item</Text>
              </Pressable>
            </View>

            <View style={styles.cardsList}>
              {inventory.map((item) => (
                <View key={item.item_name} style={styles.invCard}>
                  <View style={styles.invCardLeft}>
                    <Text style={styles.invItemName}>{item.item_name}</Text>
                    <Text style={styles.invCategory}>Category: {item.category || 'Supplies'}</Text>
                  </View>

                  <View style={styles.invControls}>
                    <Pressable
                      style={styles.invStepBtn}
                      onPress={() => handleAdjustStock(item, -25)}>
                      <Minus size={14} color="#0F172A" />
                    </Pressable>
                    <View style={styles.invQtyBadge}>
                      <Text style={styles.invQtyVal}>{item.quantity}</Text>
                      <Text style={styles.invQtyUnit}>{item.unit}</Text>
                    </View>
                    <Pressable
                      style={styles.invStepBtn}
                      onPress={() => handleAdjustStock(item, 25)}>
                      <Plus size={14} color="#0F172A" />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── TEAMS SECTION ───────────────────────────────────────────── */}
        {activeTab === 'teams' && (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionTopHeader}>
              <View>
                <Text style={styles.sectionTitle}>Response Teams</Text>
                <Text style={styles.sectionDesc}>Configured in teams of 5 and 10 members</Text>
              </View>

              <Pressable
                style={styles.addBtn}
                onPress={() => {
                  setEditingTeam({ name: '', size: 5, members: [] });
                  setTeamModalVisible(true);
                }}>
                <UserPlus size={16} color="#FFFFFF" />
                <Text style={styles.addBtnText}>New Team</Text>
              </Pressable>
            </View>

            <View style={styles.cardsList}>
              {teams.map((team) => (
                <View key={team.id} style={styles.teamConfigCard}>
                  <View style={styles.teamConfigTop}>
                    <View style={styles.teamNameWrap}>
                      <Shield size={18} color="#7C3AED" />
                      <Text style={styles.teamConfigName}>{team.name}</Text>
                    </View>

                    <View style={[styles.teamSizeBadge, team.size === 10 ? styles.teamSize10 : styles.teamSize5]}>
                      <Text style={[styles.teamSizeText, team.size === 10 ? styles.teamSize10Text : styles.teamSize5Text]}>
                        Unit of {team.size}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.rosterLabel}>ASSIGNED ROSTER ({team.members?.length || 0}/{team.size}):</Text>
                  <View style={styles.rosterChips}>
                    {team.members?.map((m, idx) => (
                      <View key={idx} style={styles.rosterChip}>
                        <Text style={styles.rosterChipText}>{m}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.teamCardActions}>
                    <Pressable
                      style={styles.editTeamBtn}
                      onPress={() => {
                        setEditingTeam(team);
                        setTeamModalVisible(true);
                      }}>
                      <Edit2 size={13} color="#7C3AED" />
                      <Text style={styles.editTeamBtnText}>Edit Roster</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── ADD / EDIT TEAM MODAL ─────────────────────────────────────── */}
      <Modal visible={teamModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Configure Response Team</Text>
              <Pressable onPress={() => setTeamModalVisible(false)}>
                <X size={20} color="#64748B" />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Team Name</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="e.g. Rapid Water Strike Echo"
                  placeholderTextColor="#94A3B8"
                  value={editingTeam.name}
                  onChangeText={(text) => setEditingTeam({ ...editingTeam, name: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Team Size Preset</Text>
                <View style={styles.sizeChoiceRow}>
                  <Pressable
                    style={[styles.sizeChoiceBtn, editingTeam.size === 5 && styles.sizeChoiceBtnActive]}
                    onPress={() => setEditingTeam({ ...editingTeam, size: 5 })}>
                    <Text style={[styles.sizeChoiceText, editingTeam.size === 5 && styles.sizeChoiceTextActive]}>
                      5 Operatives (Strike Squad)
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[styles.sizeChoiceBtn, editingTeam.size === 10 && styles.sizeChoiceBtnActive]}
                    onPress={() => setEditingTeam({ ...editingTeam, size: 10 })}>
                    <Text style={[styles.sizeChoiceText, editingTeam.size === 10 && styles.sizeChoiceTextActive]}>
                      10 Operatives (Heavy Platoon)
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>
                  Roster Members ({editingTeam.members?.length || 0}/{editingTeam.size || 5})
                </Text>
                <View style={styles.memberAddRow}>
                  <TextInput
                    style={[styles.inputField, { flex: 1 }]}
                    placeholder="Operative Name & Specialization"
                    placeholderTextColor="#94A3B8"
                    value={newMemberName}
                    onChangeText={setNewMemberName}
                  />
                  <Pressable style={styles.memberAddBtn} onPress={handleAddMemberToTeam}>
                    <Plus size={16} color="#FFFFFF" />
                  </Pressable>
                </View>

                <View style={styles.rosterChips}>
                  {editingTeam.members?.map((m, idx) => (
                    <View key={idx} style={styles.editableRosterChip}>
                      <Text style={styles.editableRosterText}>{m}</Text>
                      <Pressable onPress={() => handleRemoveMember(idx)}>
                        <X size={13} color="#DC2626" />
                      </Pressable>
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable style={styles.saveBtn} onPress={handleSaveTeam}>
                <Save size={16} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>Save Team Configuration</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── ADD INVENTORY ITEM MODAL ─────────────────────────────────── */}
      <Modal visible={invModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Relief Stock Item</Text>
              <Pressable onPress={() => setInvModalVisible(false)}>
                <X size={20} color="#64748B" />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Item Name</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="e.g. Water Purification Tablets, High-Energy Biscuits"
                  placeholderTextColor="#94A3B8"
                  value={newItemName}
                  onChangeText={setNewItemName}
                />
              </View>

              <View style={styles.formGroupRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Initial Quantity</Text>
                  <TextInput
                    style={styles.inputField}
                    placeholder="100"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={newItemQty}
                    onChangeText={setNewItemQty}
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Unit (e.g. packs, litres, boxes)</Text>
                  <TextInput
                    style={styles.inputField}
                    placeholder="units"
                    placeholderTextColor="#94A3B8"
                    value={newItemUnit}
                    onChangeText={setNewItemUnit}
                  />
                </View>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <Pressable style={styles.saveBtn} onPress={handleAddNewItem}>
                <PackagePlus size={16} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>Add to Warehouse Inventory</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  tabToggleRow: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  toggleBtnActive: {
    backgroundColor: '#7C3AED',
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  toggleBtnTextActive: {
    color: '#FFFFFF',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionWrap: {
    gap: 14,
  },
  sectionTopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionDesc: {
    fontSize: 12,
    color: '#64748B',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#7C3AED',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardsList: {
    gap: 10,
  },
  invCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  invCardLeft: {
    flex: 1,
    gap: 3,
  },
  invItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  invCategory: {
    fontSize: 11,
    color: '#64748B',
  },
  invControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  invStepBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  invQtyBadge: {
    alignItems: 'center',
    minWidth: 50,
  },
  invQtyVal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  invQtyUnit: {
    fontSize: 10,
    color: '#64748B',
  },
  teamConfigCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  teamConfigTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamNameWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teamConfigName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  teamSizeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  teamSize5: {
    backgroundColor: '#EFF6FF',
  },
  teamSize10: {
    backgroundColor: '#FEF3C7',
  },
  teamSizeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  teamSize5Text: {
    color: '#1D4ED8',
  },
  teamSize10Text: {
    color: '#B45309',
  },
  rosterLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  rosterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  rosterChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rosterChipText: {
    fontSize: 11,
    color: '#334155',
  },
  teamCardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  editTeamBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  editTeamBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7C3AED',
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
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalBody: {
    gap: 12,
  },
  formGroup: {
    gap: 6,
    marginBottom: 12,
  },
  formGroupRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  inputField: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  sizeChoiceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sizeChoiceBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sizeChoiceBtnActive: {
    backgroundColor: '#FAF5FF',
    borderColor: '#7C3AED',
  },
  sizeChoiceText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  sizeChoiceTextActive: {
    color: '#7C3AED',
    fontWeight: '700',
  },
  memberAddRow: {
    flexDirection: 'row',
    gap: 8,
  },
  memberAddBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editableRosterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  editableRosterText: {
    fontSize: 11,
    color: '#334155',
  },
  modalFooter: {
    paddingTop: 8,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7C3AED',
    paddingVertical: 13,
    borderRadius: 10,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
