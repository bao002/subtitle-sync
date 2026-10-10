import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";
import "./styles.css";

const router = getRouter();

// Startup signals read by the Android e2e test (scripts/android-e2e-assert.sh) via logcat.
window.addEventListener("error", (e) => console.error("[APP_BOOT_ERROR]", e.message));
window.addEventListener("unhandledrejection", (e) =>
  console.error("[APP_BOOT_ERROR]", String(e.reason)),
);

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
  let tries = 0;
  const checkReady = () => {
    const errorComponent =
      rootElement.querySelector("[data-testid='router-error-component']") ||
      (rootElement.textContent && rootElement.textContent.includes("This page didn't load"));
    if (errorComponent) {
      console.error("[APP_BOOT_ERROR] Application rendered error boundary: This page didn't load");
      return;
    }
    if (rootElement.childElementCount > 0) console.log("[APP_READY]", location.href);
    else if (++tries < 100) setTimeout(checkReady, 100);
    else console.error("[APP_BOOT_ERROR] root stayed empty");
  };
  setTimeout(checkReady, 0);
} else {
  console.error("[APP_BOOT_ERROR] #root element missing");
}
