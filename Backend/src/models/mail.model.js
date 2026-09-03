import { execute, query } from "../config/db.js";
import { mailSchema } from "../schema/mail.schema.js";
import { mapRow, placeholders } from "./mapRow.js";

const { table, columns, updatable } = mailSchema;
const UPDATABLE = new Set(updatable || []);

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

    async findByCampaignId(campaignId) {
        const rows = await query(
            `SELECT ${columns} FROM ${table} WHERE campaign_id = ? ORDER BY id ASC`,
            [campaignId]
        );
        return rows.map(mapMail);
    },

    async countByCampaignId(campaignId) {
        const rows = await query(`SELECT COUNT(*) AS total FROM ${table} WHERE campaign_id = ?`, [
            campaignId,
        ]);
        return Number(rows[0]?.total || 0);
    },

    async findForUserCampaigns(campaignIds, campaignId) {
        if (campaignId) {
            return this.findByCampaignId(campaignId);
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
                `INSERT INTO ${table} (campaign_id, user_id, email, full_name, status, delivery_status, open_count, sent_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    doc.campaign_id,
                    doc.user_id,
                    doc.email ? String(doc.email).toLowerCase().trim() : null,
                    doc.full_name ?? null,
                    doc.status ? 1 : 0,
                    doc.delivery_status || "pending",
                    doc.open_count ?? 0,
                    doc.sent_at ?? null,
                ]
            );
            created.push(await this.findById(result.insertId));
        }
        return created;
    },

    async updateById(id, fields) {
        const entries = Object.entries(fields).filter(
            ([key, value]) => UPDATABLE.has(key) && value !== undefined
        );
        if (entries.length === 0) {
            return this.findById(id);
        }

        const normalized = entries.map(([key, value]) => {
            if (key === "status") return [key, value ? 1 : 0];
            return [key, value];
        });

        const sets = normalized.map(([key]) => `${key} = ?`).join(", ");
        const values = normalized.map(([, value]) => value);
        await execute(`UPDATE ${table} SET ${sets} WHERE id = ?`, [...values, id]);
        return this.findById(id);
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
