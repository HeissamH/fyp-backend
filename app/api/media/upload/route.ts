import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { media } from "@/lib/db/schema";
import { withAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api-response";
import { logAction } from "@/lib/audit";
import { supabase, STORAGE_BUCKET, MAX_FILE_SIZE, ALLOWED_MIME_TYPES } from "@/lib/storage";

export const POST = withAuth(async (req, ctx) => {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return errorResponse("No file provided", 400);
  }

  // Validate MIME type
  const mediaType = ALLOWED_MIME_TYPES[file.type];
  if (!mediaType) {
    return errorResponse(
      `Unsupported file type: ${file.type}. Allowed: JPEG, PNG, WebP, GIF, MP4, PDF`,
      400
    );
  }

  // Validate size
  if (file.size > MAX_FILE_SIZE) {
    const limitMB = MAX_FILE_SIZE / (1024 * 1024);
    return errorResponse(`File too large. Maximum size is ${limitMB}MB`, 400);
  }

  const userId = ctx.user.userId;
  const buffer = Buffer.from(await file.arrayBuffer());
  const timestamp = Date.now();
  const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `uploads/${userId}/${timestamp}-${safeFilename}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("Supabase upload error:", uploadError);
    return errorResponse(`Failed to upload file: ${uploadError?.message || uploadError}`, 500);
  }

  // Generate signed URL (valid for 1 year — private bucket)
  const { data: signedData, error: signedError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(storagePath, 60 * 60 * 24 * 365);

  if (signedError || !signedData?.signedUrl) {
    console.error("Signed URL error:", signedError);
    return errorResponse("File uploaded but failed to generate URL", 500);
  }

  const url = signedData.signedUrl;

  // Save record to media table
  const [record] = await db.insert(media).values({
    uploadedBy: userId,
    url,
    type: mediaType,
    mimeType: file.type,
    sizeBytes: file.size,
    filename: safeFilename,
  }).returning();

  await logAction({
    userId,
    action: "UPLOAD_MEDIA",
    entity: "MEDIA",
    entityId: record.id,
    metadata: { filename: safeFilename, type: mediaType, sizeBytes: file.size },
    ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined,
  });

  return successResponse(
    {
      id: record.id,
      url: record.url,
      type: record.type,
      mimeType: record.mimeType,
      sizeBytes: record.sizeBytes,
      filename: record.filename,
    },
    "File uploaded successfully",
    201
  );
});
