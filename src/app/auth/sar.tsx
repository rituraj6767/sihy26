import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Lock,
  CreditCard,
  User,
  Shield,
  Phone,
  Eye,
  EyeOff,
} from 'lucide-react-native';
import { AuthService } from '@/services/authService';

export default function SARAuthScreen() {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // SAR Login state
  const [loginAadhaar, setLoginAadhaar] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // SAR Register state
  const [regFullName, setRegFullName] = useState('');
  const [regAadhaar, setRegAadhaar] = useState('');
  const [regBadgeId, setRegBadgeId] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regSpecialization, setRegSpecialization] = useState('First Responder');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const specializations = [
    'First Responder',
    'Medical Paramedic',
    'Canine Handler',
    'Drone Specialist',
    'Aquatic / Flood Rescue',
  ];

  const formatAadhaar = (val: string) => {
    return val.replace(/\D/g, '').slice(0, 12);
  };

  const formatPhone = (val: string) => {
    return val.replace(/\D/g, '').slice(0, 10);
  };

  const handleLogin = async () => {
    if (!loginAadhaar.trim() || !loginPassword.trim()) {
      Alert.alert('Error', 'Please enter your Aadhaar / Badge ID and password.');
      return;
    }

    try {
      setLoading(true);
      await AuthService.loginSAR(loginAadhaar.trim(), loginPassword);
      router.replace('/sar');
    } catch (e: any) {
      Alert.alert('Login Error', e?.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!regFullName.trim() || !regAadhaar.trim() || !regPassword.trim()) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    if (regAadhaar.length !== 12) {
      Alert.alert('Error', 'Aadhaar number must be 12 digits.');
      return;
    }

    if (regPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      await AuthService.registerSAR({
        fullName: regFullName.trim(),
        aadhaarNumber: regAadhaar,
        badgeId: regBadgeId.trim() || undefined,
        phoneNumber: regPhone.trim() || undefined,
        specialization: regSpecialization,
        password: regPassword,
      });
      router.replace('/sar');
    } catch (e: any) {
      Alert.alert('Registration Error', e?.message || 'Failed to register SAR operative.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}>
              <ArrowLeft size={20} color="#0F172A" />
            </Pressable>
            <Text style={styles.topTitle}>SAR Team Portal</Text>
          </View>

          {/* Switcher Tabs */}
          <View style={styles.tabContainer}>
            <Pressable
              onPress={() => setTab('login')}
              style={[styles.tabButton, tab === 'login' && styles.tabButtonActive]}>
              <Text style={[styles.tabText, tab === 'login' && styles.tabTextActive]}>Login</Text>
            </Pressable>
            <Pressable
              onPress={() => setTab('register')}
              style={[styles.tabButton, tab === 'register' && styles.tabButtonActive]}>
              <Text style={[styles.tabText, tab === 'register' && styles.tabTextActive]}>
                Join SAR
              </Text>
            </Pressable>
          </View>

          {tab === 'login' ? (
            /* SAR Login Form */
            <View style={styles.formCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Aadhaar or Badge ID</Text>
                <View style={styles.inputWrapper}>
                  <CreditCard size={18} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter Aadhaar or Badge ID"
                    placeholderTextColor="#94A3B8"
                    value={loginAadhaar}
                    onChangeText={setLoginAadhaar}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Lock size={18} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter password"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showPassword}
                    value={loginPassword}
                    onChangeText={setLoginPassword}
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeBtn}>
                    {showPassword ? (
                      <EyeOff size={18} color="#64748B" />
                    ) : (
                      <Eye size={18} color="#64748B" />
                    )}
                  </Pressable>
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [styles.sarSubmitBtn, pressed && styles.pressed]}
                onPress={handleLogin}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>Login</Text>
                )}
              </Pressable>
            </View>
          ) : (
            /* SAR Register Form */
            <View style={styles.formCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <User size={18} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Operative full name"
                    placeholderTextColor="#94A3B8"
                    value={regFullName}
                    onChangeText={setRegFullName}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Aadhaar Number (12 Digits)</Text>
                <View style={styles.inputWrapper}>
                  <CreditCard size={18} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="12-digit Aadhaar number"
                    placeholderTextColor="#94A3B8"
                    keyboardType="number-pad"
                    maxLength={12}
                    value={regAadhaar}
                    onChangeText={(val) => setRegAadhaar(formatAadhaar(val))}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Badge / Unit ID (Optional)</Text>
                <View style={styles.inputWrapper}>
                  <Shield size={18} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. NDRF-094"
                    placeholderTextColor="#94A3B8"
                    value={regBadgeId}
                    onChangeText={setRegBadgeId}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Contact Phone (Optional)</Text>
                <View style={styles.inputWrapper}>
                  <Phone size={18} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="10-digit mobile number"
                    placeholderTextColor="#94A3B8"
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={regPhone}
                    onChangeText={(val) => setRegPhone(formatPhone(val))}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Specialization</Text>
                <View style={styles.specChipsRow}>
                  {specializations.map((spec) => (
                    <Pressable
                      key={spec}
                      style={[
                        styles.specChip,
                        regSpecialization === spec && styles.specChipActive,
                      ]}
                      onPress={() => setRegSpecialization(spec)}>
                      <Text
                        style={[
                          styles.specChipText,
                          regSpecialization === spec && styles.specChipTextActive,
                        ]}>
                        {spec}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Lock size={18} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Create password"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showPassword}
                    value={regPassword}
                    onChangeText={setRegPassword}
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeBtn}>
                    {showPassword ? (
                      <EyeOff size={18} color="#64748B" />
                    ) : (
                      <Eye size={18} color="#64748B" />
                    )}
                  </Pressable>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <View style={styles.inputWrapper}>
                  <Lock size={18} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Confirm password"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showPassword}
                    value={regConfirmPassword}
                    onChangeText={setRegConfirmPassword}
                  />
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [styles.sarSubmitBtn, pressed && styles.pressed]}
                onPress={handleRegister}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>Register SAR Operative</Text>
                )}
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    padding: 20,
    paddingBottom: 40,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    gap: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 6,
    marginBottom: 4,
  },
  backBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  topTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    padding: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 7,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.06)',
    elevation: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#EA580C',
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.03)',
    elevation: 1,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 46,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  eyeBtn: {
    padding: 6,
  },
  specChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  specChipActive: {
    backgroundColor: '#FFEDD5',
    borderColor: '#EA580C',
  },
  specChipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  specChipTextActive: {
    color: '#EA580C',
    fontWeight: '700',
  },
  sarSubmitBtn: {
    backgroundColor: '#EA580C',
    borderRadius: 8,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.8,
  },
});
