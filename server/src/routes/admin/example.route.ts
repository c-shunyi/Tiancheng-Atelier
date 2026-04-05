import { Router } from "express";

import {
  createAdminExampleItem,
  getAdminExampleItem,
  listAdminExampleItems,
  removeAdminExampleItem,
  updateAdminExampleItem,
} from "../../controllers/admin/example.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRoles } from "../../middlewares/role.middleware";

const router = Router();

router.use(authMiddleware("admin"));
router.use(requireRoles("admin", "super_admin"));
router.get("/", listAdminExampleItems);
router.get("/:id", getAdminExampleItem);
router.post("/", createAdminExampleItem);
router.put("/:id", updateAdminExampleItem);
router.delete("/:id", removeAdminExampleItem);

export default router;
