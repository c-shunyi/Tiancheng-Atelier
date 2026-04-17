import { Router } from "express";

import {
  listCreations,
  getCreationDetail,
  removeCreation,
} from "../../controllers/admin/creations.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRoles } from "../../middlewares/role.middleware";

const router = Router();

const auth = [authMiddleware("admin"), requireRoles("admin", "super_admin")];

router.get("/", ...auth, listCreations);
router.get("/:id", ...auth, getCreationDetail);
router.delete("/:id", ...auth, removeCreation);

export default router;
