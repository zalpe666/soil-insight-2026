import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  Platform,
} from "react-native";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";

const screenWidth = Dimensions.get("window").width;

export default function HistoryDetail({ route, navigation }) {
  const { device } = route.params;

  const [logs, setLogs] = useState([]);

  // 🔥 Default filter diubah ke 'today' karena 'all' dihapus
  const [filter, setFilter] = useState("today");

  // 🔥 State untuk Custom Date Picker
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  // Fungsi Helper Format Waktu Lengkap
  const formatFullDate = (ts) => {
    if (!ts) return "--";
    const date = new Date(ts * 1000);
    const d = date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric", // Tambah tahun untuk kejelasan saat filter tanggal lampau
    });
    const t = date
      .toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
      .replace(/\./g, ":");
    return `${d} • ${t}`;
  };

  // Fungsi Helper Tampilan Tanggal Pendek untuk Chip
  const formatShortDate = (date) => {
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
    });
  };

  useEffect(() => {
    const r = ref(db, `history/${device}`);
    const unsub = onValue(r, (snap) => {
      const data = snap.val() || {};
      let arr = Object.keys(data).map((key) => ({
        id: Number(key),
        ...data[key],
      }));
      arr.sort((a, b) => b.id - a.id);
      setLogs(arr);
    });
    return () => unsub();
  }, [device]);

  // 🔥 Logika Filter Baru
  const getFilteredLogs = () => {
    const now = Math.floor(Date.now() / 1000);
    const oneDay = 24 * 60 * 60;
    const startOfToday = new Date().setHours(0, 0, 0, 0) / 1000;

    if (filter === "today") {
      return logs.filter((i) => i.id >= startOfToday);
    }
    if (filter === "yesterday") {
      const startOfYesterday = startOfToday - oneDay;
      return logs.filter(
        (i) => i.id >= startOfYesterday && i.id < startOfToday,
      );
    }
    if (filter === "week") {
      const sevenDaysAgo = now - 7 * oneDay;
      return logs.filter((i) => i.id >= sevenDaysAgo);
    }
    if (filter === "custom") {
      // Ambil start (00:00:00) dan end (23:59:59) dari tanggal yang dipilih user
      const startOfCustom = new Date(selectedDate).setHours(0, 0, 0, 0) / 1000;
      const endOfCustom = startOfCustom + oneDay;
      return logs.filter((i) => i.id >= startOfCustom && i.id < endOfCustom);
    }
    return logs;
  };

  const filteredLogs = getFilteredLogs();

  const getStatusColor = (m) => {
    if (m < 25) return "#E74C3C";
    if (m < 40) return "#F1C40F";
    return "#2ECC71";
  };

  // Handler saat tanggal dipilih
  const onChangeDate = (event, date) => {
    setShowPicker(Platform.OS === "ios"); // Di iOS biarkan terbuka jika mode tertentu, di Android tutup
    if (date) {
      setSelectedDate(date);
      setFilter("custom");
      if (Platform.OS === "android") setShowPicker(false);
    } else {
      setShowPicker(false); // Batalkan pilihan
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color="#2D3436" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>{device.toUpperCase()}</Text>
          <Text style={styles.headerSubtitle}>Detailed History Logs</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        {/* FILTER TABS */}
        <View style={{ marginBottom: 20 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContainer}
          >
            {["today", "yesterday", "week"].map((f) => (
              <TouchableOpacity
                key={f}
                onPress={() => setFilter(f)}
                style={[styles.chip, filter === f && styles.chipActive]}
              >
                <Text
                  style={[
                    styles.chipText,
                    filter === f && styles.chipTextActive,
                  ]}
                >
                  {f.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}

            {/* Tombol Pilih Tanggal Custom */}
            <TouchableOpacity
              onPress={() => setShowPicker(true)}
              style={[
                styles.chip,
                styles.customChip,
                filter === "custom" && styles.chipActive,
              ]}
            >
              <Ionicons
                name="calendar-outline"
                size={14}
                color={filter === "custom" ? "#FFF" : "#666"}
                style={{ marginRight: 5 }}
              />
              <Text
                style={[
                  styles.chipText,
                  filter === "custom" && styles.chipTextActive,
                ]}
              >
                {filter === "custom"
                  ? formatShortDate(selectedDate)
                  : "PILIH TGL"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* DATE PICKER COMPONENT */}
        {showPicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            maximumDate={new Date()} // Mencegah user milih tanggal masa depan
            onChange={onChangeDate}
          />
        )}

        {/* SUMMARY STATS */}
        <View style={styles.summaryCard}>
          <Ionicons name="stats-chart" size={20} color="#007AFF" />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.summaryLabel}>Total Records Found</Text>
            <Text style={styles.summaryValue}>
              {filteredLogs.length} Data Points
            </Text>
          </View>
        </View>

        {/* LOG LIST */}
        {filteredLogs.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cloud-offline-outline" size={50} color="#BDC3C7" />
            <Text style={styles.emptyText}>
              No data logs available for this period
            </Text>
          </View>
        ) : (
          filteredLogs.map((item) => {
            const color = getStatusColor(item.moisture);
            return (
              <View key={item.id} style={styles.logCard}>
                <View
                  style={[styles.statusSideBar, { backgroundColor: color }]}
                />

                <View style={styles.logContent}>
                  <View style={styles.logHeader}>
                    <Text style={styles.logTime}>
                      {formatFullDate(item.id)}
                    </Text>
                    <View
                      style={[styles.badge, { backgroundColor: color + "20" }]}
                    >
                      <Text
                        style={{
                          color: color,
                          fontSize: 10,
                          fontWeight: "700",
                        }}
                      >
                        {item.moisture >= 40 ? "OPTIMAL" : "CHECK"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.dataRow}>
                    <View style={styles.dataBox}>
                      <Text style={styles.dataLabel}>MOISTURE</Text>
                      <Text style={[styles.dataValue, { color: color }]}>
                        {item.moisture}%
                      </Text>
                      <Text style={[styles.dataValueRaw, { color: color }]}>
                        ADC: {item.raw_moisture}
                      </Text>
                    </View>
                    <View style={styles.dataDivider} />
                    <View style={styles.dataBox}>
                      <Text style={styles.dataLabel}>TEMPERATURE</Text>
                      <Text style={styles.dataValue}>{item.temperature}°C</Text>
                    </View>
                  </View>

                  {/* MINI PROGRESS BAR */}
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${item.moisture}%`, backgroundColor: color },
                      ]}
                    />
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA", paddingHorizontal: 20 },
  header: {
    marginTop: 60,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: { marginRight: 15, padding: 5 },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#2D3436" },
  headerSubtitle: { fontSize: 13, color: "#636E72" },

  filterWrapper: { flexDirection: "row", flexWrap: "wrap", marginBottom: 20 },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E1E1E1",
    marginRight: 8,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  customChip: {
    paddingHorizontal: 12,
  },
  chipActive: { backgroundColor: "#2D3436", borderColor: "#2D3436" },
  chipText: { fontSize: 11, fontWeight: "700", color: "#666" },
  chipTextActive: { color: "#FFF" },

  summaryCard: {
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    elevation: 2,
  },
  summaryLabel: { fontSize: 12, color: "#95A5A6", fontWeight: "600" },
  summaryValue: { fontSize: 18, fontWeight: "700", color: "#2D3436" },

  logCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: "row",
    overflow: "hidden",
    elevation: 2,
  },
  statusSideBar: { width: 5 },
  logContent: { flex: 1, padding: 15 },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  logTime: { fontSize: 12, fontWeight: "700", color: "#2D3436" },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },

  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  dataBox: { flex: 1 },
  dataLabel: {
    fontSize: 9,
    color: "#95A5A6",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  dataValue: { fontSize: 16, fontWeight: "700", color: "#2D3436" },
  dataValueRaw: { fontSize: 12, fontWeight: "500", marginTop: 4, color: "#7F8C8D" },
  dataDivider: { width: 1, backgroundColor: "#F0F0F0", marginHorizontal: 15 },

  progressBarBg: { height: 4, backgroundColor: "#F0F0F0", borderRadius: 2 },
  progressBarFill: { height: 4, borderRadius: 2 },

  emptyState: { alignItems: "center", marginTop: 50 },
  emptyText: { color: "#BDC3C7", marginTop: 10, fontSize: 14 },
  // Hapus gaya filterWrapper yang lama, ganti dengan ini:
  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 20, // Memberikan jarak ekstra saat di-scroll mentok ke kanan
  },

  // Pastikan margin bawah chip dihilangkan karena sekarang kita pakai scroll horizontal
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E1E1E1",
    marginRight: 8, // Hanya gunakan margin kanan
    flexDirection: "row",
    alignItems: "center",
  },
});
