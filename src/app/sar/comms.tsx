import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import {
  Radio,
  Send,
  Shield,
  Volume2,
  Mic,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Wifi,
} from 'lucide-react-native';

interface CommsLog {
  id: string;
  sender: string;
  channel: string;
  message: string;
  timestamp: string;
  type: 'directive' | 'status' | 'emergency';
}

const INITIAL_LOGS: CommsLog[] = [
  {
    id: 'log-1',
    sender: 'Manager Command (NDRF HQ)',
    channel: 'VHF CH-16',
    message: 'Team Alpha: Proceed to Sector 4 low-lying causeway. 6 stranded citizens identified on rooftop.',
    timestamp: '18:40',
    type: 'directive',
  },
  {
    id: 'log-2',
    sender: 'SAR Unit Alpha (You)',
    channel: 'TAC-1',
    message: 'Status updated to PREPARING: 20 ration packs, 50L clean water, and 6 life buoys secured on raft.',
    timestamp: '18:48',
    type: 'status',
  },
  {
    id: 'log-3',
    sender: 'SAR Unit Alpha (You)',
    channel: 'TAC-1',
    message: 'Status updated to DISPATCHED: Motorized rescue raft deployed via western canal.',
    timestamp: '18:55',
    type: 'status',
  },
];

export default function SARCommsScreen() {
  const [logs, setLogs] = useState<CommsLog[]>(INITIAL_LOGS);
  const [inputMsg, setInputMsg] = useState('');

  const handleSendTransmission = () => {
    if (!inputMsg.trim()) return;

    const newLog: CommsLog = {
      id: `log-${Date.now()}`,
      sender: 'SAR Unit Alpha (You)',
      channel: 'TAC-1',
      message: inputMsg.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'status',
    };

    setLogs([newLog, ...logs]);
    setInputMsg('');
    Alert.alert('Message Sent', 'Field update recorded.');
  };

  const handleQuickRadio = (preset: string) => {
    const newLog: CommsLog = {
      id: `log-${Date.now()}`,
      sender: 'SAR Unit Alpha (You)',
      channel: 'TAC-1',
      message: preset,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: preset.includes('EMERGENCY') ? 'emergency' : 'status',
    };
    setLogs([newLog, ...logs]);
    Alert.alert('Status Logged', preset);
  };

  return (
    <View style={styles.container}>
      {/* Radio Channel Banner */}
      <View style={styles.radioHeader}>
        <View style={styles.channelInfo}>
          <Radio size={16} color="#FB923C" />
          <Text style={styles.channelText}>TACTICAL CHANNEL • 148.550 MHz</Text>
        </View>
        <View style={styles.onlineBadge}>
          <Wifi size={12} color="#4ADE80" />
          <Text style={styles.onlineText}>ACTIVE</Text>
        </View>
      </View>

      {/* Quick Field Updates */}
      <View style={styles.quickChipsWrap}>
        <Text style={styles.quickHeading}>QUICK FIELD UPDATES:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickScroll}>
          <Pressable
            style={styles.quickChip}
            onPress={() => handleQuickRadio('Arrived on target coordinates. Contact established.')}>
            <Text style={styles.quickChipText}>📍 On Target</Text>
          </Pressable>
          <Pressable
            style={styles.quickChip}
            onPress={() => handleQuickRadio('Water currents strong. Navigating auxiliary canal.')}>
            <Text style={styles.quickChipText}>🌊 Strong Current</Text>
          </Pressable>
          <Pressable
            style={[styles.quickChip, { backgroundColor: 'rgba(239, 68, 68, 0.2)', borderColor: '#EF4444' }]}
            onPress={() => handleQuickRadio('URGENT: Requesting Secondary Helicopter Drop for medical supplies.')}>
            <Text style={[styles.quickChipText, { color: '#FCA5A5' }]}>🚨 Request Heli Support</Text>
          </Pressable>
          <Pressable
            style={[styles.quickChip, { backgroundColor: 'rgba(34, 197, 94, 0.2)', borderColor: '#22C55E' }]}
            onPress={() => handleQuickRadio('Extraction successful. All victims onboard rescue boat.')}>
            <Text style={[styles.quickChipText, { color: '#86EFAC' }]}>✅ Extraction Success</Text>
          </Pressable>
        </ScrollView>
      </View>

      {/* Comms Feed */}
      <ScrollView style={styles.feed} contentContainerStyle={styles.feedContent}>
        {logs.map((log) => {
          const isMe = log.sender.includes('(You)');

          return (
            <View
              key={log.id}
              style={[
                styles.logCard,
                isMe ? styles.logCardMe : styles.logCardCommand,
                log.type === 'emergency' && styles.logCardEmergency,
              ]}>
              <View style={styles.logTop}>
                <View style={styles.logSenderWrap}>
                  <Shield size={12} color={isMe ? '#FB923C' : '#38BDF8'} />
                  <Text style={[styles.logSender, isMe ? { color: '#FB923C' } : { color: '#38BDF8' }]}>
                    {log.sender}
                  </Text>
                </View>
                <Text style={styles.logTime}>{log.timestamp}</Text>
              </View>

              <Text style={styles.logMessage}>{log.message}</Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Transmission Input Bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          placeholder="Transmit field report or sitrep..."
          placeholderTextColor="#64748B"
          value={inputMsg}
          onChangeText={setInputMsg}
        />
        <Pressable style={styles.sendBtn} onPress={handleSendTransmission}>
          <Send size={16} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  radioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  channelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  channelText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FB923C',
    letterSpacing: 0.5,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  onlineText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#4ADE80',
  },
  quickChipsWrap: {
    backgroundColor: '#1E293B',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    gap: 6,
  },
  quickHeading: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    paddingHorizontal: 16,
    letterSpacing: 0.5,
  },
  quickScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  quickChip: {
    backgroundColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#475569',
  },
  quickChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  feed: {
    flex: 1,
  },
  feedContent: {
    padding: 16,
    gap: 10,
    paddingBottom: 20,
  },
  logCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  logCardMe: {
    borderColor: 'rgba(234, 88, 12, 0.4)',
    backgroundColor: 'rgba(234, 88, 12, 0.08)',
  },
  logCardCommand: {
    borderColor: 'rgba(56, 189, 248, 0.4)',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  logCardEmergency: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  logTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logSenderWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logSender: {
    fontSize: 11,
    fontWeight: '800',
  },
  logTime: {
    fontSize: 10,
    color: '#64748B',
  },
  logMessage: {
    fontSize: 13,
    color: '#F8FAFC',
    lineHeight: 18,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#334155',
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#EA580C',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
