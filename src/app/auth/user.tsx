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
  Phone,
  CreditCard,
  User,
  Eye,
  EyeOff,
} from 'lucide-react-native';
import { AuthService } from '@/services/authService';

export default function UserAuthScreen() {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Login state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register state
  const [regAadhaar, setRegAadhaar] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const formatAadhaar = (val: string) => {
    return val.replace(/\D/g, '').slice(0, 12);
  };

  const formatPhone = (val: string) => {
    return val.replace(/\D/g, '').slice(0, 10);
  };

  const handleLogin = async () => {
    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      Alert.alert('Error', 'Please enter your Aadhaar/Phone number and password.');
      return;
    }

    try {
      setLoading(true);
      await AuthService.loginUser(loginIdentifier.trim(), loginPassword);
      router.replace('/user');
    } catch (e: any) {
      Alert.alert('Login Error', e?.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!regAadhaar.trim() || !regPhone.trim() || !regFullName.trim() || !regPassword.trim()) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    if (regAadhaar.length !== 12) {
      Alert.alert('Error', 'Aadhaar number must be 12 digits.');
      return;
    }

    if (regPhone.length !== 10) {
      Alert.alert('Error', 'Phone number must be 10 digits.');
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
      await AuthService.registerUser({
        aadhaarNumber: regAadhaar,
        phoneNumber: regPhone,
        fullName: regFullName.trim(),
        password: regPassword,
      });
      router.replace('/user');
    } catch (e: any) {
      Alert.alert('Registration Error', e?.message || 'Failed to register.');
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
          {/* Header Bar */}
          <View style={styles.topBar}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}>
              <ArrowLeft size={20} color="#0F172A" />
            </Pressable>
            <Text style={styles.topTitle}>User Portal</Text>
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
                Register
              </Text>
            </Pressable>
          </View>

          {tab === 'login' ? (
            /* Login Form */
            <View style={styles.formCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Aadhaar or Phone Number</Text>
                <View style={styles.inputWrapper}>
                  <CreditCard size={18} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter Aadhaar or Phone number"
                    placeholderTextColor="#94A3B8"
                    keyboardType="number-pad"
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
                style={({ pressed }) => [styles.submitBtn, pressed && styles.pressed]}
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
            /* Register Form */
            <View style={styles.formCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <User size={18} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your name"
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
                <Text style={styles.inputLabel}>Phone Number (10 Digits)</Text>
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
                style={({ pressed }) => [styles.submitBtn, pressed && styles.pressed]}
                onPress={handleRegister}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>Register</Text>
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
    color: '#2563EB',
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
  submitBtn: {
    backgroundColor: '#2563EB',
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
