import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// START DEBUGGING BLOCK
const requiredEnvVars = [
    "VITE_FIREBASE_API_KEY",
    "VITE_FIREBASE_AUTH_DOMAIN",
    "VITE_FIREBASE_PROJECT_ID",
];

const missingVars = requiredEnvVars.filter(
    (key) => !import.meta.env[key]
);

if (missingVars.length > 0) {
    console.error("Missing Environment Variables:", missingVars);
    document.body.innerHTML = `
    <div style="color: white; background: #990000; padding: 20px; font-family: sans-serif;">
      <h1>Configuration Error</h1>
      <p>The following environment variables are missing:</p>
      <ul>${missingVars.map((v) => `<li>${v}</li>`).join("")}</ul>
      <p>Please add them to your Vercel Project Settings.</p>
    </div>
  `;
} else {
    try {
        createRoot(document.getElementById("root")!).render(<App />);
    } catch (error) {
        console.error("Application Crash:", error);
        document.body.innerHTML = `
      <div style="color: white; background: #990000; padding: 20px; font-family: sans-serif;">
        <h1>Application Failed to Start</h1>
        <pre>${error instanceof Error ? error.message : String(error)}</pre>
      </div>
    `;
    }
}
// END DEBUGGING BLOCK

