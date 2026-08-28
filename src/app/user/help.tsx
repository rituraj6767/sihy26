import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as Location from "expo-location";
import {
  MapPin,
  Crosshair,
  User,
  Users,
  CheckCircle,
  AlertCircle,
  Send,
  Check,
  Edit3,
  RefreshCw,
  ArrowRight,
} from "lucide-react-native";
import { AuthService, CurrentUserSession } from "@/services/authService";
import { MapPicker } from "@/components/MapPicker";
import { supabase } from "@/utils/supabase";

type ForWhom = "me" | "someone";
type Step =
  | "choose_whom"
  | "detecting_gps"
  | "confirm_detected_location"
  | "map_picker"
  | "disaster_type"
  | "details"
  | "submitted";

const DISASTER_TYPES = [
  { id: "fire", label: "Fire", emoji: "🔥" },
  { id: "wildfire", label: "Wildfire", emoji: "🌲🔥" },
  { id: "flood", label: "Flood", emoji: "🌊" },
  { id: "earthquake", label: "Earthquake", emoji: "🏚️" },
  { id: "tornado", label: "Tornado", emoji: "🌪️" },
  { id: "landslide", label: "Landslide", emoji: "⛰️" },
  { id: "cyclone", label: "Cyclone / Hurricane", emoji: "🌀" },
  { id: "medical", label: "Medical Emergency", emoji: "🚑" },
  { id: "building_collapse", label: "Building Collapse", emoji: "🏗️" },
  { id: "other", label: "Other Emergency", emoji: "🆘" },
];

const DEFAULT_COORDS = {
  latitude: 28.6139,
  longitude: 77.209,
};

export default function HelpScreen() {
  const [session, setSession] = useState<CurrentUserSession | null>(null);
  const [step, setStep] = useState<Step>("choose_whom");
  const [forWhom, setForWhom] = useState<ForWhom | null>(null);

  // Location state
  const [gpsLoading, setGpsLoading] = useState(false);
  const [selectedCoord, setSelectedCoord] = useState<{
    latitude: number;
    longitude: number;
  }>(DEFAULT_COORDS);
  const [reverseAddress, setReverseAddress] = useState<string>("");
  const [reverseLoading, setReverseLoading] = useState(false);

  // Disaster + details
  const [disasterType, setDisasterType] = useState<string>("");

  // Person details (for someone else)
  const [personName, setPersonName] = useState("");
  const [personPhone, setPersonPhone] = useState("");
  const [personAadhaar, setPersonAadhaar] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    AuthService.getSession().then((s) => setSession(s));
  }, []);

  // ── Reverse geocode whenever coord changes ──────────────────────────────────
  const fetchAddressForCoord = async (coord: { latitude: number; longitude: number }) => {
    setReverseLoading(true);
    try {
      const results = await Location.reverseGeocodeAsync(coord);
      if (results && results.length > 0) {
        const r = results[0];
        const parts = [
          r.name,
          r.street,
          r.district,
          r.city,
          r.region,
          r.postalCode,
          r.country,
        ].filter(Boolean);
        const formatted = parts.length > 0 ? parts.join(", ") : `${coord.latitude.toFixed(5)}, ${coord.longitude.toFixed(5)}`;
        setReverseAddress(formatted);
      } else {
        setReverseAddress(`${coord.latitude.toFixed(5)}, ${coord.longitude.toFixed(5)}`);
      }
    } catch {
      setReverseAddress(`${coord.latitude.toFixed(5)}, ${coord.longitude.toFixed(5)}`);
    } finally {
      setReverseLoading(false);
    }
  };

  // ── Request GPS & Re-detect ──────────────────────────────────────────────────
  const detectGPS = async (isInitialAutoDetect = false) => {
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Location Permission",
          "Location permission was not granted. Please select your location manually on the map."
        );
        setGpsLoading(false);
        if (isInitialAutoDetect) {
          setStep("map_picker");
        }
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coord = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };

      setSelectedCoord(coord);
      await fetchAddressForCoord(coord);

      if (isInitialAutoDetect) {
        setStep("confirm_detected_location");
      }
    } catch {
      Alert.alert("GPS Warning", "Could not get current GPS coordinates. You can select your location on the map.");
      if (isInitialAutoDetect) {
        setStep("map_picker");
      }
    } finally {
      setGpsLoading(false);
    }
  };

  // ── Map coordinate change handler ───────────────────────────────────────────
  const handleMapLocationChange = (coord: { latitude: number; longitude: number }) => {
    setSelectedCoord(coord);
    fetchAddressForCoord(coord);
  };

  // ── Submit Help Request ──────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Determine state from address
      let extractedState = 'India';
      if (reverseAddress) {
        const lower = reverseAddress.toLowerCase();
        for (const st of [
          'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
          'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
          'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
          'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
          'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi'
        ]) {
          if (lower.includes(st.toLowerCase())) {
            extractedState = st;
            break;
          }
        }
      }

      await supabase.from('help_requests').insert({
        citizen_id: session?.userId || null,
        for_whom: forWhom || 'me',
        disaster_type: selectedDisaster?.label || disasterType || 'Emergency',
        latitude: selectedCoord?.latitude || null,
        longitude: selectedCoord?.longitude || null,
        address: reverseAddress || 'Location Shared',
        person_name: forWhom === 'me' ? (session?.name || 'Self') : personName,
        person_phone: forWhom === 'me' ? (session?.identifier || '') : personPhone,
        person_aadhaar: forWhom === 'me' ? (session?.details?.aadhaar || '') : personAadhaar,
        additional_info: additionalInfo || '',
        state: extractedState,
        status: 'pending',
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Help request submission note:', e);
    } finally {
      setSubmitting(false);
      setStep("submitted");
    }
  };

  const selectedDisaster = DISASTER_TYPES.find((d) => d.id === disasterType);

  // ────────────────────────────────────────────────────────────────────────────
  // STEP 1: choose_whom
  // ────────────────────────────────────────────────────────────────────────────
  if (step === "choose_whom") {
    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.screenContent}
        keyboardShouldPersistTaps="handled">
        <View style={styles.stepHeader}>
          <Text style={styles.stepTitle}>Who needs help?</Text>
          <Text style={styles.stepSubtitle}>
            Select whether you are requesting emergency assistance for yourself or on behalf of someone else.
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.whomCard,
            styles.whomCardMe,
            pressed && styles.pressed,
          ]}
          onPress={() => {
            setForWhom("me");
            setStep("detecting_gps");
            detectGPS(true);
          }}>
          <View style={styles.whomIconWrap}>
            <User size={28} color="#2563EB" />
          </View>
          <View style={styles.whomTextWrap}>
            <Text style={styles.whomTitle}>For Me</Text>
            <Text style={styles.whomDesc}>
              I need emergency rescue. My GPS location will be auto-detected and my registered details will be pre-filled.
            </Text>
          </View>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.whomCard,
            styles.whomCardSomeone,
            pressed && styles.pressed,
          ]}
          onPress={() => {
            setForWhom("someone");
            setStep("map_picker");
            fetchAddressForCoord(DEFAULT_COORDS);
          }}>
          <View style={[styles.whomIconWrap, { backgroundColor: "#FFF7ED" }]}>
            <Users size={28} color="#EA580C" />
          </View>
          <View style={styles.whomTextWrap}>
            <Text style={styles.whomTitle}>For Someone Else</Text>
            <Text style={styles.whomDesc}>
              I am reporting an emergency for another person. Location and contact details will be entered manually.
            </Text>
          </View>
        </Pressable>
      </ScrollView>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // STEP 2A: detecting_gps (Loading animation)
  // ────────────────────────────────────────────────────────────────────────────
  if (step === "detecting_gps") {
    return (
      <View style={[styles.screen, styles.screenCentered]}>
        <View style={styles.gpsDetectingCircle}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
        <Text style={styles.stepTitle}>Detecting GPS Location</Text>
        <Text style={styles.stepSubtitleCentered}>
          Finding your exact location for the rescue team...
        </Text>
      </View>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // STEP 2B: confirm_detected_location (For Me)
  // ────────────────────────────────────────────────────────────────────────────
  if (step === "confirm_detected_location") {
    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.screenContent}
        keyboardShouldPersistTaps="handled">
        <View style={styles.stepHeader}>
          <Text style={styles.stepTitle}>Confirm Detected Location</Text>
          <Text style={styles.stepSubtitle}>
            We auto-detected your location. Please check if this address is correct.
          </Text>
        </View>

        {/* Grayed-out Location Box */}
        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>Detected Location</Text>
          <View style={styles.readOnlyLocationBox}>
            <MapPin size={20} color="#DC2626" style={styles.boxIcon} />
            <Text style={styles.readOnlyLocationText}>
              {reverseLoading ? "Updating address..." : reverseAddress || "Location detected"}
            </Text>
          </View>
          <Text style={styles.helperNote}>Automatically populated from high-accuracy GPS</Text>
        </View>

        {/* Actions */}
        <View style={styles.confirmBtnGroup}>
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
            onPress={() => setStep("disaster_type")}>
            <Check size={18} color="#FFFFFF" />
            <Text style={styles.primaryBtnText}>Yes, Location is Right</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
            onPress={() => setStep("map_picker")}>
            <Edit3 size={18} color="#2563EB" />
            <Text style={styles.secondaryBtnText}>No, Adjust on Map</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // STEP 2C: map_picker (Interactive Map Picker)
  // ────────────────────────────────────────────────────────────────────────────
  if (step === "map_picker") {
    return (
      <View style={styles.screen}>
        {/* Interactive Map */}
        <View style={styles.mapContainer}>
          <MapPicker
            latitude={selectedCoord.latitude}
            longitude={selectedCoord.longitude}
            onLocationSelect={handleMapLocationChange}
          />

          {/* Re-detect GPS Button overlay */}
          <Pressable
            style={({ pressed }) => [
              styles.reDetectGpsBtn,
              pressed && styles.pressed,
            ]}
            onPress={() => detectGPS(false)}
            disabled={gpsLoading}>
            {gpsLoading ? (
              <ActivityIndicator size="small" color="#2563EB" />
            ) : (
              <Crosshair size={20} color="#2563EB" />
            )}
          </Pressable>
        </View>

        {/* Bottom Location Panel with Grayed-out Selected Address */}
        <View style={styles.bottomLocationPanel}>
          <View style={styles.panelHeaderRow}>
            <Text style={styles.fieldLabel}>Selected Location (From Map)</Text>
            <Pressable
              style={styles.reDetectTextBtn}
              onPress={() => detectGPS(false)}
              disabled={gpsLoading}>
              <RefreshCw size={12} color="#2563EB" />
              <Text style={styles.reDetectTextLabel}>Re-detect GPS</Text>
            </Pressable>
          </View>

          {/* Grayed-out non-editable text display */}
          <View style={styles.readOnlyLocationBox}>
            <MapPin size={18} color="#DC2626" style={styles.boxIcon} />
            <Text style={styles.readOnlyLocationText} numberOfLines={2}>
              {reverseLoading ? "Updating location..." : reverseAddress || "Tap or drag marker on the map"}
            </Text>
          </View>

          <Text style={styles.mapHintText}>
            Tap anywhere on the map or drag the pin to set the exact point.
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.primaryBtn,
              (!selectedCoord || reverseLoading) && styles.primaryBtnDisabled,
              pressed && styles.pressed,
            ]}
            onPress={() => setStep("disaster_type")}
            disabled={!selectedCoord || reverseLoading}>
            <Text style={styles.primaryBtnText}>Confirm Location →</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // STEP 3: disaster_type
  // ────────────────────────────────────────────────────────────────────────────
  if (step === "disaster_type") {
    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.screenContent}
        keyboardShouldPersistTaps="handled">
        <View style={styles.stepHeader}>
          <Text style={styles.stepTitle}>Select Disaster Type</Text>
          <Text style={styles.stepSubtitle}>
            What type of emergency situation are you facing?
          </Text>
        </View>

        {/* Location Preview Chip */}
        <Pressable
          style={styles.locationChip}
          onPress={() => setStep("map_picker")}>
          <MapPin size={14} color="#DC2626" />
          <Text style={styles.locationChipText} numberOfLines={1}>
            {reverseAddress || "Location set"}
          </Text>
          <Text style={styles.locationChipEdit}>Change</Text>
        </Pressable>

        {/* Disaster Type Grid */}
        <View style={styles.disasterGrid}>
          {DISASTER_TYPES.map((d) => (
            <Pressable
              key={d.id}
              style={({ pressed }) => [
                styles.disasterCard,
                disasterType === d.id && styles.disasterCardSelected,
                pressed && styles.pressed,
              ]}
              onPress={() => setDisasterType(d.id)}>
              <Text style={styles.disasterEmoji}>{d.emoji}</Text>
              <Text
                style={[
                  styles.disasterLabel,
                  disasterType === d.id && styles.disasterLabelSelected,
                ]}>
                {d.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.primaryBtn,
            !disasterType && styles.primaryBtnDisabled,
            pressed && disasterType && styles.pressed,
          ]}
          onPress={() => disasterType && setStep("details")}
          disabled={!disasterType}>
          <Text style={styles.primaryBtnText}>
            {disasterType ? `Proceed with ${selectedDisaster?.label} →` : "Select an emergency type"}
          </Text>
        </Pressable>
      </ScrollView>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // STEP 4: details (Greyed-out for Me / Editable for Someone Else)
  // ────────────────────────────────────────────────────────────────────────────
  if (step === "details") {
    const isMe = forWhom === "me";

    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.screenContent}
        keyboardShouldPersistTaps="handled">
        <View style={styles.stepHeader}>
          <Text style={styles.stepTitle}>
            {isMe ? "Your Details (Auto-filled)" : "Affected Person Details"}
          </Text>
          <Text style={styles.stepSubtitle}>
            {isMe
              ? "Your details are pre-filled from your registered citizen account."
              : "Please enter the information of the person who needs rescue."}
          </Text>
        </View>

        {/* Summary Chips */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryChip}>
            <MapPin size={12} color="#DC2626" />
            <Text style={styles.summaryChipText} numberOfLines={1}>
              {reverseAddress || "Location set"}
            </Text>
          </View>
          <View style={styles.summaryChip}>
            <Text style={styles.summaryChipText}>
              {selectedDisaster?.emoji} {selectedDisaster?.label}
            </Text>
          </View>
        </View>

        {/* Full Name */}
        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>Full Name</Text>
          <TextInput
            style={[
              styles.fieldInput,
              isMe && styles.fieldInputDisabled,
            ]}
            value={isMe ? (session?.name || "Registered Citizen") : personName}
            onChangeText={isMe ? undefined : setPersonName}
            editable={!isMe}
            placeholder={isMe ? "" : "Enter full name"}
            placeholderTextColor="#94A3B8"
          />
          {isMe && <Text style={styles.autofillNote}>✓ Pre-filled from your verified account</Text>}
        </View>

        {/* Phone Number */}
        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>Phone Number</Text>
          <TextInput
            style={[
              styles.fieldInput,
              isMe && styles.fieldInputDisabled,
            ]}
            value={isMe ? (session?.identifier || "") : personPhone}
            onChangeText={isMe ? undefined : setPersonPhone}
            editable={!isMe}
            placeholder={isMe ? "" : "Enter phone number"}
            placeholderTextColor="#94A3B8"
            keyboardType="phone-pad"
          />
          {isMe && <Text style={styles.autofillNote}>✓ Pre-filled from your verified account</Text>}
        </View>

        {/* Aadhaar Number */}
        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>Aadhaar Number</Text>
          <TextInput
            style={[
              styles.fieldInput,
              isMe && styles.fieldInputDisabled,
            ]}
            value={isMe ? (session?.details?.aadhaar || session?.identifier || "Verified") : personAadhaar}
            onChangeText={isMe ? undefined : setPersonAadhaar}
            editable={!isMe}
            placeholder={isMe ? "" : "Enter 12-digit Aadhaar number"}
            placeholderTextColor="#94A3B8"
            keyboardType="number-pad"
            maxLength={12}
          />
          {isMe && <Text style={styles.autofillNote}>✓ Pre-filled from your verified account</Text>}
        </View>

        {/* Additional Emergency Notes */}
        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>Additional Notes / Situation (Optional)</Text>
          <TextInput
            style={[styles.fieldInput, styles.fieldInputMultiline]}
            value={additionalInfo}
            onChangeText={setAdditionalInfo}
            placeholder="E.g. Trapped on 2nd floor, elderly persons present, medical assistance needed..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Submit Button */}
        <Pressable
          style={({ pressed }) => [
            styles.submitBtn,
            submitting && styles.primaryBtnDisabled,
            pressed && !submitting && styles.pressed,
          ]}
          onPress={handleSubmit}
          disabled={submitting}>
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Send size={18} color="#FFFFFF" />
              <Text style={styles.submitBtnText}>Submit Emergency Request</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // STEP 5: submitted (Success screen)
  // ───────────────────────────────────────────────────────────────────────────
  if (step === "submitted") {
    return (
      <View style={[styles.screen, styles.screenCentered]}>
        <View style={styles.successCircle}>
          <CheckCircle size={52} color="#16A34A" />
        </View>
        <Text style={styles.successTitle}>Help Request Dispatched!</Text>
        <Text style={styles.successSubtitle}>
          Your distress signal and GPS location have been broadcast to nearby SAR and Disaster Relief teams.
        </Text>
        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
          onPress={() => {
            setStep("choose_whom");
            setForWhom(null);
            setSelectedCoord(DEFAULT_COORDS);
            setReverseAddress("");
            setDisasterType("");
            setPersonName("");
            setPersonPhone("");
            setPersonAadhaar("");
            setAdditionalInfo("");
          }}>
          <Text style={styles.primaryBtnText}>Submit Another Request</Text>
        </Pressable>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  screenContent: {
    padding: 20,
    paddingBottom: 40,
  },
  screenCentered: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },

  // ── Headers ─────────────────────────────────────────────────────────────────
  stepHeader: {
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 6,
  },
  stepSubtitle: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
  },
  stepSubtitleCentered: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginTop: 8,
    maxWidth: 280,
  },

  // ── Whom Cards ──────────────────────────────────────────────────────────────
  whomCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1.5,
    gap: 14,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  whomCardMe: {
    borderColor: "#BFDBFE",
  },
  whomCardSomeone: {
    borderColor: "#FED7AA",
  },
  whomIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  whomTextWrap: {
    flex: 1,
  },
  whomTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  whomDesc: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 18,
  },

  // ── GPS Detecting Circle ────────────────────────────────────────────────────
  gpsDetectingCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  // ── Map Layout ──────────────────────────────────────────────────────────────
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  reDetectGpsBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    zIndex: 10,
  },
  bottomLocationPanel: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    padding: 16,
    paddingBottom: 24,
    gap: 8,
  },
  panelHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reDetectTextBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  reDetectTextLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2563EB",
  },
  mapHintText: {
    fontSize: 11,
    color: "#94A3B8",
    textAlign: "center",
    marginVertical: 2,
  },

  // ── Read-Only Greyed-out Location Box ───────────────────────────────────────
  readOnlyLocationBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  boxIcon: {
    marginRight: 8,
    flexShrink: 0,
  },
  readOnlyLocationText: {
    flex: 1,
    fontSize: 14,
    color: "#334155",
    fontWeight: "600",
  },
  helperNote: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 4,
  },

  // ── Confirm Button Group ────────────────────────────────────────────────────
  confirmBtnGroup: {
    gap: 12,
    marginTop: 16,
  },
  secondaryBtn: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1.5,
    borderColor: "#BFDBFE",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  secondaryBtnText: {
    color: "#2563EB",
    fontSize: 15,
    fontWeight: "700",
  },

  // ── Location Chip ───────────────────────────────────────────────────────────
  locationChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  locationChipText: {
    flex: 1,
    fontSize: 13,
    color: "#DC2626",
    fontWeight: "600",
  },
  locationChipEdit: {
    fontSize: 12,
    color: "#2563EB",
    fontWeight: "700",
  },

  // ── Disaster Grid ───────────────────────────────────────────────────────────
  disasterGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  disasterCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    alignItems: "center",
    gap: 6,
  },
  disasterCardSelected: {
    borderColor: "#2563EB",
    backgroundColor: "#EFF6FF",
  },
  disasterEmoji: {
    fontSize: 28,
  },
  disasterLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
    textAlign: "center",
  },
  disasterLabelSelected: {
    color: "#2563EB",
    fontWeight: "700",
  },

  // ── Form & Details ──────────────────────────────────────────────────────────
  summaryRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  summaryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    maxWidth: "100%",
  },
  summaryChipText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "600",
    flexShrink: 1,
  },
  fieldWrap: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fieldInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#0F172A",
  },
  fieldInputDisabled: {
    backgroundColor: "#F1F5F9",
    borderColor: "#CBD5E1",
    color: "#64748B",
  },
  fieldInputMultiline: {
    minHeight: 76,
    textAlignVertical: "top",
  },
  autofillNote: {
    fontSize: 11,
    color: "#16A34A",
    marginTop: 4,
    fontWeight: "500",
  },

  // ── Buttons ─────────────────────────────────────────────────────────────────
  primaryBtn: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  primaryBtnDisabled: {
    backgroundColor: "#CBD5E1",
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  submitBtn: {
    backgroundColor: "#DC2626",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  // ── Success ─────────────────────────────────────────────────────────────────
  successCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 8,
    textAlign: "center",
  },
  successSubtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 28,
  },
  pressed: {
    opacity: 0.7,
  },
});
