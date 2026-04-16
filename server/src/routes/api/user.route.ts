import { Router } from "express";

import {
  getProfile,
  login,
  register,
  updateProfile,
  wxLogin,
} from "../../controllers/api/user.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/wx-login", wxLogin);
router.get("/profile", authMiddleware("user"), getProfile);
router.put("/profile", authMiddleware("user"), updateProfile);

export default router;
