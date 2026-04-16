import { Router } from "express";

import {
  createAddress,
  deleteAddress,
  getAddress,
  listAddresses,
  updateAddress,
} from "../../controllers/api/address.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

const router = Router();

router.get("/", authMiddleware("user"), listAddresses);
router.post("/", authMiddleware("user"), createAddress);
router.get("/:id", authMiddleware("user"), getAddress);
router.patch("/:id", authMiddleware("user"), updateAddress);
router.delete("/:id", authMiddleware("user"), deleteAddress);

export default router;
