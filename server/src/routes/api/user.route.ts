import { Router } from "express";

import {
  deleteFile,
  uploadFile,
} from "../../controllers/api/upload.controller";
import {
  getProfile,
  login,
  register,
  updateProfile,
  wxLogin,
} from "../../controllers/api/user.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { uploadSingleFile } from "../../middlewares/upload.middleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/wx-login", wxLogin);
router.get("/profile", authMiddleware("user"), getProfile);
router.put("/profile", authMiddleware("user"), updateProfile);
router.post("/upload", authMiddleware("user"), uploadSingleFile, uploadFile);
router.delete("/upload", authMiddleware("user"), deleteFile);

export default router;
