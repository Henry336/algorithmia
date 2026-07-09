const ADMIN_KEY = "algorithimia-admin-mode";

export function syncAdminModeFromUrl() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("admin") === "1") {
    localStorage.setItem(ADMIN_KEY, "1");
  } else if (params.get("admin") === "0") {
    localStorage.removeItem(ADMIN_KEY);
  }
  document.body.classList.toggle("admin-mode", isAdminMode());
}

export function isAdminMode() {
  const params = new URLSearchParams(window.location.search);
  return params.get("admin") === "1" || localStorage.getItem(ADMIN_KEY) === "1";
}
