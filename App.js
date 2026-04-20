import "react-native-gesture-handler";

import { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";

import Home from "./screens/Home";
import Sensors from "./screens/Sensors";
import History from "./screens/History";
import Pump from "./screens/Pump";
import HistoryDetail from "./screens/HistoryDetail";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "Home")
            iconName = focused ? "home" : "home-outline";
          else if (route.name === "Sensors")
            iconName = focused ? "water" : "water-outline";
          else if (route.name === "History")
            iconName = focused ? "time" : "time-outline";
          else if (route.name === "Pump")
            iconName = focused ? "flash" : "flash-outline";

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#00f",
        tabBarInactiveTintColor: "#888",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 0,
        },
      })}
    >
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Sensors" component={Sensors} />
      <Tab.Screen name="History" component={History} />
      <Tab.Screen name="Pump" component={Pump} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // simulasi loading (API / Firebase nanti bisa di sini)
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

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
const styles = StyleSheet.create({
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

  dotDelay: {
    opacity: 0.6,
  },

  dotDelay2: {
    opacity: 1,
  },

  footer: {
    fontSize: 13,
    color: "#4b5563",
    marginTop: 10,
  },

  by: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 5,
  },
});
