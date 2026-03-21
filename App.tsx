import { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// ── Thème extrait du web (school-live) ────────────────────────────────────────
const colors = {
  primary:       '#0C5FA8',
  primaryDark:   '#08467D',
  sidebarBg:     '#0B4F86',
  background:    '#F7F1E8',
  surface:       '#FFFDFC',
  textPrimary:   '#1F2933',
  textSecondary: '#5F5A52',
  border:        '#E7D8C8',
  accentTeal:    '#247C72',
  warmAccent:    '#D89B5B',
  warmSurface:   '#FFF8F0',
  warmBorder:    '#E8CCAE',
  warmHighlight: '#F3DFC7',
  notification:  '#DC3545',
  white:         '#FFFFFF',
};

type AuthTab = 'phone' | 'email' | 'sso';

const FEATURES = [
  { icon: '📊', label: 'Suivi des notes en temps réel' },
  { icon: '💬', label: 'Messagerie école-famille' },
  { icon: '📖', label: 'Cahier de vie numérique' },
  { icon: '📅', label: 'Gestion des absences' },
];

// ── Page de connexion ──────────────────────────────────────────────────────────
function LoginScreen({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<AuthTab>('email');
  const [phone, setPhone] = useState('');
  const [pin, setPin]   = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const TABS: { key: AuthTab; label: string }[] = [
    { key: 'phone', label: 'Téléphone' },
    { key: 'email', label: 'Email' },
    { key: 'sso',   label: 'SSO École' },
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={loginStyles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <StatusBar style="dark" />

        {/* Retour */}
        <TouchableOpacity style={loginStyles.backBtn} onPress={onBack}>
          <Text style={loginStyles.backText}>← Retour</Text>
        </TouchableOpacity>

        {/* Titre */}
        <Text style={loginStyles.title}>
          <Text style={loginStyles.titleAccent}>Sco</Text>
          <Text style={loginStyles.titleMain}>live</Text>
        </Text>
        <Text style={loginStyles.subtitle}>Connectez-vous à votre espace</Text>

        {/* Tabs */}
        <View style={loginStyles.tabs}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t.key}
              style={[loginStyles.tab, tab === t.key && loginStyles.tabActive]}
              onPress={() => setTab(t.key)}
              activeOpacity={0.7}
            >
              <Text style={[loginStyles.tabLabel, tab === t.key && loginStyles.tabLabelActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Formulaire Email */}
        {tab === 'email' && (
          <View style={loginStyles.form}>
            <Text style={loginStyles.inputLabel}>Adresse email</Text>
            <TextInput
              style={loginStyles.input}
              placeholder="prenom.nom@gmail.com"
              placeholderTextColor={colors.textSecondary + '88'}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Text style={loginStyles.inputLabel}>Mot de passe</Text>
            <TextInput
              style={loginStyles.input}
              placeholder="••••••••"
              placeholderTextColor={colors.textSecondary + '88'}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <TouchableOpacity>
              <Text style={loginStyles.forgotLink}>Mot de passe oublié ?</Text>
            </TouchableOpacity>
            <TouchableOpacity style={loginStyles.submitBtn} activeOpacity={0.85}>
              <Text style={loginStyles.submitText}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Formulaire Téléphone */}
        {tab === 'phone' && (
          <View style={loginStyles.form}>
            <Text style={loginStyles.inputLabel}>Numéro de téléphone</Text>
            <TextInput
              style={loginStyles.input}
              placeholder="6XXXXXXXX"
              placeholderTextColor={colors.textSecondary + '88'}
              value={phone}
              onChangeText={t => setPhone(t.replace(/\D/g, ''))}
              keyboardType="phone-pad"
            />
            <Text style={loginStyles.inputLabel}>Code PIN (6 chiffres)</Text>
            <TextInput
              style={loginStyles.input}
              placeholder="● ● ● ● ● ●"
              placeholderTextColor={colors.textSecondary + '88'}
              value={pin}
              onChangeText={t => setPin(t.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              secureTextEntry
            />
            <TouchableOpacity>
              <Text style={loginStyles.forgotLink}>PIN perdu ?</Text>
            </TouchableOpacity>
            <TouchableOpacity style={loginStyles.submitBtn} activeOpacity={0.85}>
              <Text style={loginStyles.submitText}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* SSO */}
        {tab === 'sso' && (
          <View style={loginStyles.form}>
            <Text style={loginStyles.ssoHint}>
              Connectez-vous avec le compte fourni par votre école.
            </Text>
            <TouchableOpacity style={loginStyles.ssoBtn} activeOpacity={0.85}>
              <Text style={loginStyles.ssoBtnIcon}>G</Text>
              <Text style={loginStyles.ssoBtnText}>Continuer avec Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[loginStyles.ssoBtn, loginStyles.ssoBtnApple]} activeOpacity={0.85}>
              <Text style={[loginStyles.ssoBtnIcon, loginStyles.ssoBtnIconApple]}>🍎</Text>
              <Text style={[loginStyles.ssoBtnText, loginStyles.ssoBtnTextApple]}>Continuer avec Apple</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={loginStyles.footer}>© 2026 Scolive — Tous droits réservés</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Page d'accueil ─────────────────────────────────────────────────────────────
export default function App() {
  const [showLogin, setShowLogin] = useState(false);

  if (showLogin) return <LoginScreen onBack={() => setShowLogin(false)} />;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          <Text style={styles.titleAccent}>Sco</Text>
          <Text style={styles.titleMain}>live</Text>
        </Text>
        <View style={styles.titleUnderline} />
        <Text style={styles.subtitle}>La vie scolaire, simplifiée.</Text>
      </View>

      {/* Feature cards */}
      <View style={styles.cardsGrid}>
        {FEATURES.map((f, i) => (
          <View key={i} style={styles.card}>
            <Text style={styles.cardIcon}>{f.icon}</Text>
            <Text style={styles.cardLabel}>{f.label}</Text>
          </View>
        ))}
      </View>

      {/* Accent banner */}
      <View style={styles.banner}>
        <View style={styles.bannerAccent} />
        <Text style={styles.bannerText}>
          Connectez école, enseignants et familles en un seul endroit.
        </Text>
      </View>

      {/* CTA */}
      <TouchableOpacity style={styles.button} activeOpacity={0.85} onPress={() => setShowLogin(true)}>
        <Text style={styles.buttonText}>Se connecter</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>© 2026 Scolive — Tous droits réservés</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 40,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 52,
    fontWeight: '900',
    letterSpacing: -1,
    marginBottom: 8,
  },
  titleAccent: {
    color: colors.primary,
  },
  titleMain: {
    color: colors.primaryDark,
  },
  titleUnderline: {
    width: 56,
    height: 4,
    backgroundColor: colors.warmAccent,
    borderRadius: 2,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
  },

  // Cards
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    width: '100%',
    marginBottom: 32,
  },
  card: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    padding: 16,
    gap: 8,
    shadowColor: '#4D3820',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardIcon: {
    fontSize: 24,
  },
  cardLabel: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '500',
    lineHeight: 18,
  },

  // Banner
  banner: {
    width: '100%',
    backgroundColor: colors.warmHighlight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 32,
  },
  bannerAccent: {
    width: 4,
    height: '100%',
    minHeight: 40,
    backgroundColor: colors.warmAccent,
    borderRadius: 2,
  },
  bannerText: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },

  // Button
  button: {
    width: '100%',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  loginLink: {
    fontSize: 14,
    color: colors.primary,
    marginBottom: 32,
  },

  // Footer
  footer: {
    fontSize: 11,
    color: colors.textSecondary,
    opacity: 0.5,
  },
});

// ── Styles page login ──────────────────────────────────────────────────────────
const loginStyles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 40,
  },
  backBtn: {
    marginBottom: 24,
  },
  backText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -1,
    marginBottom: 4,
  },
  titleAccent: {
    color: colors.primary,
  },
  titleMain: {
    color: colors.primaryDark,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 32,
  },

  // Tabs
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
  tabLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },

  // Form
  form: {
    gap: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
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
  submitText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },

  // SSO
  ssoHint: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
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
  ssoBtnIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.warmHighlight,
    textAlign: 'center',
    lineHeight: 28,
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
    overflow: 'hidden',
  },
  ssoBtnIconApple: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    color: colors.white,
  },
  ssoBtnText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  ssoBtnTextApple: {
    color: colors.white,
  },

  footer: {
    fontSize: 11,
    color: colors.textSecondary,
    opacity: 0.4,
    textAlign: 'center',
    marginTop: 40,
  },
});
