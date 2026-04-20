import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";
import { LineChart } from "react-native-chart-kit";
import { Ionicons } from "@expo/vector-icons";

const screenWidth = Dimensions.get("window").width;

export default function History() {
  const sensors = ["esp1", "esp2", "esp3", "esp4", "esp5", "esp6"];

  const [selected, setSelected] = useState("esp1");
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const r = ref(db, `history/${selected}`);

    const unsubscribe = onValue(r, (snap) => {
      const data = snap.val();

      if (!data) {
        setLogs([]);
        return;
      }

      // 🔥 FIX: safe parse key
      let arr = Object.keys(data).map((key) => ({
        id: Number(key) || 0,
        ...data[key],
      }));

      // sort lama -> baru
      arr.sort((a, b) => a.id - b.id);

      // ambil 7 data terakhir (jam)
      arr = arr.slice(-6);

      setLogs(arr);
    });

    return () => {
      unsubscribe();
    };
  }, [selected]);

  // 🔥 STATUS SENSOR
  const latest = logs[logs.length - 1] || {};
  const moisture = latest.moisture || 0;
  const temp = latest.temperature || 0;

  let status = "NORMAL";
  let statusColor = "#00aa00";

  if (moisture < 40) {
    status = "WARNING - DRY SOIL";
    statusColor = "#ffb300";
  }

  if (moisture < 25) {
    status = "CRITICAL - WATER NEEDED";
    statusColor = "#ff3b30";
  }

  const labels = logs.length
    ? logs.map((i) => i.time?.slice(0, 5) || "--:--")
    : ["--"];

  const moistureData = logs.length ? logs.map((i) => i.moisture || 0) : [0];

  const tempData = logs.length ? logs.map((i) => i.temperature || 0) : [0];

  return (
    <ScrollView style={{ flex: 1, padding: 8, paddingTop: 50 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>DEVICE HISTORY</Text>

      {/* 🔥 SENSOR TAB */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingVertical: 10,
          paddingHorizontal: 8,
        }}
      >
        {sensors.map((s) => {
          const isActive = selected === s;

          return (
            <TouchableOpacity
              key={s}
              onPress={() => setSelected(s)}
              activeOpacity={0.8}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 10,
                paddingHorizontal: 16,
                marginRight: 10,
                borderRadius: 25,
                backgroundColor: isActive ? "#00ff00" : "#f1f1f1",
                borderWidth: isActive ? 0 : 1,
                borderColor: "#ddd",
                shadowColor: "#000",
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: isActive ? 3 : 0,
              }}
            >
              {/* icon kecil */}
              <Ionicons
                name="leaf-outline"
                size={16}
                color={isActive ? "#000" : "#666"}
                style={{ marginRight: 6 }}
              />

              <Text
                style={{
                  color: isActive ? "#000" : "#444",
                  fontWeight: isActive ? "bold" : "500",
                  fontSize: 13,
                  letterSpacing: 0.5,
                }}
              >
                {s.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 🔥 STATUS CARD */}
      <View
        style={{
          marginTop: 2,
          padding: 15,
          borderRadius: 12,
          backgroundColor: "#111",
        }}
      >
        <Text style={{ color: "#fff", fontSize: 16 }}>
          Device: {selected.toUpperCase()}
        </Text>

        <Text style={{ color: statusColor, fontSize: 18, marginTop: 5 }}>
          {status}
        </Text>

        <Text style={{ color: "#fff", marginTop: 5 }}>
          🌱 Moisture: {moisture}% | 🌡 Temp: {temp}°C
        </Text>
      </View>

      {/* 🌱 MOISTURE CHART */}
      <View
        style={{
          marginTop: 0,
          paddingVertical: 20,
          borderWidth: 0,
          borderRadius: 12,
          backgroundColor: "#eaffea",
          overflow: "hidden",
        }}
      >
        <Text
          style={{
            fontWeight: "bold",
            paddingHorizontal: 20,
            paddingVertical: 4,
            fontSize: 16,
          }}
        >
          Kelembapan Tanah (Per Jam)
        </Text>

        <LineChart
          data={{
            labels: labels,
            datasets: [
              {
                data: moistureData,
              },
            ],
          }}
          width={screenWidth - 10}
          height={180}
          yAxisSuffix="%"
          bezier
          chartConfig={{
            backgroundGradientFrom: "#eaffea",
            backgroundGradientTo: "#eaffea",
            color: () => "#00aa00",
            labelColor: () => "#333",
            decimalPlaces: 0,
          }}
          style={{ borderRadius: 10 }}
        />
      </View>

      {/* 🌡 TEMPERATURE CHART */}
      <View
        style={{
          marginTop: 20,
          borderWidth: 0,
          borderRadius: 12,
          paddingVertical: 20,
          overflow: "hidden",
          backgroundColor: "#eaf4ff",
        }}
      >
        <Text
          style={{
            fontWeight: "bold",
            paddingHorizontal: 20,
            paddingVertical: 4,
            fontSize: 16,
          }}
        >
          Suhu Tanah (Per Jam)
        </Text>

        <LineChart
          data={{
            labels: labels,
            datasets: [
              {
                data: tempData,
              },
            ],
          }}
          width={screenWidth - 10}
          height={180}
          yAxisSuffix="°C"
          bezier
          chartConfig={{
            backgroundGradientFrom: "#eaf4ff",
            backgroundGradientTo: "#eaf4ff",
            color: () => "#0077ff",
            labelColor: () => "#333",
            decimalPlaces: 0,
          }}
          style={{ borderRadius: 10 }}
        />
      </View>

      {/* 📋 LOG LIST */}
      {/* <View style={{ marginTop: 20 }}>
        {logs.length === 0 ? (
          <Text style={{ textAlign: "center", marginTop: 20 }}>
            No data available
          </Text>
        ) : (
          logs.map((item) => (
            <View
              key={item.id}
              style={{
                marginBottom: 10,
                padding: 12,
                borderRadius: 10,
                borderWidth: 0,
                borderColor: "#ddd",
              }}
            >
              <Text style={{ fontWeight: "bold" }}>
                📅 {item.date} ⏰ {item.time}
              </Text>
              <Text>🌱 Moisture: {item.moisture}%</Text>
              <Text>🌡 Temperature: {item.temperature}°C</Text>
            </View>
          ))
        )}
      </View> */}
    </ScrollView>
  );
}
