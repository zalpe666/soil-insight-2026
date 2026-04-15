import 'react-native-gesture-handler';

import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import Home from "./screens/Home";
import Sensors from "./screens/Sensors";
import History from "./screens/History";
import Pump from "./screens/Pump";

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Tab.Navigator screenOptions={{ headerShown: false }}>
          <Tab.Screen name="Home" component={Home} />
          <Tab.Screen name="Sensors" component={Sensors} />
          <Tab.Screen name="History" component={History} />
          <Tab.Screen name="Pump" component={Pump} />
        </Tab.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}