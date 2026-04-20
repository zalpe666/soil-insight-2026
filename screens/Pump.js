import { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";

export default function Pump() {
  const [status, setStatus] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: "#f5f7fb", padding: 16, paddingTop: 60 }}>
      
      <Text style={{ fontSize: 24, fontWeight: "bold", color: "#111" }}>
        ⚡ Pump Control
      </Text>

      <Text style={{ color: "#666", marginBottom: 20 }}>
        Manual irrigation system
      </Text>

      {/* STATUS CARD */}
      <View
        style={{
          backgroundColor: "#fff",
          padding: 20,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: "#e5e7eb",
          marginBottom: 20,
        }}
      >
        <Text style={{ color: "#666" }}>PUMP STATUS</Text>

        <Text
          style={{
            fontSize: 26,
            fontWeight: "bold",
            marginTop: 8,
            color: status ? "#34c759" : "#ff3b30",
          }}
        >
          {status ? "ON" : "OFF"}
        </Text>
      </View>

      {/* BUTTON */}
      <TouchableOpacity
        onPress={() => setStatus(!status)}
        style={{
          backgroundColor: status ? "#ff3b30" : "#34c759",
          padding: 16,
          borderRadius: 14,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>
          {status ? "TURN OFF" : "TURN ON"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}