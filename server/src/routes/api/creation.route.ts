import { Router } from "express";

import {
  createCreation,
  deleteCreation,
  listCreations,
} from "../../controllers/api/creation.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { uploadSingleFile } from "../../middlewares/upload.middleware";

const router = Router();

router.post("/", authMiddleware("user"), uploadSingleFile, createCreation);
router.get("/", authMiddleware("user"), listCreations);
router.delete("/:id", authMiddleware("user"), deleteCreation);

export default router;
