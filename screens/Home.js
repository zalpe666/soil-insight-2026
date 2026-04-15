import { useEffect, useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";

export default function Home() {
  const [data, setData] = useState({});
  const [alert, setAlert] = useState("Loading...");

  useEffect(() => {
    const r = ref(db, "/sensors");

    onValue(r, (snap) => {
      const val = snap.val() || {};

      setData(val);

      let dry = false;

      Object.keys(val).forEach((key) => {
        const moisture = Number(val[key]?.moisture ?? 0);
        if (moisture < 40) dry = true;
      });

      setAlert(dry ? "⚠️ TANAH KERING!" : "✅ NORMAL");
    });
  }, []);

  return (
    <ScrollView style={{ padding: 20,paddingTop:100 }}>
      <Text style={{ fontSize: 22, fontWeight: "bold" }}>HOME</Text>

      <Text style={{ marginTop: 10, fontSize: 18 }}>
        Status: {alert}
      </Text>

      <Text style={{ marginTop: 20, fontSize: 20 }}>
        SENSOR DATA
      </Text>

      {Object.keys(data).map((key) => {
        const item = data[key];

        return (
          <View
            key={key}
            style={{
              marginTop: 10,
              padding: 12,
              borderWidth: 1,
              borderRadius: 8,
            }}
          >
            <Text style={{ fontWeight: "bold" }}>{key}</Text>

            <Text>🌱 Moisture: {item.moisture}</Text>
            <Text>🌡 Temperature: {item.temperature}</Text>

            <Text>📅 Date: {item.date}</Text>
            <Text>⏰ Time: {item.time}</Text>
            <Text>🕒 Timestamp: {item.timestamp}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}