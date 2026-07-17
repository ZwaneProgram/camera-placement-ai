import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

import { auth } from "@/auth";

/**
 * Client-upload token endpoint. The admin product form uploads image files
 * straight from the browser to Vercel Blob, so large files never pass through
 * a Server Action (which is capped at ~1 MB locally / ~4.5 MB on Vercel).
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async () => {
        // Only admins may obtain an upload token.
        const session = await auth();
        if (session?.user?.role !== "ADMIN") {
          throw new Error("ไม่ได้รับอนุญาต");
        }
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
          addRandomSuffix: true,
          maximumSizeInBytes: 10 * 1024 * 1024, // 10 MB per image
        };
      },
      onUploadCompleted: async () => {
        // Vercel calls this after the upload finishes; not reachable on
        // localhost. Nothing to do — the client already has the blob URL.
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
