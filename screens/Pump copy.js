import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import CryptoJS from "crypto-js";

const screenWidth = Dimensions.get("window").width;

// === KREDENSIAL TUYA ===
// Catatan: Di aplikasi production, simpan ini di .env agar aman
const CLIENT_ID = "ytvju7vtnsynetf9ggqk";
const CLIENT_SECRET = "b4a114bd77e047baab123710d55f0f5a";
const DEVICE_ID = "a3d5b237bd669502c5vlif";
const BASE_URL = "https://openapi-sg.iotbing.com";

// === HELPER FUNCTION ===
const getTuyaSign = (
  clientId,
  secret,
  t,
  accessToken = "",
  method,
  path,
  body = "",
) => {
  const bodyHash = CryptoJS.SHA256(body).toString();
  const stringToSign = `${method}\n${bodyHash}\n\n${path}`;
  const signStr = clientId + accessToken + t + stringToSign;

  return CryptoJS.HmacSHA256(signStr, secret)
    .toString(CryptoJS.enc.Hex)
    .toUpperCase();
};

export default function Pump() {
  // 1. SEMUA STATE DIDEKLARASIKAN DI ATAS
  const [status, setStatus] = useState(false);
  const [deviceData, setDeviceData] = useState([]);
  const [switchState, setSwitchState] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // 2. LIFECYCLE (useEffect)
  useEffect(() => {
    // Test koneksi
    axios
      .get("https://httpbin.org/get")
      .then(() => console.log("Network OK"))
      .catch((err) => console.log("Network ERR:", err.message));

    // Ambil status awal device
    getDeviceStatus();
  }, []);

  // 3. FUNGSI API
  const getToken = async () => {
    try {
      const t = Date.now().toString();
      const method = "GET";
      const path = "/v1.0/token?grant_type=1";

      const cleanClientId = CLIENT_ID.trim();
      const cleanSecret = CLIENT_SECRET.trim();

      const sign = getTuyaSign(
        cleanClientId,
        cleanSecret,
        t,
        "",
        method,
        path,
        "",
      );

      const response = await fetch(`${BASE_URL}${path}`, {
        method: "GET",
        headers: {
          client_id: cleanClientId,
          sign: sign,
          t: t,
          sign_method: "HMAC-SHA256",
        },
      });

      if (!response.ok)
        throw new Error(`HTTP Error Status: ${response.status}`);

      const data = await response.json();
      if (!data.success)
        throw new Error(`Tuya API Error: ${data.msg} (Code: ${data.code})`);

      return data.result.access_token;
    } catch (err) {
      console.log("FETCH TOKEN ERROR:", err.message);
      throw err;
    }
  };

  const getDeviceStatus = async () => {
    try {
      const token = await getToken();
      const t = Date.now().toString();
      const path = `/v1.0/devices/${DEVICE_ID}/status`;
      const sign = getTuyaSign(
        CLIENT_ID,
        CLIENT_SECRET,
        t,
        token,
        "GET",
        path,
        "",
      );

      const res = await axios.get(`${BASE_URL}${path}`, {
        headers: {
          client_id: CLIENT_ID,
          access_token: token,
          sign,
          t,
          sign_method: "HMAC-SHA256",
        },
      });

      setDeviceData(res.data.result);

      // Cari status switch dan set ke state
      const sw = res.data.result.find((i) => i.code === "switch_1");
      if (sw) {
        setSwitchState(sw.value);
        setStatus(sw.value); // Sinkronisasi status animasi utama dengan status aslinya
      }
    } catch (err) {
      console.log("GET STATUS ERROR:", err.message);
    }
  };

  const controlPump = async (newValue) => {
    try {
      const token = await getToken();
      const t = Date.now().toString();
      const bodyObj = {
        commands: [{ code: "switch_1", value: newValue }],
      };
      const bodyStr = JSON.stringify(bodyObj);
      const method = "POST";
      const path = `/v1.0/devices/${DEVICE_ID}/commands`;

      const sign = getTuyaSign(
        CLIENT_ID,
        CLIENT_SECRET,
        t,
        token,
        method,
        path,
        bodyStr,
      );

      await axios.post(`${BASE_URL}${path}`, bodyStr, {
        headers: {
          client_id: CLIENT_ID,
          access_token: token,
          sign: sign,
          t: t,
          sign_method: "HMAC-SHA256",
          "Content-Type": "application/json",
        },
      });

      // Update UI jika API sukses merespon
      setStatus(newValue);
      setSwitchState(newValue); // Sinkronkan juga badge status di bawah
      console.log(`Pump status updated to: ${newValue}`);
    } catch (err) {
      console.log("CONTROL PUMP ERROR:", err.response?.data || err.message);
    }
  };

  // 4. RENDER UI
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Pump Control</Text>
          <Text style={styles.headerSubtitle}>Manual Irrigation System</Text>
        </View>

        {/* MAIN VISUAL CARD */}
        <View style={styles.visualCard}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: status ? "#E3F2FD" : "#F5F5F5" },
            ]}
          >
            <Ionicons
              name={status ? "water" : "water-outline"}
              size={80}
              color={status ? "#3498DB" : "#BDC3C7"}
            />
          </View>

          <View style={styles.statusInfo}>
            <Text style={styles.statusLabel}>PUMP STATUS</Text>
            <Text
              style={[
                styles.statusValue,
                { color: status ? "#2ECC71" : "#E74C3C" },
              ]}
            >
              {status ? "RUNNING" : "STANDBY"}
            </Text>
          </View>

          {/* INDICATOR DOT */}
          <View
            style={[
              styles.dot,
              { backgroundColor: status ? "#2ECC71" : "#BDC3C7" },
            ]}
          />
        </View>

        {/* INFORMATION CARD */}
        <View style={styles.infoBox}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color="#636E72"
          />
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
            onPress={() => controlPump(!status)}
            style={[
              styles.mainButton,
              { backgroundColor: status ? "#E74C3C" : "#2ECC71" },
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

        {/* DEVICE STATUS CARD (DROPDOWN/ACCORDION) */}
        <View style={styles.deviceStatusCard}>
          {/* HEADER SEBAGAI TOMBOL */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.deviceStatusHeader}
            onPress={() => setIsExpanded(!isExpanded)}
          >
            {/* Bagian Kiri (Ikon & Judul) */}
            <View style={styles.headerLeft}>
              <Ionicons
                name="hardware-chip-outline"
                size={20}
                color="#636E72"
              />
              <Text style={styles.deviceStatusTitle}>DEVICE STATUS</Text>
            </View>

            {/* Bagian Kanan (Ikon Panah) */}
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color="#B2BEC3"
            />
          </TouchableOpacity>

          {/* KONTEN DROPDOWN (Hanya Tampil Jika isExpanded === true) */}
          {isExpanded && (
            <View style={styles.expandedContent}>
              {deviceData.map((item, index) => (
                <View
                  key={index}
                  style={[
                    styles.statusRow,
                    index === deviceData.length - 1 && styles.lastRow,
                  ]}
                >
                  <Text style={styles.statusCode}>{item.code}</Text>
                  <Text style={styles.statusValueText}>
                    {String(item.value)}
                  </Text>
                </View>
              ))}

              {/* SWITCH STATUS */}
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>MAIN SWITCH</Text>
                <View
                  style={[
                    styles.switchBadge,
                    { backgroundColor: switchState ? "#E8F8F5" : "#FDEDEC" },
                  ]}
                >
                  <Text
                    style={[
                      styles.switchBadgeText,
                      { color: switchState ? "#2ECC71" : "#E74C3C" },
                    ]}
                  >
                    {switchState ? "ON" : "OFF"}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 25,
    paddingBottom: 40,
  },
  header: {
    marginTop: 40,
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
    position: "relative",
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
    position: "absolute",
    top: 20,
    right: 20,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#DFE6E9",
    padding: 15,
    borderRadius: 15,
    marginTop: 25,
    alignItems: "center",
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    color: "#636E72",
    lineHeight: 18,
  },
  buttonWrapper: {
    marginTop: 30,
    marginBottom: 20,
  },
  mainButton: {
    flexDirection: "row",
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
    textAlign: "center",
    color: "#B2BEC3",
    fontSize: 12,
    marginTop: 15,
    fontWeight: "500",
  },
  // STYLES UNTUK DEVICE STATUS CARD (DROPDOWN) - LEBIH RAPI DAN MODERN
  // --- STYLE UNTUK DEVICE STATUS ---
  deviceStatusCard: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 25,
    marginTop: 15,
    marginBottom: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 15,
  },
  deviceStatusHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // Mendorong elemen ke kiri dan kanan
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  deviceStatusTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#B2BEC3",
    letterSpacing: 1.5,
    marginLeft: 8,
  },
  expandedContent: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#F1F2F6", // Garis pemisah pindah ke sini agar rapi saat ditutup
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F8F9FA",
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  statusCode: {
    color: "#636E72",
    fontSize: 14,
    fontWeight: "500",
  },
  statusValueText: {
    color: "#2D3436",
    fontSize: 15,
    fontWeight: "800",
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#F1F2F6",
  },
  switchLabel: {
    color: "#2D3436",
    fontSize: 14,
    fontWeight: "700",
  },
  switchBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  switchBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
