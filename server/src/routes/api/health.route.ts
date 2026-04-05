import { Router } from "express";

import { getHealth } from "../../controllers/api/health.controller";

const router = Router();

router.get("/", getHealth);

export default router;
