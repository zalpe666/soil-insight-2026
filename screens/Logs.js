import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { getDatabase, ref, onValue } from "firebase/database";
import { Ionicons } from "@expo/vector-icons";

export default function LogsScreen({ route, navigation }) {
  const { device } = route.params;

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔥 Helper untuk format waktu (Unix Timestamp ke Jam:Menit:Detik)
  const formatFullDate = (ts) => {
    if (!ts) return "--";
    const date = new Date(Number(ts) * 1000); // Sesuaikan jika timestamp ESP dalam detik
    const d = date.toLocaleDateString("id-ID", { day: '2-digit', month: 'short' });
    const t = date.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\./g, ':');
    return `${d} • ${t}`;
  };

  useEffect(() => {
    const db = getDatabase();
    const logRef = ref(db, `/logs/${device}`);

    const unsubscribe = onValue(logRef, (snapshot) => {
      const data = snapshot.val();

      if (data) {
        const parsed = Object.keys(data).map((key) => ({
          id: key,
          message: data[key],
          time: formatFullDate(key),
        }));

        // Sort terbaru di atas
        setLogs(parsed.reverse());
      } else {
        setLogs([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [device]);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#2ECC71" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 🔥 HEADER DENGAN TOMBOL BACK */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#2D3436" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>System Logs</Text>
          <Text style={styles.headerSubtitle}>{device.toUpperCase()} Activity History</Text>
        </View>
      </View>

      {/* SUMMARY CARD */}
      <View style={styles.summaryCard}>
        <Ionicons name="terminal-outline" size={20} color="#2D3436" />
        <Text style={styles.summaryText}>Total {logs.length} events recorded</Text>
      </View>

      {/* LIST LOGS */}
      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={50} color="#BDC3C7" />
            <Text style={styles.emptyText}>No logs found for this device</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.logCard}>
            <View style={styles.logIconBox}>
              <Ionicons name="information-circle" size={18} color="#3498DB" />
            </View>
            
            <View style={styles.logBody}>
              <Text style={styles.logTime}>{item.time}</Text>
              <Text style={styles.logMessage}>{item.message}</Text>
            </View>

            {/* Indikator Titik Kecil */}
            <View style={styles.statusDot} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA", // Abu-abu sangat muda (Light Mode)
    paddingHorizontal: 20,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    marginTop: 60,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: 15,
    padding: 5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2D3436",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#636E72",
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E1E1E1",
  },
  summaryText: {
    marginLeft: 10,
    fontSize: 13,
    fontWeight: "600",
    color: "#2D3436",
  },
  logCard: {
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    elevation: 2, // Shadow Android
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  logIconBox: {
    marginTop: 2,
    marginRight: 12,
  },
  logBody: {
    flex: 1,
  },
  logTime: {
    fontSize: 11,
    fontWeight: "700",
    color: "#95A5A6",
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  logMessage: {
    fontSize: 14,
    color: "#2D3436",
    lineHeight: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#BDC3C7",
    marginTop: 5,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    color: "#BDC3C7",
    marginTop: 10,
    fontSize: 14,
  }
});