import { Router } from "express";

import { listPresets } from "../../controllers/api/prompt.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

const router = Router();

router.get("/", authMiddleware("user"), listPresets);

export default router;
