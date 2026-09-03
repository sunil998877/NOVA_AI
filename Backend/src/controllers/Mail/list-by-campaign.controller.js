import { Campaign } from "../../models/campaign.model.js";
import { Mail } from "../../models/mail.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const listMailsByCampaign = asyncHandler(async (req, res) => {
    const campaign = await Campaign.findOwned(req.params.id, req.user.id);
    if (!campaign) {
        return res.status(403).json({ error: "Access denied: You do not own this campaign" });
    }

    const data = await Mail.findByCampaignId(campaign.id);
    return res.status(200).json({
        data,
        campaignId: campaign.id,
        total: data.length,
        subject: campaign.subject || "",
        body: campaign.body || "",
        workMail: campaign.workMail || "",
        title: campaign.title || "",
    });
});
