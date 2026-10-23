// PASTE your Firebase web app config here (Firebase console > Project settings > Your apps > Web app).
// This config is public by design; real protection comes from firestore.rules.
export const firebaseConfig = {
  apiKey: "PASTE_API_KEY",
  authDomain: "PASTE_PROJECT_ID.firebaseapp.com",
  projectId: "PASTE_PROJECT_ID",
  storageBucket: "PASTE_PROJECT_ID.appspot.com",
  messagingSenderId: "PASTE_SENDER_ID",
  appId: "PASTE_APP_ID"
};
// WebRTC servers. STUN alone fails on many mobile/strict networks: add a TURN server from your provider.
// Anything placed here is visible to every visitor, so use limited/rotating credentials. Never invent values.
export const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" }
  // , { urls: "turn:YOUR_TURN_HOST:3478", username: "YOUR_TURN_USER", credential: "YOUR_TURN_CREDENTIAL" }
];
