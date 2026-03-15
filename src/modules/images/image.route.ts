import { Role } from "@prisma/client";
import { Router } from "express";
import { authorize } from "../../shared/middlewares/authorize.middleware";
import { imageController } from "./image.controller";

const router = Router();

router.post(
  "/imgproxy/sign",
  authorize(Role.ADMIN, Role.USER),
  imageController.signImgproxy,
);
router.post(
  "/upload/presign",
  authorize(Role.ADMIN, Role.USER),
  imageController.createPresign,
);
router.post(
  "/upload/delete",
  authorize(Role.ADMIN, Role.USER),
  imageController.deleteUploads,
);

export const imageRoutes = router;
