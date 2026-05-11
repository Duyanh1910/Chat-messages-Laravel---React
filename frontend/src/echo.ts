import Echo from "laravel-echo";
import Pusher from "pusher-js";

window.Pusher = Pusher;

let echo = null;

export const getEchoInstance = () => {
  if (echo) {
    return echo;
  }

  const token = localStorage.getItem("access_token");

  echo = new Echo({
    broadcaster: "reverb",

    key: import.meta.env.VITE_REVERB_APP_KEY,

    wsHost: import.meta.env.VITE_REVERB_HOST ?? window.location.hostname,

    wsPort: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),

    wssPort: Number(import.meta.env.VITE_REVERB_PORT ?? 443),

    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? "http") === "https",

    enabledTransports: ["ws", "wss"],

    authEndpoint: "http://127.0.0.1:8000/broadcasting/auth",

    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    },
  });

  return echo;
};
