import { Campaign } from "../../models/campaign.model.js";
import { audit } from "../../utils/audit.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const ALLOWED = new Set(["draft", "processing", "completed", "failed", "sent", "scheduled"]);

export const updateCampaignStatus = asyncHandler(async (req, res) => {
    const campaignId = req.params.campaignId || req.params.id || req.body.campaignId;
    const campaign = await Campaign.findOwned(campaignId, req.user.id);

    if (!campaign) {
        return res.status(403).json({ error: "Access denied: You do not own this campaign" });
    }

    const {
        status,
        total,
        totalRecipients,
        sent,
        sent_count,
        failed,
        failed_count,
        camp_status,
    } = req.body;

    const nextStatus = String(status || "").toLowerCase();
    if (status !== undefined && !ALLOWED.has(nextStatus)) {
        return res.status(400).json({
            error: `Invalid status. Allowed: ${[...ALLOWED].join(", ")}`,
        });
    }

    const totalValue = total ?? totalRecipients;
    const sentValue = sent ?? sent_count;
    const failedValue = failed ?? failed_count;

    const fields = {
        status: status !== undefined ? nextStatus : undefined,
        camp_status:
            camp_status ??
            (nextStatus === "completed"
                ? "Completed"
                : nextStatus === "failed"
                  ? "Failed"
                  : nextStatus === "processing"
                    ? "Processing"
                    : undefined),
        total_recipients: totalValue !== undefined ? Number(totalValue) : undefined,
        sent_count: sentValue !== undefined ? Number(sentValue) : undefined,
        failed_count: failedValue !== undefined ? Number(failedValue) : undefined,
    };

    const updated = await Campaign.updateById(campaign.id, fields);
    await audit(req.user.id, "CAMPAIGN_STATUS", campaign.id, req.ip);

    return res.status(200).json({
        success: true,
        campaignId: updated.id,
        status: updated.status,
        totalRecipients: updated.total_recipients ?? totalValue ?? null,
        sent: updated.sent_count ?? sentValue ?? null,
        failed: updated.failed_count ?? failedValue ?? null,
        campaign: updated,
    });
});
