import { env } from "../../config/env.js";
import { Campaign } from "../../models/campaign.model.js";
import { Mail } from "../../models/mail.model.js";
import { audit } from "../../utils/audit.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

async function callN8nWebhook(payload) {
    const webhookUrl = env.n8nWebhookUrl;
    const method = String(env.n8nWebhookMethod || "GET").toUpperCase();
    const headers = {
        "User-Agent": "NovaAI-Backend/1.0",
    };

    if (env.n8nUser && env.n8nPassword) {
        headers.Authorization = `Basic ${Buffer.from(`${env.n8nUser}:${env.n8nPassword}`).toString("base64")}`;
    }

    if (method === "POST") {
        headers["Content-Type"] = "application/json";
        return fetch(webhookUrl, {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
        });
    }

    // Default: GET — matches the current n8n Webhook node (HTTP Method = GET)
    const query = new URLSearchParams({
        campaignId: String(payload.campaignId),
        action: payload.action || "start_campaign",
        timestamp: payload.timestamp || new Date().toISOString(),
        totalRecipients: String(payload.totalRecipients ?? 0),
    });
    if (payload.workMail) query.set("workMail", payload.workMail);
    if (payload.subject) query.set("subject", payload.subject);

    return fetch(`${webhookUrl}?${query}`, {
        method: "GET",
        headers,
    });
}

export const sendCampaign = asyncHandler(async (req, res) => {
    const campaignId = req.params.campaignId || req.params.id;
    const campaign = await Campaign.findOwned(campaignId, req.user.id);

    if (!campaign) {
        return res.status(403).json({ error: "Access denied: You do not own this campaign" });
    }

    if (String(campaign.status || "").toLowerCase() === "processing") {
        return res.status(409).json({
            error: "Campaign is already processing",
            campaignId: campaign.id,
            status: "processing",
        });
    }

    const recipients = await Mail.findByCampaignId(campaign.id);
    const totalRecipients = recipients.length;

    if (totalRecipients === 0) {
        return res.status(400).json({
            error: "No recipients found for this campaign. Add mails before sending.",
            campaignId: campaign.id,
            totalRecipients: 0,
        });
    }

    if (!env.n8nWebhookUrl) {
        return res.status(503).json({
            error: "n8n webhook URL is not configured (set N8N_WEBHOOK_URL in Backend/.env)",
        });
    }

    await Campaign.updateById(campaign.id, {
        status: "processing",
        camp_status: "Processing",
        total_recipients: totalRecipients,
        sent_count: 0,
        failed_count: 0,
    });

    const payload = {
        campaignId: campaign.id,
        workMail: campaign.workMail || "",
        subject: campaign.subject || "",
        body: campaign.body || "",
        action: "start_campaign",
        totalRecipients,
        timestamp: new Date().toISOString(),
    };

    let n8nResponse;
    try {
        n8nResponse = await callN8nWebhook(payload);
    } catch (error) {
        await Campaign.updateById(campaign.id, {
            status: "failed",
            camp_status: "Failed",
        });
        return res.status(502).json({
            error: "Failed to reach n8n webhook",
            detail: error.message,
            campaignId: campaign.id,
            status: "failed",
        });
    }

    const text = await n8nResponse.text();
    let data = text;
    try {
        data = JSON.parse(text);
    } catch {
        /* keep raw text */
    }

    if (!n8nResponse.ok) {
        await Campaign.updateById(campaign.id, {
            status: "failed",
            camp_status: "Failed",
        });
        const n8nMessage =
            (data && typeof data === "object" && (data.message || data.error || data.hint)) ||
            (typeof data === "string" ? data : "") ||
            `HTTP ${n8nResponse.status}`;
        return res.status(n8nResponse.status).json({
            success: false,
            error: `n8n webhook rejected the request: ${n8nMessage}`,
            campaignId: campaign.id,
            totalRecipients,
            status: "failed",
            hint:
                /POST/i.test(String(n8nMessage))
                    ? "Your n8n Webhook is GET-only. Backend now defaults to GET. Set N8N_WEBHOOK_METHOD=POST only after you change the Webhook node to POST."
                    : "Check Webhook is Published, path matches N8N_WEBHOOK_URL, and Basic Auth matches N8N_USER / N8N_PASSWORD.",
            data,
        });
    }

    await audit(req.user.id, "CAMPAIGN_SEND", campaign.id, req.ip);

    return res.status(200).json({
        success: true,
        campaignId: campaign.id,
        totalRecipients,
        status: "processing",
        message: "Campaign processing started",
        data,
    });
});
