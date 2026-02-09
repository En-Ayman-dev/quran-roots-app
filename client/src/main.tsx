// import { createRoot } from "react-dom/client";
// import "./index.css";
// import "./lib/vercelAnalytics";
// import App from "./App";

// createRoot(document.getElementById("root")!).render(<App />);
import { createRoot } from "react-dom/client";

// --- استيراد الخطوط المحلية (Local Fonts) ---
// 1. Amiri (للنصوص القرآنية)
import "@fontsource/amiri/400.css";
import "@fontsource/amiri/700.css";

// 2. Cairo (للواجهة العربية)
import "@fontsource/cairo/300.css";
import "@fontsource/cairo/400.css";
import "@fontsource/cairo/500.css";
import "@fontsource/cairo/600.css";
import "@fontsource/cairo/700.css";

// 3. Crimson Text (للعناوين الإنجليزية)
import "@fontsource/crimson-text/400.css";
import "@fontsource/crimson-text/600.css";

// 4. Lato (للنصوص الإنجليزية)
import "@fontsource/lato/300.css";
import "@fontsource/lato/400.css";
import "@fontsource/lato/700.css";
// ---------------------------------------------

import "./index.css";
import "./lib/vercelAnalytics";
import App from "./App";

createRoot(document.getElementById("root")!).render(<App />);