import { Router } from "express";

import {
  listPresets,
  createPreset,
  updatePreset,
  removePreset,
  togglePresetEnabled,
} from "../../controllers/admin/presets.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRoles } from "../../middlewares/role.middleware";
import { uploadSingleFile } from "../../middlewares/upload.middleware";

const router = Router();

const auth = [authMiddleware("admin"), requireRoles("admin", "super_admin")];

router.get("/", ...auth, listPresets);
router.post("/", ...auth, uploadSingleFile, createPreset);
router.put("/:id", ...auth, uploadSingleFile, updatePreset);
router.put("/:id/toggle", ...auth, togglePresetEnabled);
router.delete("/:id", ...auth, removePreset);

export default router;
