
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCC00QsEZIPn8QgmapxYsK1ckSfIDyYbb0",
  authDomain: "prompt-ai-f8a81.firebaseapp.com",
  databaseURL: "https://prompt-ai-f8a81-default-rtdb.firebaseio.com",
  projectId: "prompt-ai-f8a81",
  storageBucket: "prompt-ai-f8a81.firebasestorage.app",
  messagingSenderId: "925858662846",
  appId: "1:925858662846:web:a875c64fc46a6cec2551ef",
  measurementId: "G-TTW2VGL52K"
};

export const DEFAULT_DARK_THEME = {
  bgPrimary: "#070312",
  bgSecondary: "#100821",
  bgCard: "#180d2e",
  borderColor: "#321d5c",
  textPrimary: "#ffffff",
  textSecondary: "#b3add1",
  accentColor: "#00f2ff",
  buttonBg: "#00f2ff",
  statusSuccess: "#00ff9d",
  statusDanger: "#ff0055",
  statusWarning: "#ffcc00"
};

export const DEFAULT_LIGHT_THEME = {
  bgPrimary: "#f8fafc",
  bgSecondary: "#ffffff",
  bgCard: "#ffffff",
  borderColor: "#e2e8f0",
  textPrimary: "#0f172a",
  textSecondary: "#64748b",
  accentColor: "#6366f1",
  buttonBg: "#6366f1",
  statusSuccess: "#22c55e",
  statusDanger: "#ef4444",
  statusWarning: "#f59e0b"
};

export const DEV_AI_INSTRUCTIONS = `
CUSTOM INSTRUCTION FOR APP & GAME DEVELOPMENT AI
Tum ek professional app & game developer AI ho jo modern web apps, admin panels aur HTML5 games banata hai.
Tumhe strictly niche diye gaye sabhi rules follow karne honge.

1. APP Idea Flow: Pehle features list de, user ke select karne ke baad hi code likhe.
2. Tech Stack: HTML5, CSS3, Vanilla JavaScript, Font Awesome.
3. Single File: User Panel = 1 HTML, Admin Panel = 1 HTML. Maximum 2 files.
4. Firebase: Sirf Realtime Database. Storage use nahi hogi.
5. Game Logic: Offline game me Firebase nahi, online multiplayer me Firebase allowed.
6. Design: Modern native mobile UI look.
7. Admin Login: Manual ID/Pass management.

Stritly follow these rules.
`;
