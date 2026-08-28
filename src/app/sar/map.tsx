import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import {
  Navigation,
  MapPin,
  Compass,
  Radio,
  User,
  Crosshair,
  Shield,
  Layers,
  ArrowUpRight,
  Activity,
  CheckCircle2,
} from 'lucide-react-native';
import { SarService } from '@/services/sarService';

// Safely import react-native-maps for native platforms
let MapView: any = null;
let Marker: any = null;
let Polyline: any = null;

if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default || Maps;
    Marker = Maps.Marker;
    Polyline = Maps.Polyline;
  } catch (e) {
    console.warn('react-native-maps load note in SAR:', e);
  }
}

export default function SARTacticalMapScreen() {
  const params = useLocalSearchParams<{
    missionId?: string;
    title?: string;
    lat?: string;
    lng?: string;
    requester?: string;
    address?: string;
  }>();

  const targetLat = parseFloat(params.lat || '26.1215');
  const targetLng = parseFloat(params.lng || '85.3912');
  const targetTitle = params.title || 'Flood Distress Beacon';
  const requester = params.requester || 'Rahul Sharma';
  const address = params.address || 'Sector 4, Low-lying riverbank zone';

  const [currentCoord, setCurrentCoord] = useState<{ latitude: number; longitude: number }>({
    latitude: targetLat + 0.035, // default base offset (~3.8 km away)
    longitude: targetLng - 0.025,
  });
  const [distanceKm, setDistanceKm] = useState<number>(3.8);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Auto-detect operative GPS location
  useEffect(() => {
    (async () => {
      try {
        setGpsLoading(true);
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          const userCoord = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };
          setCurrentCoord(userCoord);
          const dist = SarService.calculateDistanceKm(
            userCoord.latitude,
            userCoord.longitude,
            targetLat,
            targetLng
          );
          setDistanceKm(dist);
        } else {
          // fallback calculation
          const dist = SarService.calculateDistanceKm(
            currentCoord.latitude,
            currentCoord.longitude,
            targetLat,
            targetLng
          );
          setDistanceKm(dist);
        }
      } catch {
        const dist = SarService.calculateDistanceKm(
          currentCoord.latitude,
          currentCoord.longitude,
          targetLat,
          targetLng
        );
        setDistanceKm(dist);
      } finally {
        setGpsLoading(false);
      }
    })();
  }, [targetLat, targetLng]);

  return (
    <View style={styles.container}>
      {/* Top Tactical HUD */}
      <View style={styles.hudTop}>
        <View style={styles.hudLeft}>
          <View style={styles.beaconPing} />
          <View>
            <Text style={styles.hudTitle}>RESCUE ROUTE</Text>
            <Text style={styles.hudSub} numberOfLines={1}>{targetTitle}</Text>
          </View>
        </View>

        <View style={styles.distanceBadge}>
          <Navigation size={13} color="#FB923C" />
          <Text style={styles.distanceText}>{distanceKm} km</Text>
        </View>
      </View>

      {/* Map View Area */}
      <View style={styles.mapArea}>
        {Platform.OS !== 'web' && MapView ? (
          <MapView
            style={StyleSheet.absoluteFill}
            initialRegion={{
              latitude: (currentCoord.latitude + targetLat) / 2,
              longitude: (currentCoord.longitude + targetLng) / 2,
              latitudeDelta: Math.abs(currentCoord.latitude - targetLat) * 2.2 + 0.05,
              longitudeDelta: Math.abs(currentCoord.longitude - targetLng) * 2.2 + 0.05,
            }}>
            {Marker && (
              <>
                {/* Operative Marker */}
                <Marker
                  coordinate={currentCoord}
                  title="SAR Base"
                  pinColor="orange"
                />
                {/* Target Citizen SOS Marker */}
                <Marker
                  coordinate={{ latitude: targetLat, longitude: targetLng }}
                  title={requester}
                  description={address}
                  pinColor="red"
                />
              </>
            )}

            {/* Route trajectory */}
            {Polyline && (
              <Polyline
                coordinates={[currentCoord, { latitude: targetLat, longitude: targetLng }]}
                strokeColor="#EA580C"
                strokeWidth={3}
                lineDashPattern={[5, 5]}
              />
            )}
          </MapView>
        ) : (
          /* Web and Canvas Simulation HUD */
          <View style={styles.canvasSimulation}>
            <View style={styles.radarRing1} />
            <View style={styles.radarRing2} />
            <View style={styles.crosshairH} />
            <View style={styles.crosshairV} />

            {/* Simulated Target Beacon */}
            <View style={styles.targetBeaconWrap}>
              <View style={styles.targetPin}>
                <MapPin size={22} color="#EF4444" />
              </View>
              <Text style={styles.targetBeaconLabel}>TARGET: {requester}</Text>
            </View>

            {/* Simulated Operative Position */}
            <View style={styles.operativePinWrap}>
              <View style={styles.operativePin}>
                <Navigation size={18} color="#FB923C" />
              </View>
              <Text style={styles.operativeLabel}>YOU (SAR Unit)</Text>
            </View>
          </View>
        )}
      </View>

      {/* Waypoint Coordinates & Victim Context Card */}
      <View style={styles.bottomSheet}>
        <View style={styles.targetCard}>
          <View style={styles.targetHeader}>
            <View style={styles.targetLeft}>
              <User size={15} color="#EA580C" />
              <Text style={styles.targetName}>{requester}</Text>
            </View>
            <View style={styles.coordTag}>
              <Text style={styles.coordTagText}>
                {targetLat.toFixed(4)}° N, {targetLng.toFixed(4)}° E
              </Text>
            </View>
          </View>

          <Text style={styles.addressText} numberOfLines={2}>
            📍 {address}
          </Text>

          <View style={styles.telemetryGrid}>
            <View style={styles.telemetryItem}>
              <Text style={styles.telemetryLabel}>DISTANCE</Text>
              <Text style={styles.telemetryVal}>{distanceKm} km</Text>
            </View>
            <View style={styles.telemetryItem}>
              <Text style={styles.telemetryLabel}>ESTIMATED TIME</Text>
              <Text style={styles.telemetryVal}>~{Math.ceil(distanceKm * 4)} mins</Text>
            </View>
            <View style={styles.telemetryItem}>
              <Text style={styles.telemetryLabel}>DIRECTION</Text>
              <Text style={styles.telemetryVal}>142° SE</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  hudTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  hudLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  beaconPing: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
  },
  hudTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FB923C',
    letterSpacing: 0.5,
  },
  hudSub: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(234, 88, 12, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EA580C',
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FB923C',
  },
  mapArea: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#020617',
  },
  canvasSimulation: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  radarRing1: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 1,
    borderColor: 'rgba(234, 88, 12, 0.25)',
  },
  radarRing2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: 'rgba(234, 88, 12, 0.4)',
  },
  crosshairH: {
    position: 'absolute',
    width: '80%',
    height: 1,
    backgroundColor: 'rgba(51, 65, 85, 0.6)',
  },
  crosshairV: {
    position: 'absolute',
    height: '80%',
    width: 1,
    backgroundColor: 'rgba(51, 65, 85, 0.6)',
  },
  targetBeaconWrap: {
    position: 'absolute',
    top: '32%',
    right: '25%',
    alignItems: 'center',
    gap: 2,
  },
  targetPin: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    padding: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  targetBeaconLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F87171',
    backgroundColor: '#0F172A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  operativePinWrap: {
    position: 'absolute',
    bottom: '30%',
    left: '25%',
    alignItems: 'center',
    gap: 2,
  },
  operativePin: {
    backgroundColor: 'rgba(234, 88, 12, 0.25)',
    padding: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EA580C',
  },
  operativeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FB923C',
    backgroundColor: '#0F172A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bottomSheet: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  targetCard: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  targetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  targetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  targetName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  coordTag: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  coordTagText: {
    fontSize: 10,
    color: '#94A3B8',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  addressText: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 16,
  },
  telemetryGrid: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingTop: 8,
    justifyContent: 'space-between',
  },
  telemetryItem: {
    alignItems: 'center',
    gap: 2,
  },
  telemetryLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  telemetryVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FB923C',
  },
});
