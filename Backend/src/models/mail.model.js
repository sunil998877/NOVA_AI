import { execute, query } from "../config/db.js";
import { mailSchema } from "../schema/mail.schema.js";
import { mapRow, placeholders } from "./mapRow.js";

const { table, columns } = mailSchema;

const mapMail = (row) => {
    const mapped = mapRow(row);
    if (!mapped) return null;
    mapped.status = Boolean(row.status);
    return mapped;
};

export const Mail = {
    async findById(id) {
        const rows = await query(`SELECT ${columns} FROM ${table} WHERE id = ? LIMIT 1`, [id]);
        return mapMail(rows[0]);
    },

    async findForUserCampaigns(campaignIds, campaignId) {
        if (campaignId) {
            const rows = await query(
                `SELECT ${columns} FROM ${table} WHERE campaign_id = ? ORDER BY createdAt DESC`,
                [campaignId]
            );
            return rows.map(mapMail);
        }

        if (!campaignIds.length) return [];

        const rows = await query(
            `SELECT ${columns} FROM ${table} WHERE campaign_id IN (${placeholders(campaignIds)}) ORDER BY createdAt DESC`,
            campaignIds
        );
        return rows.map(mapMail);
    },

    async insertMany(docs) {
        const created = [];
        for (const doc of docs) {
            const result = await execute(
                `INSERT INTO ${table} (campaign_id, user_id, email, full_name, status, open_count, sent_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    doc.campaign_id,
                    doc.user_id,
                    doc.email ? String(doc.email).toLowerCase().trim() : null,
                    doc.full_name ?? null,
                    doc.status ? 1 : 0,
                    doc.open_count ?? 0,
                    doc.sent_at ?? null,
                ]
            );
            created.push(await this.findById(result.insertId));
        }
        return created;
    },

    async deleteByCampaignId(campaignId) {
        const result = await execute(`DELETE FROM ${table} WHERE campaign_id = ?`, [campaignId]);
        return result.affectedRows;
    },

    async findByCampaignIds(campaignIds) {
        if (!campaignIds.length) return [];
        const rows = await query(
            `SELECT ${columns} FROM ${table} WHERE campaign_id IN (${placeholders(campaignIds)})`,
            campaignIds
        );
        return rows.map(mapMail);
    },
};
