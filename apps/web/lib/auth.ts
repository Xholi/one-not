export function saveToken(t: string) { localStorage.setItem("token", t); }
export function getToken() { return localStorage.getItem("token") ?? undefined; }
export function clearToken() { localStorage.removeItem("token"); }
