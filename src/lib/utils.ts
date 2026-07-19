import { type ClassValue, clsx } from "clsx";
import { html as beautifyHtml } from "js-beautify";
import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";
import { twMerge } from "tailwind-merge";

export type TypeValue = "multi" | "single" | "text" | "media";

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

export async function urlShortener(url: string) {
  const response = await fetch("/api/shorten", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      longUrl: url,
    }),
  });

  const res = await response.json<{ shortUrl: string }>();

  return res.shortUrl;
}

export async function copyShareUrl({
  placeholders,
  html,
}: {
  placeholders: PlaceholderItem[];
  html?: string;
  apiToken?: string;
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

  navigator.clipboard.writeText(await urlShortener(url.toString()));
}

export function minifyHTML(html: string): string {
  return html.replaceAll(/\s+/g, " ").replaceAll(/>\s+</g, "><").trim();
}

export function getSavedValues(): Record<string, string> | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const encodedData = params.get("ph") || params.get("data");
  if (!encodedData) return null;
  try {
    return JSON.parse(decompressFromEncodedURIComponent(encodedData));
  } catch {
    return null;
  }
}

export function extractPlaceholders(
  text: string,
  currentValues: Map<string, string>,
  savedValues: Record<string, string> | null,
): PlaceholderItem[] {
  const regex = /%={([\s\S]+?)\|([\s\S]*?)\|([\s\S]*?)\|(\d+)}/g;
  const resultMap = new Map<string, PlaceholderItem>();
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const fieldName = match[1];
    const tag = match[2];
    const defaultValue = match[3];
    const colSpan = Number(match[4]) || 12;

    if (!resultMap.has(fieldName)) {
      let type: TypeValue = "multi";
      if (tag === "1") type = "single";
      if (tag === "3") type = "text";
      if (tag === "4") type = "media";

      const valueToKeep =
        currentValues.get(fieldName) ??
        savedValues?.[fieldName] ??
        defaultValue;

      resultMap.set(fieldName, {
        fieldName,
        type,
        colSpan,
        original: match[0],
        defaultValue,
        currentValue: valueToKeep.replace(/\s+/g, " "),
      });
    }
  }
  return Array.from(resultMap.values());
}

export async function uploadMedia(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload file to R2");
  }

  const { publicUrl } = await response.json<{ publicUrl: string }>();

  return publicUrl;
}

export async function copyMailToClipboard(mailHtml: string): Promise<void> {
  let finalHtml = mailHtml;

  try {
    const urlRegex =
      /(?:href|src|background)="([^"]+)"|url\((?:"|['"]?)([^&'")]+)(?:"|['"]?)\)/g;
    const matches = [...mailHtml.matchAll(urlRegex)];
    const uniqueUrls = [
      ...new Set(matches.map((m) => m[1] || m[2]).filter(Boolean)),
    ];

    const urlMap = new Map<string, string>();

    await Promise.all(
      uniqueUrls.map(async (url) => {
        try {
          urlMap.set(url, await urlShortener(url));
        } catch (e) {
          console.error(`Không thể rút gọn link: ${url}`, e);
        }
      }),
    );

    urlMap.forEach((shortUrl, longUrl) => {
      finalHtml = finalHtml.split(longUrl).join(shortUrl);
    });
  } catch (err) {
    console.error("Lỗi khi xử lý link hoặc copy: ", err);
  } finally {
    const blob = new Blob([finalHtml], { type: "text/html" });
    const data = [
      new ClipboardItem({
        "text/html": blob,
        "text/plain": new Blob([finalHtml], { type: "text/plain" }),
      }),
    ];
    await navigator.clipboard.write(data);
  }
}

export function formatHTML(html: string): string {
  return beautifyHtml(html, {
    indent_size: 2,
    indent_char: " ",
    max_preserve_newlines: 1,
    preserve_newlines: true,
    indent_scripts: "normal",
    end_with_newline: false,
    wrap_line_length: 80,
    indent_inner_html: true,
    indent_empty_lines: false,
  });
}
