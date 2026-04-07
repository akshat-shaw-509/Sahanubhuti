/* Shared frontend runtime config for local and deployed environments. */

(function initRuntimeConfig() {
  const metaApiUrl = document
    .querySelector('meta[name="sahanubhuti-api-url"]')
    ?.getAttribute("content")
    ?.trim();

  const localOverride = localStorage.getItem("sahanubhuti_api_url")?.trim();
  const host = window.location.hostname;
  const isLocalHost =
    host === "127.0.0.1" ||
    host === "localhost" ||
    host === "";

  let apiUrl =
    window.SAHANUBHUTI_API_URL ||
    metaApiUrl ||
    localOverride ||
    "";

  if (!apiUrl) {
    if (isLocalHost) {
      apiUrl = "http://127.0.0.1:5000/api";
    } else if (!host.endsWith("github.io")) {
      apiUrl = `${window.location.origin}/api`;
    }
  }

  window.SAHANUBHUTI_CONFIG = {
    API_URL: apiUrl.replace(/\/+$/, ""),
    IS_PRODUCTION_STATIC_FRONTEND: host.endsWith("github.io"),
  };
})();
