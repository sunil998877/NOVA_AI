import { Campaign } from "../../models/campaign.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const listCampaigns = asyncHandler(async (req, res) => {
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 100);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
        Campaign.findByUser(req.user.id, { skip, limit }),
        Campaign.countByUser(req.user.id),
    ]);

    return res.status(200).json({
        data,
        pagination: { page, limit, total },
    });
});
