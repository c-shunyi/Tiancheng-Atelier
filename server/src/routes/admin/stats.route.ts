import { Router } from "express";

import { getDashboardStats } from "../../controllers/admin/stats.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRoles } from "../../middlewares/role.middleware";

const router = Router();

router.get(
  "/",
  authMiddleware("admin"),
  requireRoles("admin", "super_admin"),
  getDashboardStats,
);

export default router;
