import { Campaign } from "../../models/campaign.model.js";
import { Mail } from "../../models/mail.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const listMails = asyncHandler(async (req, res) => {
    const campaignId = req.query.campaignId;
    const ids = await Campaign.listIdsByUser(req.user.id);

    if (campaignId && !ids.some((id) => String(id) === String(campaignId))) {
        return res.status(403).json({ error: "Access denied" });
    }

    const data = await Mail.findForUserCampaigns(ids, campaignId);
    return res.status(200).json({ data });
});
