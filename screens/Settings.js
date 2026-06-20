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

// firebase
import { ref, set } from "firebase/database";
import { db } from "../firebase";

export default function Settings() {
  const [sendInterval, setSendInterval] = useState("30");

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
      const namesStorage = await AsyncStorage.getItem("esp_names");

      if (namesStorage) {
        setNames(JSON.parse(namesStorage));
      }

      const intervalStorage = await AsyncStorage.getItem("send_interval");

      if (intervalStorage) {
        setSendInterval(intervalStorage);
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
      console.log("Saving interval:", sendInterval);

      await set(ref(db, "settings/send_interval"), Number(sendInterval));

      console.log("Firebase saved!");

      Alert.alert("Success", "Settings updated!");
    } catch (e) {
      console.log("Firebase Error:", e);
    }
  };

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
