import { getFile } from "@/lib/storage";

// Serves files uploaded through the admin (stored privately under media/).
const TYPES: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", pdf: "application/pdf" };

export async function GET(_request: Request, ctx: RouteContext<"/api/media/[...key]">) {
  const { key } = await ctx.params;
  const name = key.join("/");
  if (!/^[\w.-]+$/.test(name)) return new Response("Not found", { status: 404 });
  const file = await getFile(`media/${name}`);
  if (!file) return new Response("Not found", { status: 404 });
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return new Response(new Uint8Array(file), {
    headers: { "content-type": TYPES[ext] ?? "application/octet-stream", "cache-control": "public, max-age=31536000, immutable" },
  });
}
