import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
} from "react-native";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";
import { LineChart } from "react-native-chart-kit";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

const screenWidth = Dimensions.get("window").width;

export default function History({ navigation }) {
  const sensors = ["esp1", "esp2", "esp3", "esp4", "esp5", "esp6"];
  const [selected, setSelected] = useState("esp4");
  const [logs, setLogs] = useState([]);
  const [customNames, setCustomNames] = useState({});

  // 🔥 Ambil nama custom dari local storage
  const loadCustomNames = async () => {
    try {
      const saved = await AsyncStorage.getItem("esp_names");
      if (saved) setCustomNames(JSON.parse(saved));
    } catch (e) {
      console.log(e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCustomNames();
    }, []),
  );

  const formatTime = (unixTimestamp) => {
    if (!unixTimestamp || unixTimestamp === 0) return "--:--:--";
    const date = new Date(unixTimestamp * 1000);
    return date
      .toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
      .replace(/\./g, ":");
  };

  useEffect(() => {
    const r = ref(db, `history/${selected}`);
    const unsubscribe = onValue(r, (snap) => {
      const data = snap.val();
      if (!data) {
        setLogs([]);
        return;
      }
      let arr = Object.keys(data).map((key) => ({
        id: Number(key) || 0,
        ...data[key],
      }));
      arr.sort((a, b) => a.id - b.id);
      arr = arr.slice(-6);
      setLogs(arr);
    });
    return () => unsubscribe();
  }, [selected]);

  const latest = logs[logs.length - 1] || {};
  const moisture = latest.moisture || 0;
  const temp = latest.temperature || 0;
  const lastUpdate = formatTime(latest.id);

  let status = "NORMAL";
  let statusColor = "#2ECC71";
  if (moisture < 40) {
    status = "SOIL DRY";
    statusColor = "#F1C40F";
  }
  if (moisture < 25) {
    status = "CRITICAL";
    statusColor = "#E74C3C";
  }

  const labels = logs.length ? logs.map((i) => formatTime(i.id)) : ["--:--:--"];
  const moistureData = logs.length ? logs.map((i) => i.moisture || 0) : [0];
  const tempData = logs.length ? logs.map((i) => i.temperature || 0) : [0];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Monitoring Dashboard</Text>
        <Text style={styles.headerSubtitle}>Real-time Soil Insight</Text>
      </View>

      {/* SENSOR TAB */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
      >
        {sensors.map((s) => {
          const displayName = customNames[s] || s.toUpperCase();
          return (
            <TouchableOpacity
              key={s}
              onPress={() => setSelected(s)}
              style={[styles.tabButton, selected === s && styles.tabActive]}
            >
              <Ionicons
                name="hardware-chip-outline"
                size={14}
                color={selected === s ? "#FFF" : "#666"}
              />
              <Text
                style={[styles.tabText, selected === s && styles.tabTextActive]}
              >
                {displayName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* STATUS CARD */}
      <View style={styles.statusCard}>
        <View
          style={[styles.statusIndicator, { backgroundColor: statusColor }]}
        />
        <View style={styles.statusInfo}>
          <Text style={styles.deviceLabel}>
            {customNames[selected] || selected.toUpperCase()}
          </Text>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {status}
          </Text>
          <View style={styles.statsRow}>
            <Text style={styles.statItem}>🌱 {moisture}%</Text>
            <Text style={styles.statDivider}>|</Text>
            <Text style={styles.statItem}>🌡 {temp}°C</Text>
          </View>
        </View>
        <View style={styles.timeBox}>
          <Ionicons name="time-outline" size={12} color="#999" />
          <Text style={styles.timeText}>{lastUpdate}</Text>
        </View>
      </View>

      {/* CHARTS */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Moisture Levels (%)</Text>
        <LineChart
          data={{ labels, datasets: [{ data: moistureData }] }}
          width={screenWidth - 40}
          height={220}
          verticalLabelRotation={35} // Rotasi agar Jam:Menit:Detik tidak tumpuk
          chartConfig={chartConfig("#3498DB")}
          bezier
          style={styles.chartStyle}
        />
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Temperature (°C)</Text>
        <LineChart
          data={{ labels, datasets: [{ data: tempData }] }}
          width={screenWidth - 40}
          height={220}
          verticalLabelRotation={35}
          chartConfig={chartConfig("#E67E22")}
          bezier
          style={styles.chartStyle}
        />
      </View>

      {/* ACTION BUTTONS */}
      <View style={styles.footerButtons}>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("HistoryDetail", { device: selected })
          }
          style={styles.buttonMain}
        >
          <Ionicons name="analytics" size={18} color="#FFF" />
          <Text style={styles.buttonText}>VIEW ANALYTICS</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("Logs", { device: selected })}
          style={styles.buttonSecondary}
        >
          <Ionicons name="document-text-outline" size={18} color="#2D3436" />
          <Text style={styles.buttonSecondaryText}>VIEW LOGS</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const chartConfig = (color) => ({
  backgroundColor: "#FFF",
  backgroundGradientFrom: "#FFF",
  backgroundGradientTo: "#FFF",
  decimalPlaces: 0,
  color: (opacity = 1) => color,
  labelColor: (opacity = 1) => `#666`,
  propsForDots: { r: "4", strokeWidth: "2", stroke: color },
  propsForLabels: { fontSize: 10 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA", paddingHorizontal: 20 },
  header: { marginTop: 60, marginBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#2D3436" },
  headerSubtitle: { fontSize: 14, color: "#636E72" },
  tabScroll: { marginBottom: 20 },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: "#FFF",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#E1E1E1",
  },
  tabActive: { backgroundColor: "#00B894", borderColor: "#00B894" },
  tabText: { marginLeft: 6, fontSize: 13, color: "#666", fontWeight: "700" },
  tabTextActive: { color: "#FFF" },
  statusCard: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    flexDirection: "row",
    padding: 18,
    alignItems: "center",
    marginBottom: 25,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  statusIndicator: {
    width: 6,
    height: "80%",
    borderRadius: 3,
    marginRight: 15,
  },
  statusInfo: { flex: 1 },
  deviceLabel: { fontSize: 12, color: "#999", fontWeight: "700" },
  statusText: { fontSize: 20, fontWeight: "800", marginVertical: 2 },
  statsRow: { flexDirection: "row", alignItems: "center" },
  statItem: { fontSize: 15, fontWeight: "700", color: "#2D3436" },
  statDivider: { marginHorizontal: 10, color: "#EEE" },
  timeBox: { alignItems: "flex-end" },
  timeText: { fontSize: 10, color: "#999", marginTop: 4, fontWeight: "600" },
  chartContainer: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    paddingTop: 20,
    marginBottom: 20,
    elevation: 3,
    alignItems: "center",
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2D3436",
    alignSelf: "flex-start",
    marginLeft: 20,
    marginBottom: 10,
  },
  chartStyle: { marginVertical: 10, borderRadius: 18 },
  footerButtons: { marginBottom: 100 }, // Tambahkan margin bawah agar tidak tertutup tab bar
  buttonMain: {
    flexDirection: "row",
    backgroundColor: "#2D3436",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  buttonSecondary: {
    flexDirection: "row",
    backgroundColor: "transparent",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2D3436",
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "700",
    letterSpacing: 1,
    marginLeft: 8,
  },
  buttonSecondaryText: {
    color: "#2D3436",
    fontWeight: "700",
    letterSpacing: 1,
    marginLeft: 8,
  },
});
