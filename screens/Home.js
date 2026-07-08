import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { COLORS, globalStyles } from "../styles/theme.js"; // Sesuaikan path import

export default function Home() {
  const [data, setData] = useState({});
  const [customNames, setCustomNames] = useState({});
  const [alertStatus, setAlertStatus] = useState({
    label: "Loading...",
    color: COLORS.textMuted,
  });
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem("esp_names").then((s) => {
        if (s) setCustomNames(JSON.parse(s));
      });
    }, []),
  );

  const loadData = () => {
    onValue(ref(db, "/sensors"), (snap) => {
      const val = snap.val() || {};
      setData(val);
      let isCritical = false,
        isWarning = false;
      Object.values(val).forEach((item) => {
        if (item.moisture < 25) isCritical = true;
        else if (item.moisture < 40) isWarning = true;
      });
      if (isCritical)
        setAlertStatus({
          label: "CRITICAL - NEED WATER",
          color: COLORS.danger,
        });
      else if (isWarning)
        setAlertStatus({ label: "WARNING - SOIL DRY", color: COLORS.warning });
      else setAlertStatus({ label: "SYSTEM NORMAL", color: COLORS.success });
    });
  };

  useEffect(() => {
    loadData();
  }, []);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const formatTime = (ts) =>
    ts
      ? new Date(ts * 1000)
          .toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
          .replace(/\./g, ":")
      : "--:--";
  const getStatusColor = (m) =>
    m < 25 ? COLORS.danger : m < 40 ? COLORS.warning : COLORS.success;

  const vals = Object.values(data);
  const avgMoisture = vals.length
    ? Math.round(vals.reduce((s, i) => s + (i.moisture || 0), 0) / vals.length)
    : 0;
  const avgTemp = vals.length
    ? (
        vals.reduce((s, i) => s + (i.temperature || 0), 0) / vals.length
      ).toFixed(1)
    : 0;

  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      style={globalStyles.container}
    >
      <View style={globalStyles.headerRow}>
        <View>
          <Text style={globalStyles.headerTitle}>IoT Dashboard</Text>
          <Text style={globalStyles.headerSubtitle}>
            Smart Agriculture System
          </Text>
        </View>
        <TouchableOpacity style={styles.profileBtn}>
          <Ionicons
            name="notifications-outline"
            size={24}
            color={COLORS.textMain}
          />
        </TouchableOpacity>
      </View>
      <View style={[globalStyles.card, styles.mainStatusCard]}>
        <View
          style={[
            styles.statusIconBg,
            { backgroundColor: alertStatus.color + "20" },
          ]}
        >
          <Ionicons
            name={
              alertStatus.label.includes("NORMAL")
                ? "checkmark-circle"
                : "alert-circle"
            }
            size={30}
            color={alertStatus.color}
          />
        </View>
        <View style={{ flex: 1, marginLeft: 15 }}>
          <Text style={styles.statusLabel}>SYSTEM STATUS</Text>
          <Text style={[styles.statusValue, { color: alertStatus.color }]}>
            {alertStatus.label}
          </Text>
        </View>
      </View>

      {/* Container Rata-rata 2 Kolom */}
      <View style={styles.statsContainer}>
        <View style={[globalStyles.card, styles.statsBox]}>
          <Text style={styles.avgLabel}>AVG. MOISTURE</Text>
          <Text
            style={[styles.avgValue, { color: getStatusColor(avgMoisture) }]}
          >
            {avgMoisture}%
          </Text>
        </View>

        <View style={[globalStyles.card, styles.statsBox]}>
          <Text style={styles.avgLabel}>AVG. TEMPERATURE</Text>
          <Text
            style={[styles.avgValue, { color: COLORS.accent || "#FF8C00" }]}
          >
            {avgTemp}°C
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Sensor Nodes</Text>
      <View style={styles.grid}>
        {Object.keys(data).map((key) => {
          const item = data[key];
          const color = getStatusColor(item.moisture);
          return (
            <View key={key} style={[globalStyles.card, styles.sensorCard]}>
              <View style={[styles.cardAccent, { backgroundColor: color }]} />
              <View style={styles.cardHeader}>
                <Text style={styles.sensorName} numberOfLines={1}>
                  {/* {customNames[key] || key.toUpperCase()} */}
                  {key.toUpperCase()}
                </Text>
                <Ionicons
                  name="radio-outline"
                  size={14}
                  color={COLORS.success}
                />
              </View>
              <Text style={styles.dataLabel}>Moisture Content</Text>

              {/* 1. Perbaikan: Tag penutup </Text> yang tadi terpotong */}
              <Text style={[styles.moistureValue, { color }]}>
                {item.moisture}%
              </Text>

              {/* 2. Perbaikan: Menghilangkan % karena ini nilai ADC mentah (0-4095) */}
              <Text style={[styles.moistureSubValue, { color: "#888" }]}>
                Raw ADC: {item.raw_moisture}
              </Text>

              <View style={styles.progressContainer}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${item.moisture}%`, backgroundColor: color },
                  ]}
                />
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.tempBox}>
                  <Ionicons
                    name="thermometer-outline"
                    size={12}
                    color={COLORS.accent || "#FF8C00"}
                  />
                  <Text style={styles.tempText}>{item.temperature}°C</Text>
                </View>
                <Text style={styles.timeText}>
                  {formatTime(item.timestamp)}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  profileBtn: { padding: 5 },

  // Styles 2 kolom rata-rata
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statsBox: { width: "48%", padding: 15, marginBottom: 0 },
  avgLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: "700" },
  avgValue: { fontSize: 26, fontWeight: "800", marginTop: 5 },

  mainStatusCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },
  statusIconBg: { padding: 10, borderRadius: 15 },
  statusLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textLight,
    letterSpacing: 1,
  },
  statusValue: { fontSize: 18, fontWeight: "800" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textMain,
    marginBottom: 15,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  sensorCard: {
    width: "48%",
    padding: 15,
    marginBottom: 15,
    overflow: "hidden",
    position: "relative",
  },
  cardAccent: { position: "absolute", top: 0, left: 0, right: 0, height: 4 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sensorName: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textSub,
    flex: 1,
    marginRight: 5,
  },
  dataLabel: { fontSize: 10, color: COLORS.textLight, fontWeight: "600" },
  moistureValue: { fontSize: 24, fontWeight: "800", marginVertical: 2 },
  progressContainer: {
    height: 6,
    backgroundColor: "#F1F2F6",
    borderRadius: 3,
    marginTop: 5,
    marginBottom: 15,
  },
  progressFill: { height: 6, borderRadius: 3 },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tempBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF9F1",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tempText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.accent || "#FF8C00",
    marginLeft: 3,
  },
  timeText: { fontSize: 10, color: COLORS.textLight, fontWeight: "600" },
  moistureSubValue:{
    fontSize: 10,
    fontWeight: "400",
  }
});
