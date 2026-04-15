import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "XXX",
  authDomain: "soil-insight-2026.firebaseapp.com",
  databaseURL: "https://soil-insight-2026-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "soil-insight-2026",
};

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);