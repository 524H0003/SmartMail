interface R2PutOptions {
  httpMetadata?: { contentType?: string };
}

interface R2ObjectBody {
  body: ReadableStream;
  httpMetadata?: { contentType?: string };
}

interface R2BucketLike {
  put(
    key: string,
    value: ReadableStream | ArrayBuffer | string,
    options?: R2PutOptions,
  ): Promise<unknown>;
  get(key: string): Promise<R2ObjectBody | null>;
}

interface Env {
  R2_BUCKET: R2BucketLike;
  ASSETS: { fetch(request: Request): Promise<Response> };
}

function toErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
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
    const key = `${crypto.randomUUID()}${ext}`;

    await env.R2_BUCKET.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type || "application/octet-stream",
      },
    });

    const url = new URL(request.url);
    const publicUrl = `${url.origin}/api/media/${key}`;

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

  return new Response(object.body, { headers });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/upload") {
      return handleUpload(request, env);
    }

    if (url.pathname.startsWith("/api/media/")) {
      const key = decodeURIComponent(url.pathname.slice("/api/media/".length));
      return handleMedia(request, env, key);
    }

    // Fall back to the static assets / SPA for everything else.
    return env.ASSETS.fetch(request);
  },
};
