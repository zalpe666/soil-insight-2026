import React, { useState, useEffect, useMemo } from "react";
import { ref, onValue, set, push } from "firebase/database";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView, // <--- Tambahkan ini
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import CryptoJS from "crypto-js";
import { db } from "../firebase";
import { TUYA_CLIENT_ID, TUYA_CLIENT_SECRET, TUYA_DEVICE_ID } from "@env";
import { COLORS, globalStyles } from "../styles/theme.js";
import { useNavigation } from "@react-navigation/native";
// import { ref, onValue, set } from "firebase/database";

const BASE_URL = "https://openapi-sg.iotbing.com";

export default function Pump() {
  const [isDeviceOnline, setIsDeviceOnline] = useState(true);
  const [sensorData, setSensorData] = useState({});
  const [deviceData, setDeviceData] = useState([]);
  const [isPumpOn, setIsPumpOn] = useState(false);
  const [manualOverride, setManualOverride] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const navigation = useNavigation();

  const averageMoisture = useMemo(() => {
    const vals = Object.values(sensorData);
    return vals.length
      ? Math.round(
          vals.reduce((sum, item) => sum + (item.moisture || 0), 0) /
            vals.length,
        )
      : 0;
  }, [sensorData]);

  const getTuyaSign = (t, token, method, path, body = "") =>
    CryptoJS.HmacSHA256(
      TUYA_CLIENT_ID +
        token +
        t +
        `${method}\n${CryptoJS.SHA256(body).toString()}\n\n${path}`,
      TUYA_CLIENT_SECRET,
    )
      .toString(CryptoJS.enc.Hex)
      .toUpperCase();

  const tuyaReq = async (method, path, bodyObj = null) => {
    const t = Date.now().toString();
    const tokenRes = await fetch(`${BASE_URL}/v1.0/token?grant_type=1`, {
      method: "GET",
      headers: {
        client_id: TUYA_CLIENT_ID,
        sign: getTuyaSign(t, "", "GET", "/v1.0/token?grant_type=1"),
        t,
        sign_method: "HMAC-SHA256",
      },
    });
    const token = (await tokenRes.json()).result.access_token;
    const t2 = Date.now().toString();
    const bodyStr = bodyObj ? JSON.stringify(bodyObj) : "";
    return axios({
      method,
      url: `${BASE_URL}${path}`,
      data: bodyStr,
      headers: {
        client_id: TUYA_CLIENT_ID,
        access_token: token,
        sign: getTuyaSign(t2, token, method, path, bodyStr),
        t: t2,
        sign_method: "HMAC-SHA256",
        "Content-Type": "application/json",
      },
    });
  };
  const savePumpLog = async (action, success) => {
    try {
      const timestamp = Date.now();

      await push(ref(db, "/pump_logs"), {
        action,
        success,
        source: manualOverride ? "MANUAL" : "AUTO",
        moisture: averageMoisture,
        timestamp,
      });

      console.log("Pump log saved.");
    } catch (err) {
      console.log("Failed save log:", err);
    }
  };
  const controlPump = async (val) => {
    if (isSending) return;
    setIsSending(true);
    try {
      const res = await tuyaReq(
        "POST",
        `/v1.0/devices/${TUYA_DEVICE_ID}/commands`,
        {
          commands: [{ code: "switch_1", value: val }],
        },
      );

      // Cek apakah Tuya mengembalikan respons error logika (misal: Device Offline)
      if (res.data && res.data.success === false) {
        throw new Error(res.data.msg || "Perangkat mungkin offline");
      }

      setIsPumpOn(val);
      setIsDeviceOnline(true);

      // Update status realtime
      await set(ref(db, "/settings/pump_status"), val);

      // Simpan histori pompa
      await savePumpLog(val ? "ON" : "OFF", true);

      if (manualOverride) {
        Alert.alert(
          "Berhasil",
          `Pompa berhasil di${val ? "nyalakan" : "matikan"}.`,
        );
      }
    } catch (err) {
      setIsDeviceOnline(false); // Tandai perangkat offline/bermasalah
      await savePumpLog(val ? "ON" : "OFF", false);
      // Ambil pesan error dari Tuya atau gunakan pesan default
      const errorMsg =
        err.response?.data?.msg ||
        err.message ||
        "Periksa koneksi internet atau status perangkat.";
      Alert.alert("Koneksi Gagal", `Tidak dapat mengontrol pompa: ${errorMsg}`);
    } finally {
      setTimeout(() => setIsSending(false), 2000);
    }
  };

  useEffect(() => {
    tuyaReq("GET", `/v1.0/devices/${TUYA_DEVICE_ID}/status`)
      .then((res) => {
        // Jika request berhasil terkirim tapi Tuya bilang gagal (misal: offline)
        if (res.data && res.data.success === false) {
          setIsDeviceOnline(false);
          Alert.alert(
            "Perhatian",
            `Gagal mengambil status perangkat: ${res.data.msg}`,
          );
          return;
        }

        setIsDeviceOnline(true);
        setDeviceData(res.data.result || []);
        const sw = res.data.result?.find((i) => i.code === "switch_1");
        if (sw) setIsPumpOn(sw.value);
      })
      .catch((err) => {
        setIsDeviceOnline(false);
        Alert.alert(
          "API Error",
          "Tidak dapat terhubung ke Tuya API. Periksa koneksi internet Anda.",
        );
      });

    const unsub = onValue(ref(db, "/sensors"), (snap) =>
      setSensorData(snap.val() || {}),
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    if (manualOverride || averageMoisture === 0) return;
    if (averageMoisture < 30 && !isPumpOn && !isSending) controlPump(true);
    if (averageMoisture >= 32 && isPumpOn && !isSending) controlPump(false);
  }, [averageMoisture, manualOverride, isPumpOn, isSending]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* Tambahkan KeyboardAvoidingView di sini */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled" // Biar tombol tetap bisa dipencet meski keyboard aktif
        >
          <View style={globalStyles.header}>
            <Text style={globalStyles.headerTitle}>Pump Control</Text>
            <Text style={globalStyles.headerSubtitle}>
              Manual Irrigation System
            </Text>
          </View>

          <View style={[globalStyles.card, styles.visualCard]}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: isPumpOn ? "#E3F2FD" : "#F5F5F5" },
              ]}
            >
              <Ionicons
                name={isPumpOn ? "water" : "water-outline"}
                size={80}
                color={isPumpOn ? COLORS.info : COLORS.textLight}
              />
            </View>
            <View style={styles.statusInfo}>
              <Text style={styles.statusLabel}>PUMP STATUS</Text>
              <Text
                style={[
                  styles.statusValue,
                  { color: isPumpOn ? COLORS.success : COLORS.danger },
                ]}
              >
                {isPumpOn ? "RUNNING" : "STANDBY"}
              </Text>
              <Text style={styles.moistureText}>
                AVG Moisture: {averageMoisture}%
              </Text>
            </View>
            <Text
              style={[
                styles.modeLabel,
                { color: manualOverride ? COLORS.accent : COLORS.info },
              ]}
            >
              {manualOverride ? "MANUAL OVERRIDE" : "AUTO MODE"}
            </Text>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: isPumpOn ? COLORS.success : COLORS.textLight,
                },
              ]}
            />
          </View>

          <View
            style={[
              styles.infoBox,
              !isDeviceOnline && { backgroundColor: "#ffeaa7" },
            ]}
          >
            <Ionicons
              name={
                !isDeviceOnline
                  ? "warning-outline"
                  : "information-circle-outline"
              }
              size={20}
              color={!isDeviceOnline ? "#d63031" : COLORS.textSub}
            />
            <Text
              style={[styles.infoText, !isDeviceOnline && { color: "#d63031" }]}
            >
              {!isDeviceOnline
                ? "PERINGATAN: Perangkat sedang Offline atau API bermasalah. Kontrol mungkin tidak merespons."
                : isPumpOn
                  ? "Pump is currently active. Ensure the water source is sufficient."
                  : "Pump is idle. Tap the button below to start irrigation."}
            </Text>
          </View>

          <View style={styles.buttonWrapper}>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                style={[
                  globalStyles.buttonMain,
                  {
                    flex: 1,
                    backgroundColor: isPumpOn ? COLORS.danger : COLORS.success,
                  },
                ]}
                disabled={isSending}
                onPress={() => {
                  setManualOverride(true);
                  controlPump(!isPumpOn);
                }}
              >
                <Text style={globalStyles.buttonText}>
                  {isPumpOn ? "STOP PUMP" : "START PUMP"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: COLORS.info,
                  borderRadius: 15,
                  justifyContent: "center",
                  alignItems: "center",
                }}
                onPress={() => navigation.navigate("PumpMonitoring")}
              >
                <Ionicons name="analytics-outline" color="white" size={24} />
                <Text style={{ color: "white", fontWeight: "700" }}>
                  Monitoring
                </Text>
              </TouchableOpacity>
            </View>

            {manualOverride && (
              <TouchableOpacity
                style={styles.autoModeBtn}
                onPress={() => setManualOverride(false)}
              >
                <Ionicons name="sync-outline" size={18} color={COLORS.white} />
                <Text style={styles.autoModeText}>ENABLE AUTO MODE</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.footerNote}>
              Manual control will override automatic schedules.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  visualCard: { alignItems: "center", padding: 30, position: "relative" },
  iconCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  statusInfo: { alignItems: "center" },
  statusLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textLight,
    letterSpacing: 1.5,
  },
  statusValue: { fontSize: 32, fontWeight: "900", marginTop: 5 },
  moistureText: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.textSub,
    fontWeight: "600",
  },
  modeLabel: { marginTop: 6, fontSize: 12, fontWeight: "700" },
  dot: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#DFE6E9",
    padding: 15,
    borderRadius: 15,
    marginTop: 25,
    alignItems: "center",
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    color: COLORS.textSub,
    lineHeight: 18,
  },
  buttonWrapper: { marginTop: 30, marginBottom: 20 },
  autoModeBtn: {
    marginTop: 12,
    backgroundColor: COLORS.info,
    padding: 14,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  autoModeText: {
    color: COLORS.white,
    fontWeight: "800",
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  footerNote: {
    textAlign: "center",
    color: COLORS.textLight,
    fontSize: 12,
    marginTop: 15,
    fontWeight: "500",
  },
  deviceStatusCard: { padding: 25, marginTop: 15, marginBottom: 10 },
  deviceStatusHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  deviceStatusTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textLight,
    letterSpacing: 1.5,
    marginLeft: 8,
  },
  expandedContent: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#F1F2F6",
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
  },
  lastRow: { borderBottomWidth: 0 },
  statusCode: { color: COLORS.textSub, fontSize: 14, fontWeight: "500" },
  statusValueText: { color: COLORS.textMain, fontSize: 15, fontWeight: "800" },
});
