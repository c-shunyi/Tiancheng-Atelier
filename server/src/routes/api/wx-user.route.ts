import { Router } from "express";

import { getProfile, updateProfile, wxLogin } from "../../controllers/api/wx-user.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

const router = Router();

router.post("/login", wxLogin);
router.get("/profile", authMiddleware("user"), getProfile);
router.put("/profile", authMiddleware("user"), updateProfile);

export default router;
