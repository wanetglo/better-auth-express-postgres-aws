import { Router } from "express";
import { authRoutes } from "../modules/auth/auth.route";
import { healthRoutes } from "../modules/health/health.route";
import { imageRoutes } from "../modules/images/image.route";
import { usersRoutes } from "../modules/users/user.route";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/", imageRoutes);

export const apiRoutes = router;
