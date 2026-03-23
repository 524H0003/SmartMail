import { clsx, type ClassValue } from "clsx";
import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";
import { twMerge } from "tailwind-merge";

export type TypeValue = "multi" | "single";

export interface PlaceholderItem {
  fieldName: string;
  type: TypeValue;
  colSpan: number;
  original: string;
  defaultValue: string;
  currentValue: string;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function encodeData(data: object) {
  const json = JSON.stringify(data);

  return btoa(
    encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_match, p1) => {
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
  } catch (e) {
    console.log(e);
  }
}

export function copyShareUrl({
  placeholders,
}: {
  placeholders: PlaceholderItem[];
}) {
  const dataToSave = placeholders.reduce(
    (acc, item) => {
      if (item.currentValue !== item.defaultValue) {
        acc[item.fieldName] = item.currentValue;
      }
      return acc;
    },
    {} as Record<string, string>,
  );

  const url = new URL(window.location.href);

  if (Object.keys(dataToSave).length > 0) {
    const encoded = encodeData(dataToSave);
    url.searchParams.set("ph", encoded);
  } else {
    url.searchParams.delete("ph");
  }

  navigator.clipboard.writeText(url.toString());
}

export const compressTemplate = (html: string): string => {
  return compressToEncodedURIComponent(html);
};

export const decompressTemplate = (compressed: string): string => {
  try {
    const decompressed = decompressFromEncodedURIComponent(compressed);
    return decompressed || "";
  } catch (error) {
    console.error("Lỗi giải nén:", error);
    return "";
  }
};

export function minifyHTML(html: string): string {
  return html.replaceAll(/\s+/g, " ").replaceAll(/>\s+</g, "><").trim();
}
