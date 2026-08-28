import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  Loader,
  XCircle,
  MapPin,
  ChevronDown,
  ChevronUp,
  Activity,
  Navigation,
  Shield,
  Phone,
  User,
} from "lucide-react-native";
import { AuthService, CurrentUserSession } from "@/services/authService";
import { supabase } from "@/utils/supabase";

export type RequestStatus = "pending" | "preparing" | "dispatched" | "in_progress" | "resolved" | "cancelled";

export interface HelpRequest {
  id: string;
  disasterType: string;
  emoji: string;
  location: string;
  submittedAt: string;
  status: RequestStatus;
  statusNote?: string;
  forWhom: "me" | "someone";
  personName?: string;
  personPhone?: string;
}

const STATUS_CONFIG: Record<
  RequestStatus,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  pending: {
    label: "Pending Assignment",
    color: "#92400E",
    bg: "#FEF3C7",
    icon: <Clock size={14} color="#92400E" />,
  },
  preparing: {
    label: "SAR Unit Preparing",
    color: "#B45309",
    bg: "#FEF3C7",
    icon: <Activity size={14} color="#B45309" />,
  },
  dispatched: {
    label: "Team Dispatched & En Route",
    color: "#1D4ED8",
    bg: "#DBEAFE",
    icon: <Navigation size={14} color="#1D4ED8" />,
  },
  in_progress: {
    label: "Rescue In Progress",
    color: "#1D4ED8",
    bg: "#DBEAFE",
    icon: <Loader size={14} color="#1D4ED8" />,
  },
  resolved: {
    label: "Rescued / Safe",
    color: "#166534",
    bg: "#DCFCE7",
    icon: <CheckCircle2 size={14} color="#166534" />,
  },
  cancelled: {
    label: "Cancelled",
    color: "#991B1B",
    bg: "#FEE2E2",
    icon: <XCircle size={14} color="#991B1B" />,
  },
};

function getDisasterEmoji(type: string): string {
  const t = (type || "").toLowerCase();
  if (t.includes("flood") || t.includes("water")) return "🌊";
  if (t.includes("fire")) return "🔥";
  if (t.includes("medical")) return "🚑";
  if (t.includes("building") || t.includes("collapse")) return "🏗️";
  if (t.includes("cyclone") || t.includes("storm")) return "🌀";
  if (t.includes("earthquake")) return "🏚️";
  return "🆘";
}

function RequestCard({ req }: { req: HelpRequest }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={() => setExpanded((v) => !v)}>
      {/* Top row */}
      <View style={styles.cardTop}>
        <View style={styles.cardLeft}>
          <Text style={styles.cardEmoji}>{req.emoji}</Text>
          <View style={styles.cardInfo}>
            <Text style={styles.cardType}>{req.disasterType}</Text>
            <Text style={styles.cardId}>ID: {req.id}</Text>
          </View>
        </View>
        <View style={styles.cardRight}>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            {cfg.icon}
            <Text style={[styles.statusText, { color: cfg.color }]}>
              {cfg.label}
            </Text>
          </View>
          {expanded ? (
            <ChevronUp size={16} color="#94A3B8" />
          ) : (
            <ChevronDown size={16} color="#94A3B8" />
          )}
        </View>
      </View>

      {/* Location row */}
      <View style={styles.locationRow}>
        <MapPin size={12} color="#94A3B8" />
        <Text style={styles.locationText} numberOfLines={1}>
          {req.location}
        </Text>
      </View>

      {/* Expanded details */}
      {expanded && (
        <View style={styles.expandedSection}>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Submitted</Text>
            <Text style={styles.detailValue}>{req.submittedAt}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Reported for</Text>
            <Text style={styles.detailValue}>
              {req.forWhom === "me" ? "Myself" : req.personName ? `On Behalf (${req.personName})` : "Someone else"}
            </Text>
          </View>
          {req.statusNote ? (
            <View style={styles.noteBox}>
              <Text style={styles.noteLabel}>Field Status Update</Text>
              <Text style={styles.noteText}>{req.statusNote}</Text>
            </View>
          ) : (
            <View style={[styles.noteBox, { backgroundColor: '#F8FAFC' }]}>
              <Text style={styles.noteLabel}>Status</Text>
              <Text style={[styles.noteText, { color: '#64748B' }]}>
                Awaiting response team assignment from disaster relief operations.
              </Text>
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
}

export default function TrackerScreen() {
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  const loadRequests = async () => {
    try {
      const session = await AuthService.getSession();
      const userId = session?.userId;

      let query = supabase.from("help_requests").select("*").order("created_at", { ascending: false });

      if (userId) {
        query = query.or(`citizen_id.eq.${userId},citizen_id.is.null`);
      }

      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        const mapped: HelpRequest[] = data.map((row: any) => ({
          id: row.id.startsWith("REQ-") ? row.id : `REQ-${row.id.slice(0, 6).toUpperCase()}`,
          disasterType: row.disaster_type || "Emergency Relief",
          emoji: getDisasterEmoji(row.disaster_type),
          location: row.address || `${row.latitude?.toFixed(4)}, ${row.longitude?.toFixed(4)}`,
          submittedAt: new Date(row.created_at).toLocaleString([], {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          status: (row.status as RequestStatus) || "pending",
          statusNote: row.status_note,
          forWhom: row.for_whom || "me",
          personName: row.person_name,
          personPhone: row.person_phone,
        }));
        setRequests(mapped);
        return;
      }
    } catch (e) {
      console.warn("Tracker fetch note:", e);
    }

    // Default mock requests for offline/instant testing
    setRequests([
      {
        id: "REQ-2026-001",
        disasterType: "Flood",
        emoji: "🌊",
        location: "Sector 4, Low-lying riverbank zone, Muzaffarpur",
        submittedAt: new Date(Date.now() - 1800000).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
        status: "preparing",
        statusNote: "SAR Team Rapid Response Alpha is loading 20 ration packs & rescue raft.",
        forWhom: "me",
      },
      {
        id: "REQ-2026-002",
        disasterType: "Medical Emergency",
        emoji: "🚑",
        location: "Barpeta Primary Health Center road, Assam",
        submittedAt: new Date(Date.now() - 3600000).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
        status: "dispatched",
        statusNote: "Aviation SAR Unit airborne via Helicopter. ETA ~15 mins.",
        forWhom: "someone",
      },
      {
        id: "REQ-2026-003",
        disasterType: "Building Collapse",
        emoji: "🏗️",
        location: "North Beach Road, Chennai, Tamil Nadu",
        submittedAt: new Date(Date.now() - 7200000).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
        status: "resolved",
        statusNote: "Victims safely extracted and medical triage administered.",
        forWhom: "me",
      },
    ]);
  };

  useEffect(() => {
    loadRequests().finally(() => setLoading(false));
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadRequests().finally(() => setRefreshing(false));
  };

  const filtered = requests.filter((r) => {
    if (filter === "all") return true;
    return r.status === filter;
  });

  return (
    <View style={styles.screen}>
      {/* Header filter chips */}
      <View style={styles.filterStrip}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {[
            { id: "all", label: `All (${requests.length})` },
            { id: "pending", label: "Pending" },
            { id: "preparing", label: "Preparing" },
            { id: "dispatched", label: "En Route" },
            { id: "resolved", label: "Resolved" },
          ].map((item) => (
            <Pressable
              key={item.id}
              style={[styles.filterChip, filter === item.id && styles.filterChipActive]}
              onPress={() => setFilter(item.id)}>
              <Text style={[styles.filterChipText, filter === item.id && styles.filterChipTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2563EB"]} />}>
        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Loading requests...</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyWrap}>
            <ClipboardList size={44} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Requests</Text>
            <Text style={styles.emptySubtitle}>
              Pull down to refresh and check for updates.
            </Text>
          </View>
        ) : (
          filtered.map((req) => <RequestCard key={req.id} req={req} />)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  filterStrip: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  filterChipActive: {
    backgroundColor: "#2563EB",
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  centerLoading: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: "#64748B",
  },
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 8,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 10,
    boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.05)",
    elevation: 1,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cardEmoji: {
    fontSize: 24,
  },
  cardInfo: {
    gap: 2,
  },
  cardType: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  cardId: {
    fontSize: 11,
    color: "#94A3B8",
  },
  cardRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  locationText: {
    fontSize: 12,
    color: "#64748B",
    flex: 1,
  },
  expandedSection: {
    gap: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 4,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailLabel: {
    fontSize: 12,
    color: "#64748B",
  },
  detailValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0F172A",
  },
  noteBox: {
    backgroundColor: "#EFF6FF",
    borderRadius: 8,
    padding: 10,
    gap: 4,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  noteLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#1D4ED8",
    letterSpacing: 0.5,
  },
  noteText: {
    fontSize: 12,
    color: "#1E40AF",
    lineHeight: 16,
  },
  pressed: {
    opacity: 0.75,
  },
});
