import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-revalidate-secret");
  if (secret !== process.env.VERCEL_REVALIDATE_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { paths, tags } = await req.json().catch(() => ({ paths: [], tags: [] }));

  for (const path of paths ?? []) revalidatePath(path);
  for (const tag of tags ?? []) revalidateTag(tag);

  return NextResponse.json({ revalidated: true, paths, tags });
}
