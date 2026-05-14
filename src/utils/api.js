const BASE = "https://gpt1-production-ba3b.up.railway.app";

export function api(path, options) {
  return fetch(`${BASE}${path}`, options);
}
