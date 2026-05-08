import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import CryptoJS from "crypto-js";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";
import { TUYA_CLIENT_ID, TUYA_CLIENT_SECRET, TUYA_DEVICE_ID } from "@env";
import { COLORS, globalStyles } from "../styles/theme.js";
const BASE_URL = "https://openapi-sg.iotbing.com";

export default function Pump() {
  const [sensorData, setSensorData] = useState({});
  const [deviceData, setDeviceData] = useState([]);
  const [isPumpOn, setIsPumpOn] = useState(false);
  const [manualOverride, setManualOverride] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

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

  const controlPump = async (val) => {
    if (isSending) return;
    setIsSending(true);
    try {
      await tuyaReq("POST", `/v1.0/devices/${TUYA_DEVICE_ID}/commands`, {
        commands: [{ code: "switch_1", value: val }],
      });
      setIsPumpOn(val);
    } catch (err) {
      Alert.alert("Gagal", "Gagal mengontrol pompa.");
    } finally {
      setTimeout(() => setIsSending(false), 2000);
    }
  };

  useEffect(() => {
    tuyaReq("GET", `/v1.0/devices/${TUYA_DEVICE_ID}/status`).then((res) => {
      setDeviceData(res.data.result);
      const sw = res.data.result.find((i) => i.code === "switch_1");
      if (sw) setIsPumpOn(sw.value);
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
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
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
              { backgroundColor: isPumpOn ? COLORS.success : COLORS.textLight },
            ]}
          />
        </View>

        <View style={styles.infoBox}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={COLORS.textSub}
          />
          <Text style={styles.infoText}>
            {isPumpOn
              ? "Pump is currently active. Ensure the water source is sufficient."
              : "Pump is idle. Tap the button below to start irrigation."}
          </Text>
        </View>

        <View style={styles.buttonWrapper}>
          <TouchableOpacity
            disabled={isSending}
            onPress={() => {
              setManualOverride(true);
              controlPump(!isPumpOn);
            }}
            style={[
              globalStyles.buttonMain,
              {
                backgroundColor: isSending
                  ? COLORS.textMuted
                  : isPumpOn
                    ? COLORS.danger
                    : COLORS.success,
              },
            ]}
          >
            <Ionicons
              name={isPumpOn ? "stop-circle-outline" : "play-circle-outline"}
              size={24}
              color={COLORS.white}
            />
            <Text style={globalStyles.buttonText}>
              {isSending
                ? "PROCESSING..."
                : isPumpOn
                  ? "STOP PUMPING"
                  : "START PUMPING"}
            </Text>
          </TouchableOpacity>

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

        <View style={[globalStyles.card, styles.deviceStatusCard]}>
          <TouchableOpacity
            style={styles.deviceStatusHeader}
            onPress={() => setIsExpanded(!isExpanded)}
          >
            <View style={styles.headerLeft}>
              <Ionicons
                name="hardware-chip-outline"
                size={20}
                color={COLORS.textSub}
              />
              <Text style={styles.deviceStatusTitle}>DEVICE STATUS</Text>
            </View>
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color={COLORS.textLight}
            />
          </TouchableOpacity>
          {isExpanded && (
            <View style={styles.expandedContent}>
              {deviceData.map((item, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.statusRow,
                    idx === deviceData.length - 1 && styles.lastRow,
                  ]}
                >
                  <Text style={styles.statusCode}>{item.code}</Text>
                  <Text style={styles.statusValueText}>
                    {String(item.value)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
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
