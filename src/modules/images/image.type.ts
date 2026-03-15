import { z } from "zod";

export const imgproxySignSchema = z.object({
  bucket: z.string().min(1),
  key: z.string().min(1),
  ops: z.string().min(1).optional(),
});

export const uploadPresignSchema = z.object({
  contentType: z.string().min(1),
  keyPrefix: z.string().min(1).optional().default("uploads"),
  maxSize: z
    .number()
    .int()
    .positive()
    .optional()
    .default(20 * 1024 * 1024),
  filename: z.string().min(1).optional(),
});

export const uploadDeleteSchema = z
  .object({
    keys: z.array(z.string().min(1)).optional(),
    urls: z.array(z.string().min(1)).optional(),
  })
  .refine(
    (value) => (value.keys?.length ?? 0) > 0 || (value.urls?.length ?? 0) > 0,
    {
      message: "keys or urls required",
    },
  );

export type ImgproxySignInput = z.infer<typeof imgproxySignSchema>;
export type UploadPresignInput = z.infer<typeof uploadPresignSchema>;
export type UploadDeleteInput = z.infer<typeof uploadDeleteSchema>;
