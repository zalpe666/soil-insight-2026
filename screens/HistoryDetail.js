import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";

export default function HistoryDetail({ route }) {
  const { device } = route.params;

  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const r = ref(db, `history/${device}`);

    const unsub = onValue(r, (snap) => {
      const data = snap.val() || {};

      let arr = Object.keys(data).map((key) => ({
        id: key,
        ...data[key],
      }));

      arr.sort((a, b) => a.id - b.id);
      setLogs(arr);
    });

    return () => unsub();
  }, [device]);

  // ================= FILTER =================
  const getFilteredLogs = () => {
    if (filter === "all") return logs;

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    // ================= TODAY =================
    if (filter === "today") {
      return logs.filter((i) => i.date === todayStr);
    }

    // ================= YESTERDAY =================
    if (filter === "yesterday") {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().slice(0, 10);

      return logs.filter((i) => i.date === yStr);
    }

    // ================= WEEK =================
    if (filter === "week") {
      const now = new Date();
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);

      return logs.filter(
        (i) => new Date(i.date) >= weekAgo && new Date(i.date) <= now,
      );
    }

    return logs;
  };

  const filteredLogs = getFilteredLogs();

  // ================= COLORS =================
  const getMoistureColor = (m) => {
    if (m < 25) return "#ff3b30";
    if (m < 40) return "#ff9500";
    return "#34c759";
  };

  const getBgColor = (m) => {
    if (m < 25) return "rgba(255,59,48,0.12)";
    if (m < 40) return "rgba(255,149,0,0.12)";
    return "rgba(52,199,89,0.12)";
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#f5f7fb", padding: 16,paddingTop:50 }}>
      {/* ================= HEADER ================= */}
      <Text style={{ fontSize: 24, fontWeight: "bold", color: "#111" }}>
        📊 {device.toUpperCase()} Dashboard
      </Text>

      <Text style={{ color: "#666", marginTop: 4 }}>
        Historical Sensor Analytics
      </Text>

      {/* ================= FILTER ================= */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 15 }}>
        {["all", "today", "yesterday", "week"].map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={{
              paddingVertical: 6,
              paddingHorizontal: 12,
              marginRight: 8,
              marginBottom: 8,
              borderRadius: 20,
              backgroundColor: filter === f ? "#007AFF" : "#e5e7eb",
            }}
          >
            <Text
              style={{ color: filter === f ? "#fff" : "#333", fontSize: 12 }}
            >
              {f.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ================= SUMMARY CARD ================= */}
      <View
        style={{
          backgroundColor: "#fff",
          padding: 14,
          borderRadius: 14,
          marginBottom: 15,
          borderWidth: 1,
          borderColor: "#e5e7eb",
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: "bold", color: "#111" }}>
          Total Records
        </Text>
        <Text style={{ fontSize: 20, color: "#007AFF", marginTop: 5 }}>
          {filteredLogs.length}
        </Text>
      </View>

      {/* ================= LIST ================= */}
      {filteredLogs.length === 0 ? (
        <Text style={{ textAlign: "center", marginTop: 30, color: "#666" }}>
          No data found
        </Text>
      ) : (
        filteredLogs.map((item) => {
          const color = getMoistureColor(item.moisture);

          return (
            <View
              key={item.id}
              style={{
                backgroundColor: getBgColor(item.moisture),
                padding: 14,
                borderRadius: 14,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: "#e5e7eb",
              }}
            >
              {/* TOP */}
              <Text style={{ fontWeight: "bold", color: "#111" }}>
               {item.time} {item.date}
              </Text>

              {/* MOISTURE */}
              <Text style={{ marginTop: 8, color: "#666" }}>Moisture</Text>

              <Text style={{ fontSize: 18, fontWeight: "bold", color: color }}>
                {item.moisture}%
              </Text>

              {/* BAR */}
              <View
                style={{
                  height: 6,
                  backgroundColor: "#e5e7eb",
                  borderRadius: 10,
                  marginTop: 8,
                }}
              >
                <View
                  style={{
                    width: `${item.moisture}%`,
                    height: 6,
                    backgroundColor: color,
                    borderRadius: 10,
                  }}
                />
              </View>

              {/* TEMP */}
              <Text style={{ marginTop: 10, color: "#555" }}>
                🌡 Temperature: {item.temperature}°C
              </Text>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}
