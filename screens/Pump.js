import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const screenWidth = Dimensions.get("window").width;

export default function Pump() {
  const [status, setStatus] = useState(false);

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pump Control</Text>
        <Text style={styles.headerSubtitle}>Manual Irrigation System</Text>
      </View>

      {/* MAIN VISUAL CARD */}
      <View style={styles.visualCard}>
        <View style={[styles.iconCircle, { backgroundColor: status ? "#E3F2FD" : "#F5F5F5" }]}>
          <Ionicons 
            name={status ? "water" : "water-outline"} 
            size={80} 
            color={status ? "#3498DB" : "#BDC3C7"} 
          />
        </View>
        
        <View style={styles.statusInfo}>
          <Text style={styles.statusLabel}>PUMP STATUS</Text>
          <Text style={[styles.statusValue, { color: status ? "#2ECC71" : "#E74C3C" }]}>
            {status ? "RUNNING" : "STANDBY"}
          </Text>
        </View>

        {/* INDICATOR DOT */}
        <View style={[styles.dot, { backgroundColor: status ? "#2ECC71" : "#BDC3C7" }]} />
      </View>

      {/* INFORMATION CARD */}
      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={20} color="#636E72" />
        <Text style={styles.infoText}>
          {status 
            ? "Pump is currently active. Ensure the water source is sufficient." 
            : "Pump is idle. Tap the button below to start irrigation."}
        </Text>
      </View>

      {/* MAIN ACTION BUTTON */}
      <View style={styles.buttonWrapper}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setStatus(!status)}
          style={[
            styles.mainButton,
            { backgroundColor: status ? "#E74C3C" : "#2ECC71" }
          ]}
        >
          <Ionicons 
            name={status ? "stop-circle-outline" : "play-circle-outline"} 
            size={24} 
            color="#FFF" 
          />
          <Text style={styles.buttonText}>
            {status ? "STOP PUMPING" : "START PUMPING"}
          </Text>
        </TouchableOpacity>
        
        <Text style={styles.footerNote}>
          Manual control will override automatic schedules.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 25,
  },
  header: {
    marginTop: 70,
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#2D3436",
  },
  headerSubtitle: {
    fontSize: 15,
    color: "#636E72",
    fontWeight: "500",
  },
  visualCard: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 30,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 15,
    position: 'relative',
  },
  iconCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  statusInfo: {
    alignItems: "center",
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#B2BEC3",
    letterSpacing: 1.5,
  },
  statusValue: {
    fontSize: 32,
    fontWeight: "900",
    marginTop: 5,
  },
  dot: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: "#DFE6E9",
    padding: 15,
    borderRadius: 15,
    marginTop: 25,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    color: "#636E72",
    lineHeight: 18,
  },
  buttonWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
    marginBottom: 50,
  },
  mainButton: {
    flexDirection: 'row',
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "800",
    marginLeft: 10,
    letterSpacing: 1,
  },
  footerNote: {
    textAlign: 'center',
    color: '#B2BEC3',
    fontSize: 12,
    marginTop: 15,
    fontWeight: '500'
  }
});