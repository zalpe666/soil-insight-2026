import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, SafeAreaView } from "react-native";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";

// Sesuaikan path import ini dengan struktur folder kamu
import { globalStyles, COLORS } from "../styles/theme";

export default function PumpMonitoring() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const logsRef = ref(db, "/pump_logs");

    return onValue(logsRef, (snapshot) => {
      const data = snapshot.val() || {};

      const arr = Object.entries(data).map(([id, value]) => ({
        id,
        ...value,
      }));

      arr.sort((a, b) => b.timestamp - a.timestamp);

      setLogs(arr);
    });
  }, []);

  const renderItem = ({ item }) => {
    const time = new Date(item.timestamp);
    const isSuccess = item.success;

    return (
      <View style={globalStyles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.action}>{item.action}</Text>
          <Text
            style={[
              styles.status,
              { color: isSuccess ? COLORS.success : COLORS.danger },
            ]}
          >
            {isSuccess ? "SUCCESS" : "FAILED"}
          </Text>
        </View>

        <View style={styles.detailsContainer}>
          <Text style={styles.detailText}>
            Moisture : <Text style={styles.boldText}>{item.moisture}%</Text>
          </Text>
          <Text style={styles.detailText}>
            Mode : <Text style={styles.boldText}>{item.source}</Text>
          </Text>
        </View>

        <Text style={styles.timestamp}>
          {time.toLocaleString("id-ID", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={globalStyles.container}>
        <View style={globalStyles.header}>
          <Text style={globalStyles.headerTitle}>Pump Logs</Text>
          <Text style={globalStyles.headerSubtitle}>
            Riwayat aktivitas pompa air
          </Text>
        </View>

        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listPadding}
        />
      </View>
    </SafeAreaView>
  );
}

// Local styles hanya untuk komponen spesifik di dalam halaman ini
const styles = StyleSheet.create({
  listPadding: {
    paddingBottom: 20,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  action: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.textMain,
    textTransform: "capitalize",
  },
  status: {
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  detailsContainer: {
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.textSub,
    marginBottom: 4,
  },
  boldText: {
    color: COLORS.textMain,
    fontWeight: "600",
  },
  timestamp: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: "right",
    fontStyle: "italic",
  },
});
