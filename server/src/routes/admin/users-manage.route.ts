import { Router } from "express";

import {
  listUsers,
  getUserDetail,
  toggleUserStatus,
} from "../../controllers/admin/users-manage.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRoles } from "../../middlewares/role.middleware";

const router = Router();

const auth = [authMiddleware("admin"), requireRoles("admin", "super_admin")];

router.get("/", ...auth, listUsers);
router.get("/:id", ...auth, getUserDetail);
router.put("/:id/status", ...auth, toggleUserStatus);

export default router;
