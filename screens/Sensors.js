import { useEffect, useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";

export default function Sensors() {
  const [data, setData] = useState({});

  useEffect(() => {
    const r = ref(db, "/sensors");

    onValue(r, (snap) => {
      setData(snap.val() || {});
    });
  }, []);

  return (
    <ScrollView style={{ padding: 20 }}>
      <Text style={{ fontSize: 22 }}>SENSORS</Text>

      {Object.keys(data).map((key) => (
        <View key={key} style={{ marginTop: 10 }}>
          <Text>{key}</Text>
          <Text>Moisture: {data[key]?.moisture}</Text>
          <Text>Temp: {data[key]?.temperature}</Text>
        </View>
      ))}
    </ScrollView>
  );
}