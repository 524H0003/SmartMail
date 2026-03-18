import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function encodeData(data: object) {
  const json = JSON.stringify(data);

  return btoa(
    encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (match, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    }),
  );
}

export function decodeData(base64: string) {
  try {
    const json = decodeURIComponent(
      Array.prototype.map
        .call(atob(base64), (c) => {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join(""),
    );
    return JSON.parse(json);
  } catch {
    /* empty */
  }
}
