import { StyleSheet, Platform } from "react-native";

export const COLORS = {
  background: "#F8F9FA",
  white: "#FFFFFF",
  textMain: "#2D3436",
  textSub: "#636E72",
  textMuted: "#95A5A6",
  textLight: "#B2BEC3",
  border: "#E1E1E1",

  // Warna Status Asli Anda
  success: "#2ECC71",
  warning: "#F1C40F",
  danger: "#E74C3C",
  info: "#3498DB",
  accent: "#E67E22", // Warna Orange untuk Suhu
};

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    // backgroundColor: "#ff0000", // Ubah warna latar belakang menjadi mera
    paddingHorizontal: 20,
  },

  // HEADER ASLI
  header: { marginTop: Platform.OS === "ios" ? 60 : 40, marginBottom: 25 },
  headerRow: {
    marginTop: Platform.OS === "ios" ? 60 : 40,
    marginBottom: 25,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { fontSize: 26, fontWeight: "800", color: COLORS.textMain },
  headerSubtitle: { fontSize: 14, color: COLORS.textSub, fontWeight: "500" },

  // CARD ASLI (Shadow halus 0.05)
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
  },

  // BUTTON HITAM UTAMA ASLI
  buttonMain: {
    flexDirection: "row",
    backgroundColor: COLORS.textMain,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: "800",
    letterSpacing: 1,
    marginLeft: 8,
  },

  // GLOBAL UTILS
  backBtn: { marginRight: 15, padding: 5 },
  emptyState: { alignItems: "center", marginTop: 50 },
  emptyText: { color: COLORS.textLight, marginTop: 10, fontSize: 14 },
});
