import Cookies from "universal-cookie";

export const setToken = (token: string) => {
  const cookies = new Cookies();
  // Enable secure flag only when served over HTTPS (production)
  // This preserves local dev on http://localhost
  const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
  cookies.set("_token", token, { path: "/", secure: isSecure, sameSite: "lax" });
};

export const getToken = () => {
  const cookies = new Cookies();
  const token = cookies.get("_token");
  return token;
};

export const deleteToken = () => {
  const cookies = new Cookies();
  cookies.remove("_token", { path: "/", sameSite: "lax" });
  return true;
};

