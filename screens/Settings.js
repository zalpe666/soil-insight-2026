import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

export default function Settings() {
  const [names, setNames] = useState({
    esp1: "", esp2: "", esp3: "", esp4: "", esp5: "", esp6: ""
  });

  useEffect(() => {
    loadNames();
  }, []);

  const loadNames = async () => {
    try {
      const savedNames = await AsyncStorage.getItem("esp_names");
      if (savedNames) setNames(JSON.parse(savedNames));
    } catch (e) { console.log(e); }
  };

  const saveNames = async () => {
    try {
      await AsyncStorage.setItem("esp_names", JSON.stringify(names));
      Alert.alert("Success", "Device names updated locally!");
    } catch (e) { Alert.alert("Error", "Failed to save names."); }
  };

  const updateName = (key, val) => {
    setNames({ ...names, [key]: val });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>Customize your device labels</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Rename Devices</Text>
        {Object.keys(names).map((id) => (
          <View key={id} style={styles.inputGroup}>
            <Text style={styles.label}>{id.toUpperCase()}</Text>
            <TextInput
              style={styles.input}
              placeholder={`Example: Garden Section...`}
              value={names[id]}
              onChangeText={(txt) => updateName(id, txt)}
            />
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={saveNames}>
        <Ionicons name="save-outline" size={20} color="#FFF" />
        <Text style={styles.saveBtnText}>SAVE CHANGES</Text>
      </TouchableOpacity>
      
      <Text style={styles.footerNote}>*Names are stored locally on this device.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA", paddingHorizontal: 20 },
  header: { marginTop: 60, marginBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: "800", color: "#2D3436" },
  headerSubtitle: { fontSize: 14, color: "#636E72" },
  card: { backgroundColor: "#FFF", borderRadius: 20, padding: 20, elevation: 3 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#2D3436", marginBottom: 15 },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 11, fontWeight: "800", color: "#B2BEC3", marginBottom: 5 },
  input: { 
    backgroundColor: "#F1F2F6", 
    padding: 12, 
    borderRadius: 12, 
    fontSize: 14, 
    color: "#2D3436",
    borderWidth: 1,
    borderColor: "#E1E1E1"
  },
  saveBtn: { 
    backgroundColor: "#2D3436", 
    flexDirection: 'row', 
    padding: 16, 
    borderRadius: 15, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 20,
    marginBottom: 10
  },
  saveBtnText: { color: "#FFF", fontWeight: "800", marginLeft: 10, letterSpacing: 1 },
  footerNote: { textAlign: 'center', color: '#B2BEC3', fontSize: 11, marginBottom: 40 }
});