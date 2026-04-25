import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Dimensions,
  TouchableOpacity, // Pastikan ini diimport dari react-native
} from "react-native";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage"; // Wajib import
import { useFocusEffect } from "@react-navigation/native"; // Wajib import

const screenWidth = Dimensions.get("window").width;

export default function Home() {
  const [data, setData] = useState({});
  const [customNames, setCustomNames] = useState({}); // State untuk menampung nama dari Settings
  const [alertStatus, setAlertStatus] = useState({
    label: "Loading...",
    color: "#95A5A6",
  });
  const [refreshing, setRefreshing] = useState(false);

  // 🔥 1. Fungsi Load Nama dari Local Storage
  const loadCustomNames = async () => {
    try {
      const savedNames = await AsyncStorage.getItem("esp_names");
      if (savedNames) {
        setCustomNames(JSON.parse(savedNames));
      }
    } catch (e) {
      console.log("Error loading names:", e);
    }
  };

  // 🔥 2. Trigger setiap kali tab Home diklik (Fokus)
  useFocusEffect(
    useCallback(() => {
      loadCustomNames();
    }, [])
  );

  // 🔥 3. Ambil data dari Firebase
  const loadData = () => {
    const r = ref(db, "/sensors");
    onValue(r, (snap) => {
      const val = snap.val() || {};
      setData(val);

      let isCritical = false;
      let isWarning = false;

      Object.keys(val).forEach((key) => {
        const m = val[key]?.moisture ?? 0;
        if (m < 25) isCritical = true;
        else if (m < 40) isWarning = true;
      });

      if (isCritical)
        setAlertStatus({ label: "CRITICAL - NEED WATER", color: "#E74C3C" });
      else if (isWarning)
        setAlertStatus({ label: "WARNING - SOIL DRY", color: "#F1C40F" });
      else setAlertStatus({ label: "SYSTEM NORMAL", color: "#2ECC71" });
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

  const formatTime = (ts) => {
    if (!ts) return "--:--";
    const date = new Date(ts * 1000);
    return date
      .toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
      .replace(/\./g, ":");
  };

  const getStatusColor = (m) => {
    if (m < 25) return "#E74C3C";
    if (m < 40) return "#F1C40F";
    return "#2ECC71";
  };

  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      style={styles.container}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>IoT Dashboard</Text>
          <Text style={styles.headerSubtitle}>Smart Agriculture System</Text>
        </View>
        <TouchableOpacity style={styles.profileBtn}>
          <Ionicons name="notifications-outline" size={24} color="#2D3436" />
        </TouchableOpacity>
      </View>

      {/* SYSTEM STATUS CARD */}
      <View style={styles.mainStatusCard}>
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

      <Text style={styles.sectionTitle}>Sensor Nodes</Text>

      {/* SENSOR GRID */}
      <View style={styles.grid}>
        {Object.keys(data).map((key) => {
          const item = data[key];
          const accentColor = getStatusColor(item.moisture);

          // 🔥 4. Logika penentuan nama display
          const displayName = customNames[key] && customNames[key] !== "" 
            ? customNames[key] 
            : key.toUpperCase();

          return (
            <View key={key} style={styles.sensorCard}>
              <View
                style={[styles.cardAccent, { backgroundColor: accentColor }]}
              />

              <View style={styles.cardHeader}>
                {/* 🔥 Gunakan displayName di sini */}
                <Text style={styles.sensorName} numberOfLines={1}>
                  {displayName}
                </Text>
                <Ionicons name="radio-outline" size={14} color="#2ECC71" />
              </View>

              <Text style={styles.dataLabel}>Moisture Content</Text>
              <Text style={[styles.moistureValue, { color: accentColor }]}>
                {item.moisture}%
              </Text>

              <View style={styles.progressContainer}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${item.moisture}%`,
                      backgroundColor: accentColor,
                    },
                  ]}
                />
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.tempBox}>
                  <Ionicons
                    name="thermometer-outline"
                    size={12}
                    color="#E67E22"
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
  container: { flex: 1, backgroundColor: "#F8F9FA", paddingHorizontal: 20 },
  header: {
    marginTop: 60,
    marginBottom: 25,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { fontSize: 26, fontWeight: "800", color: "#2D3436" },
  headerSubtitle: { fontSize: 14, color: "#636E72", fontWeight: "500" },
  profileBtn: { padding: 5 },
  mainStatusCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  statusIconBg: { padding: 10, borderRadius: 15 },
  statusLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#B2BEC3",
    letterSpacing: 1,
  },
  statusValue: { fontSize: 18, fontWeight: "800" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2D3436",
    marginBottom: 15,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  sensorCard: {
    width: "48%",
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
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
  sensorName: { fontSize: 13, fontWeight: "700", color: "#636E72", flex: 1, marginRight: 5 },
  dataLabel: { fontSize: 10, color: "#B2BEC3", fontWeight: "600" },
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
    color: "#E67E22",
    marginLeft: 3,
  },
  timeText: { fontSize: 10, color: "#BDC3C7", fontWeight: "600" },
});