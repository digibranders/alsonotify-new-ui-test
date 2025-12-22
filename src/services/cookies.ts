import Cookies from "universal-cookie";

export const setToken = (token: string) => {
  const cookies = new Cookies();
  cookies.set("_token", token, { path: "/", secure: false }); // Set secure: true in production with HTTPS
};

export const getToken = () => {
  const cookies = new Cookies();
  const token = cookies.get("_token");
  return token;
};

export const deleteToken = () => {
  const cookies = new Cookies();
  cookies.remove("_token", { path: "/" });
  return true;
};

