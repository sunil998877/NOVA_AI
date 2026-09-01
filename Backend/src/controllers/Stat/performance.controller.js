import { Campaign } from "../../models/campaign.model.js";
import { Mail } from "../../models/mail.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const getPerformance = asyncHandler(async (req, res) => {
    const campaignIds = await Campaign.listIdsByUser(req.user.id);

    if (campaignIds.length === 0) {
        return res.status(200).json({
            total: 0,
            delivered: 0,
            opened: 0,
            campaigns: 0,
        });
    }

    const mails = await Mail.findByCampaignIds(campaignIds);
    const total = mails.length;
    const delivered = mails.filter((m) => m.status === true || !!m.sent_at).length;
    const opened = mails.filter((m) => (m.open_count || 0) > 0).length;

    return res.status(200).json({
        total,
        delivered,
        opened,
        campaigns: campaignIds.length,
    });
});
