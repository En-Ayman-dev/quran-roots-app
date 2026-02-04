import { createRoot } from "react-dom/client";
import "./index.css";
import "./lib/vercelAnalytics";
import App from "./App";

createRoot(document.getElementById("root")!).render(<App />);
