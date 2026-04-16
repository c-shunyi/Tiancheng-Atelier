import { Router } from "express";

import adminExampleRoutes from "./admin/example.route";
import adminUserRoutes from "./admin/admin-user.route";
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
router.use("/admin", adminUserRoutes);
router.use("/admin/examples", adminExampleRoutes);

export default router;
