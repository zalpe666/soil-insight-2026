import "react-native-gesture-handler";
import { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, Dimensions } from "react-native";
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

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

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
          height: 70,
          paddingBottom: 12,
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
      <Tab.Screen name="Pump" component={Pump} options={{ tabBarLabel: "" }} /> 
      <Tab.Screen name="Health" component={Health} />
      <Tab.Screen name="Settings" component={Settings} />
    </Tab.Navigator>
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
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

// === SPLASH SCREEN COMPONENT ===
function SplashScreen() {
  return (
    <View style={styles.splashContainer}>
      <Image
        source={require("./assets/splash-soil-insight.jpeg")}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>Soil Insight</Text>
      <Text style={styles.subtitle}>Monitoring soil & sensor system</Text>

      <View style={styles.loadingBox}>
        <View style={styles.dot} />
        <View style={[styles.dot, styles.dotDelay]} />
        <View style={[styles.dot, styles.dotDelay2]} />
      </View>

      <Text style={styles.footer}>Loading sensor data...</Text>
      <Text style={styles.by}>by GDM</Text>
    </View>
  );
}

// === STYLES ===
const styles = StyleSheet.create({
  // Splash Styles
  splashContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  logo: {
    width: 160,
    height: 160,
    marginBottom: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#1b4332",
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 6,
    marginBottom: 20,
    textAlign: "center",
  },
  loadingBox: {
    flexDirection: "row",
    marginTop: 10,
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#1b4332",
    marginHorizontal: 4,
    opacity: 0.3,
  },
  dotDelay: { opacity: 0.6 },
  dotDelay2: { opacity: 1 },
  footer: { fontSize: 13, color: "#4b5563", marginTop: 10 },
  by: { fontSize: 12, color: "#9ca3af", marginTop: 5 },

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