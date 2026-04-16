import { Router } from "express";

import {
  createCreation,
  deleteCreation,
  getCreation,
  listCreations,
} from "../../controllers/api/creation.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { uploadSingleFile } from "../../middlewares/upload.middleware";

const router = Router();

router.post("/", authMiddleware("user"), uploadSingleFile, createCreation);
router.get("/", authMiddleware("user"), listCreations);
router.get("/:id", authMiddleware("user"), getCreation);
router.delete("/:id", authMiddleware("user"), deleteCreation);

export default router;
