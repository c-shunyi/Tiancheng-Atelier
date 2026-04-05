import { Router } from "express";

import {
  getAdminUserList,
  getCurrentAdminProfile,
  loginAdminUser,
} from "../../controllers/admin/admin-user.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRoles } from "../../middlewares/role.middleware";

const router = Router();

router.post("/login", loginAdminUser);
router.get("/profile", authMiddleware("admin"), getCurrentAdminProfile);
router.get(
  "/users",
  authMiddleware("admin"),
  requireRoles("super_admin"),
  getAdminUserList,
);

export default router;
