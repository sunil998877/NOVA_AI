import { Campaign } from "../../models/campaign.model.js";
import { Mail } from "../../models/mail.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const batchCreateMails = asyncHandler(async (req, res) => {
    const { campaignId, mails } = req.body;
    if (!campaignId || !Array.isArray(mails) || mails.length === 0) {
        return res.status(400).json({ error: "campaignId and mails[] are required" });
    }

    const campaign = await Campaign.findOwned(campaignId, req.user.id);
    if (!campaign) {
        return res.status(403).json({ error: "Access denied: You do not own this campaign" });
    }

    const docs = mails.map((mail) => ({
        campaign_id: campaign.id,
        user_id: req.user.id,
        email: mail.email,
        full_name: mail.full_name || mail.fullName,
        status: mail.status ?? false,
        open_count: mail.open_count ?? 0,
        sent_at: mail.sent_at ?? null,
    }));

    const data = await Mail.insertMany(docs);
    return res.status(201).json({ data });
});
