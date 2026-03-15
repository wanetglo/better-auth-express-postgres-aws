import { Role } from "@prisma/client";
import { Router } from "express";
import { authorize } from "../../shared/middlewares/authorize.middleware";
import { usersController } from "./user.controller";

const router = Router();

router.get("/admin", authorize(Role.ADMIN), usersController.listForAdmin);
router.get("/admin/:id", authorize(Role.ADMIN), usersController.getById);
router.put("/admin/:id", authorize(Role.ADMIN), usersController.updateById);
router.put(
  "/admin/:id/block",
  authorize(Role.ADMIN),
  usersController.blockUser,
);
router.put("/me", authorize(Role.ADMIN, Role.USER), usersController.updateMe);

export const usersRoutes = router;
