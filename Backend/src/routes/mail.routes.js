import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { listMails } from "../controllers/Mail/list.controller.js";
import { batchCreateMails } from "../controllers/Mail/batch-create.controller.js";
import { deleteMailsByCampaign } from "../controllers/Mail/delete-by-campaign.controller.js";

const router = Router();

router.get("/", authenticate, listMails);
router.post("/batch", authenticate, batchCreateMails);
router.delete("/campaign/:id", authenticate, deleteMailsByCampaign);

export default router;
