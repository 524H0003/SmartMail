import type { D1Database, R2Bucket } from "@cloudflare/workers-types";

interface Env {
  R2_BUCKET: R2Bucket;
  DB: D1Database;
  ASSETS: { fetch(request: Request): Promise<Response> };
}

function toErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

async function generateHashId(content: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", content);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b: number) => b.toString(16).padStart(2, "0"))
    .slice(0, 9)
    .join("");
}

async function handleUpload(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return new Response("No file provided", { status: 400 });
    }

    const ext = file.name.includes(".")
      ? file.name.slice(file.name.lastIndexOf("."))
      : "";
    const content = await file.arrayBuffer();
    const key = `${await generateHashId(content)}${ext}`;

    await env.R2_BUCKET.put(key, content, {
      httpMetadata: {
        contentType: file.type || "application/octet-stream",
      },
    });

    const url = new URL(request.url);
    const publicUrl = await shorteningLink(
      `${url.origin}/api/media/${key}`,
      url,
      env,
    );

    return new Response(JSON.stringify({ publicUrl }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response("Upload failed: " + toErrorMessage(err), {
      status: 500,
    });
  }
}

async function handleMedia(
  request: Request,
  env: Env,
  key: string,
): Promise<Response> {
  if (request.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const object = await env.R2_BUCKET.get(key);

  if (!object) {
    return new Response("Not found", { status: 404 });
  }

  const headers = new Headers();
  headers.set(
    "Content-Type",
    object.httpMetadata?.contentType ?? "application/octet-stream",
  );
  headers.set("Cache-Control", "public, max-age=31536000, immutable");

  // @ts-expect-error force
  return new Response(object.body, { headers });
}

async function shorteningLink(longUrl: string, url: URL, env: Env) {
  const slug = await generateHashId(Buffer.from(longUrl).buffer);

  const exists = await (env.DB.prepare("SELECT slug FROM links WHERE slug = ?")
    .bind(slug)
    .first() as Promise<{ slug: string } | null>);

  if (!exists) {
    await env.DB.prepare("INSERT INTO links (slug, url) VALUES (?, ?)")
      .bind(slug, longUrl)
      .run();
  }

  return `${url.origin}/short/${slug}`;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/upload") return handleUpload(request, env);

    if (url.pathname.startsWith("/api/media/")) {
      const key = decodeURIComponent(url.pathname.slice("/api/media/".length));
      return handleMedia(request, env, key);
    }

    if (url.pathname === "/api/shorten" && request.method === "POST") {
      const url = new URL(request.url);
      const { longUrl } = await request.json<{ longUrl: string }>();
      return new Response(
        JSON.stringify({ shortUrl: await shorteningLink(longUrl, url, env) }),
        {
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    if (url.pathname.startsWith("/short/")) {
      const slug = url.pathname.slice("/short/".length);
      const link = await (env.DB.prepare("SELECT url FROM links WHERE slug = ?")
        .bind(slug)
        .first() as Promise<{ url: string } | null>);
      if (link) {
        return Response.redirect(link.url, 302);
      }
      return new Response("Not found", { status: 404 });
    }

    // Fall back to the static assets / SPA for everything else.
    return env.ASSETS.fetch(request);
  },
};
