import { useState } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { colors } from '../src/theme';

type AuthTab = 'phone' | 'email' | 'sso';

const TABS: { key: AuthTab; label: string }[] = [
  { key: 'phone', label: 'Téléphone' },
  { key: 'email', label: 'Email' },
  { key: 'sso',   label: 'SSO École' },
];

export default function LoginScreen() {
  const [tab, setTab]           = useState<AuthTab>('phone');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone]       = useState('');
  const [pin, setPin]           = useState('');

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>
          <Text style={styles.titleAccent}>Sco</Text>
          <Text style={styles.titleMain}>live</Text>
        </Text>
        <View style={styles.topBarSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.subtitle}>Connectez-vous à votre espace</Text>

        {/* Onglets */}
        <View style={styles.tabs}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, tab === t.key && styles.tabActive]}
              onPress={() => setTab(t.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Téléphone */}
        {tab === 'phone' && (
          <View style={styles.form}>
            <Text style={styles.inputLabel}>Numéro de téléphone</Text>
            <TextInput
              style={styles.input}
              placeholder="6XXXXXXXX"
              placeholderTextColor={colors.textSecondary + '88'}
              value={phone}
              onChangeText={t => setPhone(t.replace(/\D/g, ''))}
              keyboardType="phone-pad"
            />
            <Text style={styles.inputLabel}>Code PIN (6 chiffres)</Text>
            <TextInput
              style={styles.input}
              placeholder="● ● ● ● ● ●"
              placeholderTextColor={colors.textSecondary + '88'}
              value={pin}
              onChangeText={t => setPin(t.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              secureTextEntry
            />
            <TouchableOpacity>
              <Text style={styles.forgotLink}>PIN perdu ?</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} activeOpacity={0.85}>
              <Text style={styles.submitText}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Email */}
        {tab === 'email' && (
          <View style={styles.form}>
            <Text style={styles.inputLabel}>Adresse email</Text>
            <TextInput
              style={styles.input}
              placeholder="prenom.nom@gmail.com"
              placeholderTextColor={colors.textSecondary + '88'}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Text style={styles.inputLabel}>Mot de passe</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={colors.textSecondary + '88'}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <TouchableOpacity>
              <Text style={styles.forgotLink}>Mot de passe oublié ?</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} activeOpacity={0.85}>
              <Text style={styles.submitText}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* SSO */}
        {tab === 'sso' && (
          <View style={styles.form}>
            <Text style={styles.ssoHint}>
              Connectez-vous avec le compte fourni par votre école.
            </Text>
            <TouchableOpacity style={styles.ssoBtn} activeOpacity={0.85}>
              <View style={styles.ssoIconCircle}>
                <Text style={styles.ssoIconText}>G</Text>
              </View>
              <Text style={styles.ssoBtnText}>Continuer avec Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.ssoBtn, styles.ssoBtnApple]} activeOpacity={0.85}>
              <View style={[styles.ssoIconCircle, styles.ssoIconCircleApple]}>
                <Text style={[styles.ssoIconText, styles.ssoIconTextApple]}>⌘</Text>
              </View>
              <Text style={[styles.ssoBtnText, styles.ssoBtnTextApple]}>Continuer avec Apple</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Fixed footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2026 Scolive — Tous droits réservés</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 52 : 16,
    paddingBottom: 12,
    backgroundColor: colors.background,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.warmHighlight,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { fontSize: 18, color: colors.primary, fontWeight: '700', lineHeight: 20 },
  topBarTitle: { flex: 1, textAlign: 'center', fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  titleAccent: { color: colors.primary },
  titleMain:   { color: colors.primaryDark },
  topBarSpacer: { width: 36 },

  container: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.warmHighlight,
    borderRadius: 10,
    padding: 4,
    marginBottom: 28,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: colors.surface,
    shadowColor: '#4D3820',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabLabel:       { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  tabLabelActive: { color: colors.primary, fontWeight: '700' },
  form:           { gap: 12 },
  inputLabel:     { fontSize: 13, fontWeight: '600', color: colors.textPrimary, marginBottom: 2 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.warmBorder,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  forgotLink: {
    fontSize: 13,
    color: colors.primary,
    textAlign: 'right',
    marginBottom: 8,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    marginTop: 4,
  },
  submitText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  ssoHint: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 20,
  },
  ssoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.warmBorder,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 12,
  },
  ssoBtnApple: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary,
  },
  ssoIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.warmHighlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ssoIconCircleApple: { backgroundColor: 'rgba(255,255,255,0.15)' },
  ssoIconText: { fontSize: 14, fontWeight: '800', color: colors.primary },
  ssoIconTextApple: { color: colors.white },
  ssoBtnText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  ssoBtnTextApple: { color: colors.white },
  footer: {
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.warmBorder,
  },
  footerText: {
    fontSize: 11,
    color: colors.textSecondary,
    opacity: 0.5,
  },
});
