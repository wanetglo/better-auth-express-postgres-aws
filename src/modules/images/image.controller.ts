import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/utils/catch-async";
import { sendResponse } from "../../shared/utils/send-response";
import { imageService } from "./image.service";
import {
  imgproxySignSchema,
  uploadDeleteSchema,
  uploadPresignSchema,
} from "./image.type";

const signImgproxy = catchAsync(async (req: Request, res: Response) => {
  const payload = imgproxySignSchema.parse(req.body);
  const result = await imageService.signImgproxy(payload);

  sendResponse(res, {
    status: status.OK,
    success: true,
    message: "Imgproxy URL generated",
    data: result,
  });
});

const createPresign = catchAsync(async (req: Request, res: Response) => {
  const payload = uploadPresignSchema.parse(req.body);
  const result = await imageService.createPresign(payload);

  sendResponse(res, {
    status: status.OK,
    success: true,
    message: "Presigned upload created",
    data: result,
  });
});

const deleteUploads = catchAsync(async (req: Request, res: Response) => {
  const payload = uploadDeleteSchema.parse(req.body);
  const result = await imageService.deleteUploads(payload);

  sendResponse(res, {
    status: status.OK,
    success: true,
    message: "Uploads deleted",
    data: result,
  });
});

export const imageController = {
  signImgproxy,
  createPresign,
  deleteUploads,
};
