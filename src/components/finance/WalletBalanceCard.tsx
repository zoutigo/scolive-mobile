import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { colors } from "../../theme";
import { useTranslation } from "../../i18n/useTranslation";

const topUpSchema = z.object({
  amount: z.coerce.number().min(1),
});
type TopUpFormValues = z.input<typeof topUpSchema>;

interface Props {
  balance: number;
  submitting: boolean;
  onTopUp: (amount: number) => void;
}

function formatXaf(amount: number): string {
  return new Intl.NumberFormat("fr-CM", {
    style: "currency",
    currency: "XAF",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function WalletBalanceCard({ balance, submitting, onTopUp }: Props) {
  const { t } = useTranslation();
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TopUpFormValues>({
    resolver: zodResolver(topUpSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { amount: "" as unknown as number },
  });

  function submit(values: TopUpFormValues) {
    onTopUp(Number(values.amount));
    reset({ amount: "" as unknown as number });
  }

  return (
    <View style={styles.card} testID="wallet-balance-card">
      <View style={styles.header}>
        <Ionicons name="wallet-outline" size={20} color={colors.primary} />
        <Text style={styles.label}>{t("finSituation.wallet.balance")}</Text>
      </View>
      <Text style={styles.balance}>{formatXaf(balance)}</Text>

      <View style={styles.formRow}>
        <Controller
          control={control}
          name="amount"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.amount && styles.inputError]}
              value={String(value ?? "")}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="numeric"
              placeholder={t("finSituation.wallet.topUpAmount")}
              placeholderTextColor={colors.textSecondary}
              testID="wallet-top-up-input"
            />
          )}
        />
        <TouchableOpacity
          style={[styles.button, submitting && styles.buttonDisabled]}
          disabled={submitting}
          onPress={handleSubmit(submit)}
          testID="wallet-top-up-submit"
        >
          <Text style={styles.buttonText}>
            {t("finSituation.wallet.topUpSubmit")}
          </Text>
        </TouchableOpacity>
      </View>
      {errors.amount ? (
        <Text style={styles.errorText}>
          {t("finSituation.wallet.errors.amount")}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 16,
    gap: 10,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  label: { fontSize: 14, fontWeight: "600", color: colors.textPrimary },
  balance: { fontSize: 22, fontWeight: "700", color: colors.primary },
  formRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  input: {
    flex: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
  },
  inputError: { borderColor: colors.notification },
  button: {
    borderRadius: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontSize: 13, fontWeight: "700", color: colors.surface },
  errorText: { fontSize: 12, color: colors.notification },
});
