import { useEffect, useState } from "react";
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

const screenWidth = Dimensions.get("window").width;

export default function History({ navigation }) {
  const sensors = ["esp1", "esp2", "esp3", "esp4", "esp5", "esp6"];
  const [selected, setSelected] = useState("esp4");
  const [logs, setLogs] = useState([]);

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
      arr = arr.slice(-6); // Ambil 6 data terakhir
      setLogs(arr);
    });
    return () => unsubscribe();
  }, [selected]);

  const latest = logs[logs.length - 1] || {};
  const moisture = latest.moisture || 0;
  const temp = latest.temperature || 0;
  const lastUpdate = formatTime(latest.id);

  let status = "NORMAL";
  let statusColor = "#2ECC71"; // Emerald Green
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
    <ScrollView style={styles.container}>
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
        {sensors.map((s) => (
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
              {s.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* STATUS CARD (LIGHT STYLE) */}
      <View style={styles.statusCard}>
        <View
          style={[styles.statusIndicator, { backgroundColor: statusColor }]}
        />
        <View style={styles.statusInfo}>
          <Text style={styles.deviceLabel}>
            Device: {selected.toUpperCase()}
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
          width={screenWidth}
          height={200}

          chartConfig={chartConfig("#3498DB")} // Blue
          bezier
          style={styles.chartStyle}
        />
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Temperature (°C)</Text>
        <LineChart
          data={{ labels, datasets: [{ data: tempData }] }}
          width={screenWidth}
          height={200}
          chartConfig={chartConfig("#E67E22")} // Orange
          bezier
          style={styles.chartStyle}
        />
      </View>

      <TouchableOpacity
        onPress={() =>
          navigation.navigate("HistoryDetail", { device: selected })
        }
        style={styles.buttonMore}
      >
        <Text style={styles.buttonText}>VIEW ANALYTICS</Text>
      </TouchableOpacity>
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
  headerTitle: { fontSize: 24, fontWeight: "700", color: "#2D3436" },
  headerSubtitle: { fontSize: 14, color: "#636E72" },
  tabScroll: { marginBottom: 20 },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 12,
    backgroundColor: "#FFF",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#E1E1E1",
  },
  tabActive: { backgroundColor: "#00B894", borderColor: "#00B894" },
  tabText: { marginLeft: 5, fontSize: 13, color: "#666", fontWeight: "600" },
  tabTextActive: { color: "#FFF" },
  statusCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    flexDirection: "row",
    padding: 15,
    alignItems: "center",
    marginBottom: 25,
    // Shadow untuk Android
    elevation: 4,
  },
  statusIndicator: {
    width: 6,
    height: "80%",
    borderRadius: 3,
    marginRight: 15,
  },
  statusInfo: { flex: 1 },
  deviceLabel: { fontSize: 12, color: "#999", fontWeight: "600" },
  statusText: { fontSize: 18, fontWeight: "700", marginVertical: 2 },
  statsRow: { flexDirection: "row", alignItems: "center" },
  statItem: { fontSize: 14, fontWeight: "600", color: "#2D3436" },
  statDivider: { marginHorizontal: 10, color: "#EEE" },
  timeBox: { alignItems: "flex-end" },
  timeText: { fontSize: 10, color: "#999", marginTop: 2 },
  chartContainer: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    paddingTop: 20,
    marginBottom: 20,
    elevation: 2,
    alignItems: "center",
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2D3436",
    alignSelf: "flex-start",
    marginLeft: 20,
  },
  chartStyle: { marginVertical: 8, borderRadius: 16 },
  buttonMore: {
    backgroundColor: "#2D3436",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 40,
  },
  buttonText: { color: "#FFF", fontWeight: "700", letterSpacing: 1 },
});
