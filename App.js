import "react-native-gesture-handler";
import React, { useEffect, useState, useRef } from "react";
import { View, Text, Image, StyleSheet, Animated } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";

// === IMPORT SCREENS ===
import Home from "./screens/Home";
import Health from "./screens/Health"; // Pengganti Sensors
import History from "./screens/History";
import Pump from "./screens/Pump";
import Settings from "./screens/Settings"; 
import HistoryDetail from "./screens/HistoryDetail";
import Logs from "./screens/Logs";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// === TAB NAVIGATION ===
function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: "#2ECC71", // Hijau IoT
        tabBarInactiveTintColor: "#BDC3C7",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopWidth: 0,
          height: 80,
          paddingBottom: 20,
          paddingTop: 8,
          elevation: 10,
          bottom: 0,
          left: 0,
          right: 0
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "Home") iconName = focused ? "home" : "home-outline";
          else if (route.name === "History") iconName = focused ? "stats-chart" : "stats-chart-outline";
          else if (route.name === "Pump") iconName = focused ? "water" : "water-outline";
          else if (route.name === "Health") iconName = focused ? "shield-checkmark" : "shield-checkmark-outline";
          else if (route.name === "Settings") iconName = focused ? "settings" : "settings-outline";

          // Khusus Tombol Pump di Tengah agar lebih besar
          if (route.name === "Pump") {
            return (
              <View style={styles.centerTab}>
                <Ionicons name={iconName} size={30} color="#FFF" />
              </View>
            );
          }

          return <Ionicons name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="History" component={History} />
      {/* Tab Pump dibuat kosong labelnya karena sudah ada icon besar */}
      <Tab.Screen name="Pump" component={Pump} options={{ tabBarLabel: "Pump" }} /> 
      <Tab.Screen name="Health" component={Health} />
      <Tab.Screen name="Settings" component={Settings} />
    </Tab.Navigator>
  );
}

// === SPLASH SCREEN COMPONENT ===
function SplashScreen() {
  // Setup nilai awal animasi
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // 1. Animasi Fade In & Slide Up untuk konten utama (dioptimalkan untuk performa native)
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();

    // 2. Animasi Pulsing untuk titik loading berurutan
    const animateDot = (dot, delay) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            delay: delay,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    animateDot(dot1, 0);
    animateDot(dot2, 200);
    animateDot(dot3, 400);
  }, [fadeAnim, slideAnim, dot1, dot2, dot3]);

  return (
    <View style={styles.splashContainer}>
      <View style={styles.spacer} />

      {/* Area Konten Utama */}
      <Animated.View 
        style={[
          styles.mainContent, 
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}
      >
        <View style={styles.logoWrapper}>
          <Image
            source={require("./assets/splash-soil-insight.jpeg")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.title}>Soil Insight</Text>
        <Text style={styles.subtitle}>Monitoring soil & sensor system</Text>

        <View style={styles.loadingBox}>
          <Animated.View style={[styles.dot, { opacity: dot1 }]} />
          <Animated.View style={[styles.dot, { opacity: dot2 }]} />
          <Animated.View style={[styles.dot, { opacity: dot3 }]} />
        </View>
      </Animated.View>

      {/* Area Footer */}
      <Animated.View style={[styles.footerContainer, { opacity: fadeAnim }]}>
        <Text style={styles.footerText}>Loading sensor data...</Text>
        <Text style={styles.byText}>by GDM</Text>
      </Animated.View>
    </View>
  );
}

// === MAIN APP ===
export default function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500); // Tampilkan splash selama 2.5 detik
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Tabs" component={Tabs} />
          <Stack.Screen name="HistoryDetail" component={HistoryDetail} />
          <Stack.Screen name="Logs" component={Logs} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

// === STYLES ===
const styles = StyleSheet.create({
  // Splash Styles
  splashContainer: {
    flex: 1,
    backgroundColor: "#F8FAF8", 
    justifyContent: "space-between",
    alignItems: "center",
  },
  spacer: {
    flex: 1,
  },
  mainContent: {
    flex: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  logoWrapper: {
    padding: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    shadowColor: "#1b4332",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5, 
    marginBottom: 24,
  },
  logo: {
    width: 140,
    height: 140,
    borderRadius: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1b4332",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    color: "#6b7280",
    marginTop: 8,
    marginBottom: 28,
    fontWeight: "500",
  },
  loadingBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2ECC71", 
    marginHorizontal: 5,
  },
  footerContainer: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 40, 
  },
  footerText: { 
    fontSize: 13, 
    color: "#4b5563", 
    fontWeight: "500",
  },
  byText: { 
    fontSize: 12, 
    color: "#9ca3af", 
    marginTop: 6,
    fontWeight: "700",
    letterSpacing: 1,
  },

  // Tab Styles
  centerTab: {
    width: 60,
    height: 60,
    backgroundColor: "#2ECC71",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 35,
    elevation: 8,
    shadowColor: "#2ECC71",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 4,
    borderColor: '#FFF'
  },
});