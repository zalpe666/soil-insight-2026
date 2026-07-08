import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, globalStyles } from "../styles/theme.js";

// Definisikan batas toleransi waktu (4200 detik = 1 jam 10 menit)
const ONLINE_THRESHOLD_SECONDS = 4200;

// Fungsi format untuk mengubah detik menjadi teks yang rapi di UI
const formatInterval = (seconds) => {
  if (seconds >= 3600) {
    const hours = Math.floor(seconds / 3600);
    return `${hours}h`;
  }
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m`;
};

export default function DeviceHealth() {
  const [data, setData] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsub = onValue(ref(db, "/sensors"), (snap) =>
      setData(snap.val() || {}),
    );
    return () => unsub();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    onValue(
      ref(db, "/sensors"),
      (snap) => {
        setData(snap.val() || {});
        setRefreshing(false);
      },
      { onlyOnce: true },
    );
  };

  const formatTime = (ts) =>
    ts
      ? new Date(ts * 1000).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Never";

  const isOnline = (timestamp) =>
    Math.floor(Date.now() / 1000) - timestamp < ONLINE_THRESHOLD_SECONDS;

  const getSignalInfo = (rssi, online) => {
    if (!online)
      return {
        label: "OFFLINE",
        color: COLORS.danger,
        icon: "cloud-offline-outline",
      };
    if (!rssi)
      return { label: "N/A", color: COLORS.textMuted, icon: "wifi-outline" };
    if (rssi > -50)
      return { label: "Excellent", color: COLORS.success, icon: "wifi" };
    if (rssi > -70) return { label: "Good", color: COLORS.info, icon: "wifi" };
    if (rssi > -85)
      return { label: "Fair", color: COLORS.warning, icon: "wifi" };
    return { label: "Poor", color: COLORS.danger, icon: "wifi-outline" };
  };

  return (
    <ScrollView
      style={globalStyles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[COLORS.textMain]}
        />
      }
    >
      <View style={globalStyles.header}>
        <Text style={globalStyles.headerTitle}>System Health</Text>
        <Text style={globalStyles.headerSubtitle}>
          Hardware & Network Status
        </Text>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Total Nodes</Text>
          <Text style={styles.summaryValue}>{Object.keys(data).length}</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Active</Text>
          <Text style={[styles.summaryValue, { color: COLORS.success }]}>
            {Object.values(data).filter((i) => isOnline(i.timestamp)).length}
          </Text>
        </View>
      </View>

      {Object.keys(data).map((key) => {
        const item = data[key];
        const online = isOnline(item.timestamp);
        const signal = getSignalInfo(item.rssi, online);

        return (
          <View key={key} style={globalStyles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.nameSection}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: online ? COLORS.success : COLORS.danger,
                    },
                  ]}
                />
                <Text style={styles.deviceName}>{key.toUpperCase()}</Text>
              </View>
              <Text
                style={[
                  styles.statusBadge,
                  { color: online ? COLORS.success : COLORS.danger },
                ]}
              >
                {online ? "ONLINE" : "OFFLINE"}
              </Text>
            </View>

            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Ionicons name={signal.icon} size={16} color={signal.color} />
                <View style={styles.detailTextGroup}>
                  <Text style={styles.detailLabel}>SIGNAL</Text>
                  <Text style={[styles.detailValue, { color: signal.color }]}>
                    {item.rssi ? `${item.rssi} dBm` : "N/A"} ({signal.label})
                  </Text>
                </View>
              </View>
              <View style={styles.detailItem}>
                <Ionicons
                  name="sync-outline"
                  size={16}
                  color={COLORS.textMuted}
                />
                <View style={styles.detailTextGroup}>
                  <Text style={styles.detailLabel}>LAST SYNC</Text>
                  <Text style={styles.detailValue}>
                    {formatTime(item.timestamp)}
                  </Text>
                </View>
              </View>
              <View style={styles.detailItem}>
                <Ionicons
                  name={
                    online ? "battery-charging-outline" : "battery-dead-outline"
                  }
                  size={16}
                  color={online ? COLORS.textMuted : COLORS.danger}
                />
                <View style={styles.detailTextGroup}>
                  <Text style={styles.detailLabel}>POWER</Text>
                  <Text
                    style={[
                      styles.detailValue,
                      !online && { color: COLORS.danger },
                    ]}
                  >
                    {online ? "USB 5V" : "None"}
                  </Text>
                </View>
              </View>
              <View style={styles.detailItem}>
                <Ionicons
                  name="pulse-outline"
                  size={16}
                  color={COLORS.textMuted}
                />
                <View style={styles.detailTextGroup}>
                  <Text style={styles.detailLabel}>INTERVAL</Text>
                  <Text style={styles.detailValue}>
                    {formatInterval(ONLINE_THRESHOLD_SECONDS)}
                  </Text>
                </View>
              </View>
            </View>
            {!online && (
              <View style={styles.alertBox}>
                <Ionicons
                  name="warning-outline"
                  size={14}
                  color={COLORS.danger}
                />
                <Text style={styles.alertText}>
                  Check device power and WiFi connection.
                </Text>
              </View>
            )}
          </View>
        );
      })}

      <TouchableOpacity
        style={[globalStyles.buttonMain, { marginVertical: 20 }]}
      >
        <Text style={globalStyles.buttonText}>PING ALL DEVICES</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  summaryBox: {
    backgroundColor: COLORS.white,
    width: "48%",
    padding: 15,
    borderRadius: 16,
    elevation: 2,
  },
  summaryLabel: { fontSize: 12, color: COLORS.textLight, fontWeight: "700" },
  summaryValue: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.textMain,
    marginTop: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  nameSection: { flexDirection: "row", alignItems: "center" },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  deviceName: { fontSize: 16, fontWeight: "800", color: COLORS.textMain },
  statusBadge: { fontSize: 11, fontWeight: "800" },
  detailsGrid: { flexDirection: "row", flexWrap: "wrap", marginVertical: 5 },
  detailItem: {
    width: "50%",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  detailTextGroup: { marginLeft: 10 },
  detailLabel: {
    fontSize: 9,
    color: COLORS.textLight,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  detailValue: { fontSize: 13, fontWeight: "700", color: COLORS.textMain },
  alertBox: {
    flexDirection: "row",
    backgroundColor: "#FDEDEC",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  alertText: {
    fontSize: 11,
    color: COLORS.danger,
    marginLeft: 8,
    fontWeight: "600",
  },
});
