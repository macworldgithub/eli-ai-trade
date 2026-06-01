import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";
import { Toaster } from "sonner";

// Suppress ResizeObserver loop errors (common with chart libraries)
const resizeObserverErr = window.onerror;
window.onerror = (message, source, lineno, colno, error) => {
  if (message === 'ResizeObserver loop completed with undelivered notifications.' ||
      message === 'ResizeObserver loop limit exceeded') {
    return true;
  }
  if (resizeObserverErr) {
    return resizeObserverErr(message, source, lineno, colno, error);
  }
  return false;
};

// Also suppress in error event listener
window.addEventListener('error', (e) => {
  if (e.message === 'ResizeObserver loop completed with undelivered notifications.' ||
      e.message === 'ResizeObserver loop limit exceeded') {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
    <Toaster position="top-right" theme="dark" toastOptions={{ style: { background: "#0E1F36", border: "1px solid #1E3A5F", color: "#fff" } }} />
  </React.StrictMode>,
);
