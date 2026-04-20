import { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, RefreshControl } from "react-native";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";

export default function Home() {
  const [data, setData] = useState({});
  const [alert, setAlert] = useState("Loading...");
  const [refreshing, setRefreshing] = useState(false);

  // ================= FIREBASE LOAD =================
  const loadData = () => {
    const r = ref(db, "/sensors");

    onValue(r, (snap) => {
      const val = snap.val() || {};
      setData(val);

      let dry = false;

      Object.keys(val).forEach((key) => {
        if (Number(val[key]?.moisture ?? 0) < 40) dry = true;
      });

      setAlert(dry ? "⚠️ TANAH KERING!" : "✅ NORMAL");
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  // ================= REFRESH HANDLER =================
  const onRefresh = useCallback(() => {
    setRefreshing(true);

    setTimeout(() => {
      loadData();
      setRefreshing(false);
    }, 1000);
  }, []);

  const getColor = (moisture) => {
    if (moisture < 25) return "#ff3b30";
    if (moisture < 40) return "#ff9500";
    return "#34c759";
  };
  const getBgColor = (moisture) => {
    if (moisture < 40) return "rgba(255, 59, 48, 0.65)"; // merah
    if (moisture < 60) return "rgba(255, 204, 0, 0.60)"; // kuning
    return "rgba(52, 199, 89, 0.65)"; // hijau
  };
  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      style={{
        flex: 1,
        backgroundColor: "#f5f7fb",
        padding: 16,
        paddingTop: 60,
      }}
    >
      {/* ================= HEADER ================= */}
      <Text style={{ fontSize: 26, fontWeight: "bold", color: "#111" }}>
        🌱 IoT Dashboard
      </Text>

      <Text style={{ color: "#666", marginTop: 5 }}>
        Smart Monitoring System
      </Text>

      {/* ================= STATUS CARD ================= */}
      <View
        style={{
          marginTop: 20,
          padding: 16,
          borderRadius: 16,
          backgroundColor: "#ffffff",
          borderWidth: 1,
          borderColor: "#e5e7eb",
        }}
      >
        <Text style={{ fontSize: 16, color: "#333" }}>SYSTEM STATUS</Text>

        <Text
          style={{
            fontSize: 20,
            marginTop: 8,
            fontWeight: "bold",
            color: alert.includes("KERING") ? "#ff3b30" : "#34c759",
          }}
        >
          {alert}
        </Text>
      </View>

      {/* ================= SENSOR GRID ================= */}
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "space-between",
          marginTop: 20,
        }}
      >
        {Object.keys(data).map((key) => {
          const item = data[key];
          const color = getColor(item.moisture);

          return (
            <View
              key={key}
              style={{
                width: "48%",
                backgroundColor: getBgColor(item.moisture), // 🔥 HERE
                padding: 14,
                borderRadius: 14,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: "#e5e7eb",
              }}
            >
              <Text style={{ color: "#111", fontWeight: "bold" }}>
                {key.toUpperCase()}
              </Text>

              <Text style={{ color: "#666", marginTop: 8 }}>Moisture</Text>

              <Text style={{ color: color, fontSize: 18, fontWeight: "bold" }}>
                {item.moisture}%
              </Text>

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

              <Text style={{ color: "#555", marginTop: 10 }}>
                🌡 {item.temperature}°C
              </Text>

              <Text style={{ color: "#999", fontSize: 11, marginTop: 5 }}>
                {item.date} {item.time}
              </Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}
