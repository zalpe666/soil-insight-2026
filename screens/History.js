import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  Alert, // <-- Tambahkan Alert
} from "react-native";
import { ref, onValue, set } from "firebase/database"; // <-- Tambahkan 'set'
import { db } from "../firebase";
import { LineChart } from "react-native-chart-kit";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { COLORS, globalStyles } from "../styles/theme.js";

const screenWidth = Dimensions.get("window").width;

export default function History({ navigation }) {
  const sensors = ["esp1", "esp2", "esp3", "esp4", "esp5", "esp6"];
  const [selected, setSelected] = useState("esp4");
  const [logs, setLogs] = useState([]);
  const [customNames, setCustomNames] = useState({});

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem("esp_names").then((s) => {
        if (s) setCustomNames(JSON.parse(s));
      });
    }, []),
  );

  useEffect(() => {
    const unsub = onValue(ref(db, `history/${selected}`), (snap) => {
      const data = snap.val();
      if (!data) return setLogs([]);
      setLogs(
        Object.keys(data)
          .map((k) => ({ id: Number(k) || 0, ...data[k] }))
          .sort((a, b) => a.id - b.id)
          .slice(-6),
      );
    });
    return () => unsub();
  }, [selected]);

  // FUNGSI RESTART ESP
  const handleRestartESP = async () => {
    Alert.alert(
      "Konfirmasi Restart",
      `Apakah kamu yakin ingin merestart perangkat ${selected.toUpperCase()}?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Restart",
          style: "destructive",
          onPress: async () => {
            try {
              // Path menyesuaikan kode ESP32 kamu: /sensors/[esp_id]/restart
              const restartRef = ref(db, `sensors/${selected}/restart`);
              await set(restartRef, true);
              Alert.alert(
                "Sukses",
                `Perintah restart terkirim ke ${selected.toUpperCase()}`,
              );
            } catch (error) {
              console.error("Gagal mengirim perintah restart:", error);
              Alert.alert("Error", "Gagal merestart perangkat.");
            }
          },
        },
      ],
    );
  };

  const latest = logs[logs.length - 1] || {};
  let status = "NORMAL";
  let statusColor = COLORS.success;
  if (latest.moisture < 40) {
    status = "SOIL DRY";
    statusColor = COLORS.warning;
  }
  if (latest.moisture < 25) {
    status = "CRITICAL";
    statusColor = COLORS.danger;
  }

  const formatTime = (ts) =>
    ts
      ? new Date(ts * 1000)
          .toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          })
          .replace(/\./g, ":")
      : "--:--:--";
  const labels = logs.length ? logs.map((i) => formatTime(i.id)) : ["--:--:--"];
  const mData = logs.length ? logs.map((i) => i.moisture || 0) : [0];
  const tData = logs.length ? logs.map((i) => i.temperature || 0) : [0];

  const chartConfig = (color) => ({
    backgroundColor: COLORS.white,
    backgroundGradientFrom: COLORS.white,
    backgroundGradientTo: COLORS.white,
    decimalPlaces: 0,
    color: (o = 1) => color,
    labelColor: () => `#666`,
    propsForDots: { r: "4", strokeWidth: "1", stroke: color },
    propsForLabels: { fontSize: 10 },
  });

  return (
    <ScrollView
      style={globalStyles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={globalStyles.header}>
        <Text style={globalStyles.headerTitle}>Monitoring Dashboard</Text>
        <Text style={globalStyles.headerSubtitle}>Real-time Soil Insight</Text>
      </View>

      <View style={styles.tabContainer}>
        {sensors.map((s) => (
          <TouchableOpacity
            key={s}
            onPress={() => setSelected(s)}
            style={[styles.tabButton, selected === s && styles.tabActive]}
          >
            <Ionicons
              name="hardware-chip-outline"
              size={14}
              color={selected === s ? COLORS.white : "#666"}
            />
            <Text
              style={[styles.tabText, selected === s && styles.tabTextActive]}
            >
              {s.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[globalStyles.card, styles.statusCard]}>
        <View
          style={[styles.statusIndicator, { backgroundColor: statusColor }]}
        />
        <View style={styles.statusInfo}>
          <Text style={styles.deviceLabel}>{selected.toUpperCase()}</Text>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {status}
          </Text>
          <View style={styles.statsRow}>
            <Text style={styles.statItem}>🌱 {latest.moisture || 0}%</Text>
            <Text style={styles.statDivider}>|</Text>
            <Text style={styles.statItem}>🌡 {latest.temperature || 0}°C</Text>
          </View>
        </View>
        <View style={styles.timeBox}>
          <Ionicons name="time-outline" size={12} color="#999" />
          <Text style={styles.timeText}>{formatTime(latest.id)}</Text>
        </View>
      </View>

      {[
        { title: "Moisture Levels (%)", data: mData, color: COLORS.info },
        { title: "Temperature (°C)", data: tData, color: COLORS.accent },
      ].map((ch, idx) => (
        <View key={idx} style={styles.chartContainer}>
          <Text style={styles.chartTitle}>{ch.title}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <LineChart
              data={{ labels, datasets: [{ data: ch.data }] }}
              width={Math.max(screenWidth, labels.length * 10)}
              height={200}
              chartConfig={chartConfig(ch.color)}
              bezier
            />
          </ScrollView>
        </View>
      ))}

      {/* Button */}
      <View style={styles.footerButtons}>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("HistoryDetail", { device: selected })
          }
          style={globalStyles.buttonMain}
        >
          <Ionicons name="analytics" size={18} color={COLORS.white} />
          <Text style={globalStyles.buttonText}>VIEW ANALYTICS</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("Logs", { device: selected })}
          style={styles.buttonSecondary}
        >
          <Ionicons
            name="document-text-outline"
            size={18}
            color={COLORS.textMain}
          />
          <Text style={styles.buttonSecondaryText}>VIEW LOGS</Text>
        </TouchableOpacity>

        {/* TOMBOL RESTART BARU */}
        <TouchableOpacity
          onPress={handleRestartESP}
          style={styles.buttonDanger}
        >
          <Ionicons
            name="power-outline"
            size={18}
            color={COLORS.danger || "#FF4757"}
          />
          <Text style={styles.buttonDangerText}>
            RESTART {selected.toUpperCase()}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tabButton: {
    width: "31%", // 3 tombol per baris
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  tabActive: { backgroundColor: "#00B894", borderColor: "#00B894" },
  tabText: { marginLeft: 6, fontSize: 13, color: "#666", fontWeight: "700" },
  tabTextActive: { color: COLORS.white },
  statusCard: {
    flexDirection: "row",
    padding: 18,
    alignItems: "center",
    marginBottom: 25,
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
  statItem: { fontSize: 15, fontWeight: "700", color: COLORS.textMain },
  statDivider: { marginHorizontal: 10, color: "#EEE" },
  timeBox: { alignItems: "flex-end" },
  timeText: { fontSize: 10, color: "#999", marginTop: 4, fontWeight: "600" },
  chartContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    paddingTop: 20,
    marginBottom: 20,
    elevation: 3,
    alignItems: "center",
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textMain,
    alignSelf: "flex-start",
    marginLeft: 20,
    marginBottom: 10,
  },
  chartStyle: { marginVertical: 10, borderRadius: 18 },
  footerButtons: { marginBottom: 100 },
  buttonSecondary: {
    flexDirection: "row",
    backgroundColor: "transparent",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.textMain,
    marginTop: 12,
  },
  buttonSecondaryText: {
    color: COLORS.textMain,
    fontWeight: "700",
    letterSpacing: 1,
    marginLeft: 8,
  },
  // STYLING UNTUK TOMBOL RESTART
  buttonDanger: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 71, 87, 0.1)", // Merah transparan untuk native app feel
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.danger || "#FF4757",
    marginTop: 12,
  },
  buttonDangerText: {
    color: COLORS.danger || "#FF4757",
    fontWeight: "700",
    letterSpacing: 1,
    marginLeft: 8,
  },
  tabContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
});
