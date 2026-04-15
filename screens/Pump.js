import { useState } from "react";
import { View, Text, Button } from "react-native";

export default function Pump() {
  const [status, setStatus] = useState(false);

  return (
    <View style={{ padding: 20 }}>
      <Text>PUMP</Text>
      <Text>Status: {status ? "ON" : "OFF"}</Text>

      <Button title="Toggle" onPress={() => setStatus(!status)} />
    </View>
  );
}