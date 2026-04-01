import { type ClassValue, clsx } from "clsx";
import { compressToEncodedURIComponent } from "lz-string";
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

export async function copyShareUrl({
  placeholders,
  html,
}: {
  placeholders: PlaceholderItem[];
  html?: string;
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
    const encoded = compressToEncodedURIComponent(JSON.stringify(dataToSave));
    url.searchParams.set("ph", encoded);
  } else {
    url.searchParams.delete("ph");
  }

  if (html)
    url.searchParams.set(
      "html",
      compressToEncodedURIComponent(minifyHTML(html)),
    );

  const res = await (
    await fetch("https://url.demonkernel.io.vn/rest/v3/short-urls", {
      headers: {
        "Content-Type": " application/json",
      },
      body: `{
       "longUrl": "${url.toString()}",
       "findIfExists": true,
       "validateUrl": true
     }`,
      method: "POST",
    })
  ).json();

  navigator.clipboard.writeText(res["shortUrl"]);
}

export function minifyHTML(html: string): string {
  return html.replaceAll(/\s+/g, " ").replaceAll(/>\s+</g, "><").trim();
}
