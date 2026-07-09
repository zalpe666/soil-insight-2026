import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { Ionicons } from "@expo/vector-icons";

import { COLORS, globalStyles } from "../styles/theme.js";
import { ref, set, get, onValue } from "firebase/database";
// firebase
import { db } from "../firebase";

export default function Settings() {
  const [sendInterval, setSendInterval] = useState("30");
  const [pumpInterval, setPumpInterval] = useState("10");
  const [names, setNames] = useState({
    esp1: "",
    esp2: "",
    esp3: "",
    esp4: "",
    esp5: "",
    esp6: "",
  });

  // =========================================
  // LOAD STORAGE
  // =========================================

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const snapshot = await get(ref(db, "settings"));

      if (snapshot.exists()) {
        const data = snapshot.val();

        setSendInterval(String(data.send_interval ?? 30));
        setPumpInterval(String(data.pump_interval ?? 10));

        if (data.device_names) {
          setNames(data.device_names);
        }
      }
    } catch (e) {
      console.log(e);
    }
  };

  // =========================================
  // SAVE SETTINGS
  // =========================================

  const saveNames = async () => {
    try {
      await set(ref(db, "settings"), {
        send_interval: Number(sendInterval),
        pump_interval: Number(pumpInterval),
        device_names: names,
      });

      Alert.alert("Success", "Settings updated!");
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "Failed to save settings.");
    }
  };
  useEffect(() => {
    const settingsRef = ref(db, "settings");

    const unsubscribe = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();

        setSendInterval(String(data.send_interval || 30));

        if (data.device_names) {
          setNames(data.device_names);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <ScrollView style={globalStyles.container}>
      {/* HEADER */}

      <View style={globalStyles.header}>
        <Text style={globalStyles.headerTitle}>Settings</Text>

        <Text style={globalStyles.headerSubtitle}>
          Customize your device labels
        </Text>
      </View>

      {/* SETTINGS CARD */}

      <View style={globalStyles.card}>
        <Text style={styles.cardTitle}>Device Settings</Text>

        {/* INTERVAL */}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>SEND INTERVAL (MINUTES)</Text>

          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="30"
            value={sendInterval}
            onChangeText={setSendInterval}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>PUMP INTERVAL (MINUTES)</Text>

          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="10"
            value={pumpInterval}
            onChangeText={setPumpInterval}
          />
        </View>
      </View>

      {/* DEVICE NAMES */}

      <View style={globalStyles.card}>
        <Text style={styles.cardTitle}>Rename Devices</Text>

        {Object.keys(names).map((id) => (
          <View key={id} style={styles.inputGroup}>
            <Text style={styles.label}>{id.toUpperCase()}</Text>

            <TextInput
              style={styles.input}
              placeholder="Example: Garden Section"
              value={names[id]}
              onChangeText={(txt) =>
                setNames({
                  ...names,
                  [id]: txt,
                })
              }
            />
          </View>
        ))}
      </View>

      {/* SAVE BUTTON */}

      <TouchableOpacity
        style={[
          globalStyles.buttonMain,
          {
            marginTop: 20,
            marginBottom: 10,
          },
        ]}
        onPress={saveNames}
      >
        <Ionicons name="save-outline" size={20} color={COLORS.white} />

        <Text style={globalStyles.buttonText}>SAVE CHANGES</Text>
      </TouchableOpacity>

      <Text style={styles.footerNote}>
        *Settings are stored locally and synced to Firebase.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textMain,
    marginBottom: 15,
  },
  inputGroup: { marginBottom: 15 },
  label: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.textLight,
    marginBottom: 5,
  },
  input: {
    backgroundColor: "#F1F2F6",
    padding: 12,
    borderRadius: 12,
    fontSize: 14,
    color: COLORS.textMain,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  footerNote: {
    textAlign: "center",
    color: COLORS.textLight,
    fontSize: 11,
    marginBottom: 40,
  },
});
