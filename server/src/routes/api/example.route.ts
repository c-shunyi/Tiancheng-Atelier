import { Router } from "express";

import {
  createExampleItem,
  getExampleItem,
  listExampleItems,
  removeExampleItem,
  updateExampleItem,
} from "../../controllers/api/example.controller";

const router = Router();

router.get("/", listExampleItems);
router.get("/:id", getExampleItem);
router.post("/", createExampleItem);
router.put("/:id", updateExampleItem);
router.delete("/:id", removeExampleItem);

export default router;
