import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getBasepath = (): string | undefined => {
  if (typeof window === "undefined") {
    return undefined;
  }
  const pathname = window.location.pathname;
  const matchApp = pathname.match(/^(.*\/app)(?:\/|$)/);
  if (matchApp) {
    return matchApp[1]; // e.g. '/subtitle-sync/app' or '/app'
  }
  // Support GitHub Pages deployment at repo root e.g. '/subtitle-sync'
  if (window.location.hostname.endsWith("github.io")) {
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length > 0) {
      return `/${parts[0]}`;
    }
  }
  return undefined;
};

export const getRouter = () => {
  const queryClient = new QueryClient();

  if (typeof window !== "undefined") {
    // If URL ends with index.html, strip index.html but keep trailing slash
    if (window.location.pathname.endsWith("/index.html")) {
      const cleanPath = window.location.pathname.replace(/index\.html$/, "");
      const newUrl = cleanPath + window.location.search + window.location.hash;
      window.history.replaceState(null, "", newUrl);
    }
    // If we're at basepath without trailing slash (e.g. /subtitle-sync or /subtitle-sync/app), normalize with trailing slash
    const base = getBasepath();
    if (base && window.location.pathname === base) {
      window.history.replaceState(
        null,
        "",
        base + "/" + window.location.search + window.location.hash,
      );
    }
  }

  const basepath = getBasepath();
  const router = createRouter({
    routeTree,
    basepath,
    context: { queryClient },
    scrollRestoration: false,
    defaultPreloadStaleTime: 0,
  });

  const origUpdate = router.update.bind(router);
  router.update = (newOptions: any) => {
    if (newOptions) {
      if (basepath) {
        newOptions.basepath = basepath;
      } else if (newOptions.basepath === ".") {
        newOptions.basepath = undefined;
      }
    }
    return origUpdate(newOptions);
  };

  return router;
};
