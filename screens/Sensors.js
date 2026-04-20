import { useEffect, useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";

export default function Sensors() {
  const [data, setData] = useState({});

  useEffect(() => {
    const r = ref(db, "/sensors");

    const unsub = onValue(r, (snap) => {
      setData(snap.val() || {});
    });

    return () => unsub();
  }, []);

  const getColor = (m) => {
    if (m < 25) return "#ff3b30";
    if (m < 40) return "#ff9500";
    return "#34c759";
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#f5f7fb", padding: 16 }}>
      
      <Text style={{ fontSize: 24, fontWeight: "bold", color: "#111" }}>
        🌱 Sensors
      </Text>

      <Text style={{ color: "#666", marginBottom: 15 }}>
        Real-time monitoring
      </Text>

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "space-between",
        }}
      >
        {Object.keys(data).map((key) => {
          const item = data[key];

          return (
            <View
              key={key}
              style={{
                width: "48%",
                backgroundColor: "#fff",
                padding: 14,
                borderRadius: 14,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: "#e5e7eb",
              }}
            >
              <Text style={{ fontWeight: "bold", color: "#111" }}>
                {key.toUpperCase()}
              </Text>

              <Text style={{ marginTop: 8, color: "#666" }}>
                🌱 Moisture
              </Text>

              <Text style={{ fontSize: 18, fontWeight: "bold", color: getColor(item.moisture) }}>
                {item.moisture}%
              </Text>

              <Text style={{ marginTop: 6, color: "#555" }}>
                🌡 {item.temperature}°C
              </Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}