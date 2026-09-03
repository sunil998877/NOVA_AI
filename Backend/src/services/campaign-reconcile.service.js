import { Campaign } from "../models/campaign.model.js";
import { Mail } from "../models/mail.model.js";
import { toMysqlDateTime } from "../utils/datetime.js";

export async function summarizeCampaignMails(campaignId) {
    const mails = await Mail.findByCampaignId(campaignId);
    let sent = 0;
    let failed = 0;
    let pending = 0;

    for (const mail of mails) {
        const delivery = String(mail.delivery_status || "").toLowerCase();
        if (delivery === "sent" || mail.status || mail.sent_at) {
            sent += 1;
        } else if (delivery === "failed") {
            failed += 1;
        } else {
            pending += 1;
        }
    }

    return {
        total: mails.length,
        sent,
        failed,
        pending,
        mails,
    };
}

/**
 * If a campaign is still "processing", sync counts from mails.
 * When every recipient is sent or failed, mark the campaign completed.
 */
export async function reconcileCampaignStatus(campaign) {
    if (!campaign) return campaign;

    const status = String(campaign.status || "").toLowerCase();
    if (status !== "processing") {
        return campaign;
    }

    const summary = await summarizeCampaignMails(campaign.id);
    const total = summary.total || Number(campaign.total_recipients) || 0;

    const fields = {
        total_recipients: total,
        sent_count: summary.sent,
        failed_count: summary.failed,
    };

    if (total > 0 && summary.pending === 0) {
        fields.status = "completed";
        fields.camp_status = "Completed";
    }

    return Campaign.updateById(campaign.id, fields);
}

/**
 * Force-complete after n8n sent mail but never called the status webhook.
 */
export async function forceCompleteCampaign(campaign, { markMails = true } = {}) {
    const summary = await summarizeCampaignMails(campaign.id);
    const now = toMysqlDateTime(new Date());

    if (markMails) {
        for (const mail of summary.mails) {
            const delivery = String(mail.delivery_status || "").toLowerCase();
            if (delivery === "failed") continue;
            if (delivery === "sent" || mail.status || mail.sent_at) continue;
            await Mail.updateById(mail.id, {
                status: true,
                delivery_status: "sent",
                sent_at: now,
            });
        }
    }

    const refreshed = await summarizeCampaignMails(campaign.id);
    return Campaign.updateById(campaign.id, {
        status: "completed",
        camp_status: "Completed",
        total_recipients: refreshed.total,
        sent_count: refreshed.sent,
        failed_count: refreshed.failed,
    });
}
