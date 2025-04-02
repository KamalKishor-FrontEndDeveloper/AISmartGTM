import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Set page title
document.title = "AI-Powered CRM System";

// Add meta description
const metaDescription = document.createElement('meta');
metaDescription.name = 'description';
metaDescription.content = 'Generate real-time B2B leads, get enriched contact data, and send AI-powered personalized outreach messages in one place.';
document.head.appendChild(metaDescription);

createRoot(document.getElementById("root")!).render(<App />);
