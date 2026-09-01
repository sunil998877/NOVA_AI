import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { listCampaigns } from "../controllers/Campaign/list.controller.js";
import { getCampaign } from "../controllers/Campaign/get.controller.js";
import { createCampaign } from "../controllers/Campaign/create.controller.js";
import { updateCampaign } from "../controllers/Campaign/update.controller.js";
import { deleteCampaign } from "../controllers/Campaign/delete.controller.js";

const router = Router();

router.get("/list", authenticate, listCampaigns);
router.get("/:id", authenticate, getCampaign);
router.post("/create", authenticate, createCampaign);
router.put("/:id", authenticate, updateCampaign);
router.patch("/:id", authenticate, updateCampaign);
router.delete("/:id", authenticate, deleteCampaign);

export default router;
