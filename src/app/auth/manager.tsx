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
  Building2,
  ArrowLeft,
  Lock,
  Mail,
  Phone,
  MapPin,
  FileBadge,
  User,
  Globe,
  Eye,
  EyeOff,
} from 'lucide-react-native';
import { AuthService } from '@/services/authService';

export default function ManagerAuthScreen() {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Login state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Application state
  const [orgName, setOrgName] = useState('');
  const [representativeName, setRepresentativeName] = useState('');
  const [stateOfOperations, setStateOfOperations] = useState('');
  const [hqAddress, setHqAddress] = useState('');
  const [officialEmail, setOfficialEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [orgType, setOrgType] = useState('Disaster Relief NGO');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const orgTypeOptions = [
    'Disaster Relief NGO',
    'Government Emergency Agency',
    'Volunteer Rescue Force',
    'Private SAR Organization',
  ];

  const handleLogin = async () => {
    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      Alert.alert('Error', 'Please enter your email/Org ID and password.');
      return;
    }

    try {
      setLoading(true);
      await AuthService.loginManager(loginIdentifier.trim(), loginPassword);
      router.replace('/manager');
    } catch (e: any) {
      Alert.alert('Login Error', e?.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterApplication = async () => {
    if (
      !orgName.trim() ||
      !representativeName.trim() ||
      !stateOfOperations.trim() ||
      !hqAddress.trim() ||
      !officialEmail.trim() ||
      !contactPhone.trim() ||
      !password.trim()
    ) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    if (!officialEmail.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      await AuthService.registerManager({
        orgName: orgName.trim(),
        representativeName: representativeName.trim(),
        stateOfOperations: stateOfOperations.trim(),
        hqAddress: hqAddress.trim(),
        officialEmail: officialEmail.trim(),
        contactPhone: contactPhone.trim(),
        orgType,
        registrationNumber: registrationNumber.trim(),
        password,
      });
      router.replace('/manager');
    } catch (e: any) {
      Alert.alert('Submission Error', e?.message || 'Failed to submit application.');
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
            <Text style={styles.topTitle}>Relief Manager Portal</Text>
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
                Register Organization
              </Text>
            </Pressable>
          </View>

          {tab === 'login' ? (
            /* Login Form */
            <View style={styles.formCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Official Email or Org ID</Text>
                <View style={styles.inputWrapper}>
                  <Mail size={18} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter email or Org ID"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={loginIdentifier}
                    onChangeText={setLoginIdentifier}
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
                style={({ pressed }) => [styles.managerSubmitBtn, pressed && styles.pressed]}
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
            /* Organization Application Form */
            <View style={styles.formCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Organization Name</Text>
                <View style={styles.inputWrapper}>
                  <Building2 size={18} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Disaster Relief Org"
                    placeholderTextColor="#94A3B8"
                    value={orgName}
                    onChangeText={setOrgName}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Organization Type</Text>
                <View style={styles.typeSelectorRow}>
                  {orgTypeOptions.map((opt) => (
                    <Pressable
                      key={opt}
                      style={[
                        styles.typeChip,
                        orgType === opt && styles.typeChipActive,
                      ]}
                      onPress={() => setOrgType(opt)}>
                      <Text
                        style={[
                          styles.typeChipText,
                          orgType === opt && styles.typeChipTextActive,
                        ]}>
                        {opt}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Representative Name</Text>
                <View style={styles.inputWrapper}>
                  <User size={18} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Representative or Officer Name"
                    placeholderTextColor="#94A3B8"
                    value={representativeName}
                    onChangeText={setRepresentativeName}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>State / Area of Operations</Text>
                <View style={styles.inputWrapper}>
                  <Globe size={18} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Kerala, Maharashtra"
                    placeholderTextColor="#94A3B8"
                    value={stateOfOperations}
                    onChangeText={setStateOfOperations}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>HQ Address</Text>
                <View style={styles.inputWrapper}>
                  <MapPin size={18} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Headquarters address"
                    placeholderTextColor="#94A3B8"
                    value={hqAddress}
                    onChangeText={setHqAddress}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Contact Phone</Text>
                <View style={styles.inputWrapper}>
                  <Phone size={18} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Phone number"
                    placeholderTextColor="#94A3B8"
                    keyboardType="phone-pad"
                    value={contactPhone}
                    onChangeText={setContactPhone}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Official Email</Text>
                <View style={styles.inputWrapper}>
                  <Mail size={18} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Email address"
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={officialEmail}
                    onChangeText={setOfficialEmail}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Registration / License Number</Text>
                <View style={styles.inputWrapper}>
                  <FileBadge size={18} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="License or Registration number"
                    placeholderTextColor="#94A3B8"
                    value={registrationNumber}
                    onChangeText={setRegistrationNumber}
                  />
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
                    value={password}
                    onChangeText={setPassword}
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
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [styles.managerSubmitBtn, pressed && styles.pressed]}
                onPress={handleRegisterApplication}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>Submit Registration</Text>
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
    color: '#7C3AED',
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
  typeSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  typeChipActive: {
    backgroundColor: '#EDE9FE',
    borderColor: '#7C3AED',
  },
  typeChipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  typeChipTextActive: {
    color: '#7C3AED',
    fontWeight: '700',
  },
  managerSubmitBtn: {
    backgroundColor: '#7C3AED',
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
