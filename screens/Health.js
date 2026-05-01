import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";
import { Ionicons } from "@expo/vector-icons";
import { RefreshControl } from "react-native";

export default function DeviceHealth() {
  const [data, setData] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  useEffect(() => {
    const r = ref(db, "/sensors");
    const unsub = onValue(r, (snap) => {
      setData(snap.val() || {});
    });
    return () => unsub();
  }, []);
  const onRefresh = () => {
    setRefreshing(true);

    const r = ref(db, "/sensors");
    onValue(
      r,
      (snap) => {
        setData(snap.val() || {});
        setRefreshing(false);
      },
      { onlyOnce: true },
    );
  };
  const formatTime = (ts) => {
    if (!ts) return "Never";
    const date = new Date(ts * 1000);
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const DEVICE_INTERVAL = 2 * 60; // 30 menit dalam detik

  const isOnline = (timestamp) => {
    const now = Math.floor(Date.now() / 1000);
    return now - timestamp < DEVICE_INTERVAL * 1.5;
  };

  // 🔥 FUNGSI BARU: Menentukan kualitas sinyal berdasarkan angka RSSI
  const getSignalInfo = (rssi, isOnline) => {
    if (!isOnline) {
      return {
        label: "OFFLINE",
        color: "#E74C3C",
        icon: "cloud-offline-outline",
      };
    }

    if (!rssi || rssi === 0)
      return { label: "N/A", color: "#95A5A6", icon: "wifi-outline" };

    if (rssi > -50)
      return { label: "Excellent", color: "#2ECC71", icon: "wifi" };

    if (rssi > -70) return { label: "Good", color: "#3498DB", icon: "wifi" };

    if (rssi > -85) return { label: "Fair", color: "#F1C40F", icon: "wifi" };

    return { label: "Poor", color: "#E74C3C", icon: "wifi-outline" };
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#2D3436"]}
          tintColor="#2D3436"
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>System Health</Text>
        <Text style={styles.headerSubtitle}>Hardware & Network Status</Text>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Total Nodes</Text>
          <Text style={styles.summaryValue}>{Object.keys(data).length}</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Active</Text>
          <Text style={[styles.summaryValue, { color: "#2ECC71" }]}>
            {Object.values(data).filter((i) => isOnline(i.timestamp)).length}
          </Text>
        </View>
      </View>

      {Object.keys(data).map((key) => {
        const item = data[key];
        const online = isOnline(item.timestamp);

        // 🔥 Ambil info sinyal dari data Firebase
        const signal = getSignalInfo(item.rssi, online);

        return (
          <View key={key} style={styles.deviceCard}>
            <View style={styles.cardHeader}>
              <View style={styles.nameSection}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: online ? "#2ECC71" : "#E74C3C" },
                  ]}
                />
                <Text style={styles.deviceName}>{key.toUpperCase()}</Text>
              </View>
              <Text
                style={[
                  styles.statusBadge,
                  { color: online ? "#2ECC71" : "#E74C3C" },
                ]}
              >
                {online ? "ONLINE" : "OFFLINE"}
              </Text>
            </View>

            <View style={styles.detailsGrid}>
              {/* 📶 SIGNAL DYNAMIC */}
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
                <Ionicons name="sync-outline" size={16} color="#95A5A6" />
                <View style={styles.detailTextGroup}>
                  <Text style={styles.detailLabel}>LAST SYNC</Text>
                  <Text style={styles.detailValue}>
                    {formatTime(item.timestamp)}
                  </Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <Ionicons
                  name="battery-charging-outline"
                  size={16}
                  color="#95A5A6"
                />
                <View style={styles.detailTextGroup}>
                  <Text style={styles.detailLabel}>POWER</Text>
                  <Text style={styles.detailValue}>USB 5V</Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <Ionicons name="pulse-outline" size={16} color="#95A5A6" />
                <View style={styles.detailTextGroup}>
                  <Text style={styles.detailLabel}>INTERVAL</Text>
                  <Text style={styles.detailValue}>10s</Text>
                </View>
              </View>
            </View>

            {!online && (
              <View style={styles.alertBox}>
                <Ionicons name="warning-outline" size={14} color="#E74C3C" />
                <Text style={styles.alertText}>
                  Check device power and WiFi connection.
                </Text>
              </View>
            )}
          </View>
        );
      })}

      <TouchableOpacity style={styles.refreshBtn}>
        <Text style={styles.refreshBtnText}>PING ALL DEVICES</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA", paddingHorizontal: 20 },
  header: { marginTop: 60, marginBottom: 25 },
  headerTitle: { fontSize: 26, fontWeight: "800", color: "#2D3436" },
  headerSubtitle: { fontSize: 14, color: "#636E72", fontWeight: "500" },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  summaryBox: {
    backgroundColor: "#FFF",
    width: "48%",
    padding: 15,
    borderRadius: 16,
    elevation: 2,
  },
  summaryLabel: { fontSize: 12, color: "#B2BEC3", fontWeight: "700" },
  summaryValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#2D3436",
    marginTop: 4,
  },

  deviceCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  nameSection: { flexDirection: "row", alignItems: "center" },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  deviceName: { fontSize: 16, fontWeight: "800", color: "#2D3436" },
  statusBadge: { fontSize: 11, fontWeight: "800" },

  detailsGrid: { flexDirection: "row", flexWrap: "wrap" },
  detailItem: {
    width: "50%",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  detailTextGroup: { marginLeft: 10 },
  detailLabel: {
    fontSize: 9,
    color: "#B2BEC3",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  detailValue: { fontSize: 13, fontWeight: "700", color: "#2D3436" },

  alertBox: {
    flexDirection: "row",
    backgroundColor: "#FDEDEC",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  alertText: {
    fontSize: 11,
    color: "#E74C3C",
    marginLeft: 8,
    fontWeight: "600",
  },

  refreshBtn: {
    backgroundColor: "#2D3436",
    padding: 16,
    borderRadius: 15,
    alignItems: "center",
    marginVertical: 20,
  },
  refreshBtnText: { color: "#FFF", fontWeight: "800", letterSpacing: 1 },
});
