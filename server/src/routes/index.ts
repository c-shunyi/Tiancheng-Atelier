import { Router } from "express";

import adminExampleRoutes from "./admin/example.route";
import adminUserRoutes from "./admin/admin-user.route";
import exampleRoutes from "./api/example.route";
import healthRoutes from "./api/health.route";
import wxUserRoutes from "./api/wx-user.route";

const router = Router();

router.use("/health", healthRoutes);
router.use("/examples", exampleRoutes);
router.use("/wx", wxUserRoutes);
router.use("/admin", adminUserRoutes);
router.use("/admin/examples", adminExampleRoutes);

export default router;
