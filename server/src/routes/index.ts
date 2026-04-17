import { Router } from "express";

import adminExampleRoutes from "./admin/example.route";
import adminUserRoutes from "./admin/admin-user.route";
import adminStatsRoutes from "./admin/stats.route";
import adminUsersManageRoutes from "./admin/users-manage.route";
import adminCreationsRoutes from "./admin/creations.route";
import adminPresetsRoutes from "./admin/presets.route";
import addressRoutes from "./api/address.route";
import creationRoutes from "./api/creation.route";
import exampleRoutes from "./api/example.route";
import healthRoutes from "./api/health.route";
import promptRoutes from "./api/prompt.route";
import userRoutes from "./api/user.route";

const router = Router();

router.use("/health", healthRoutes);
router.use("/examples", exampleRoutes);
router.use("/users", userRoutes);
router.use("/creations", creationRoutes);
router.use("/prompts", promptRoutes);
router.use("/addresses", addressRoutes);
router.use("/admin", adminUserRoutes);
router.use("/admin/examples", adminExampleRoutes);
router.use("/admin/stats", adminStatsRoutes);
router.use("/admin/users-manage", adminUsersManageRoutes);
router.use("/admin/creations", adminCreationsRoutes);
router.use("/admin/presets", adminPresetsRoutes);

export default router;
