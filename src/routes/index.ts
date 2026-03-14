import { Router } from "express";
import { healthRoutes } from "../modules/health/health.route";
import { authRoutes } from "../modules/auth/auth.route";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);

export const apiRoutes = router;
