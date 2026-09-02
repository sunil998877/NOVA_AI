export const campaignSchema = {
    table: "campaigns",
    columns:
        "id, title, workMail, followups, camp_status, scheduledDate, status, subject, body, user_id, createdAt, updatedAt",
    updatable: ["title", "workMail", "followups", "camp_status", "scheduledDate", "status", "subject", "body"],
    createTable: `CREATE TABLE IF NOT EXISTS campaigns (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        workMail VARCHAR(255) NULL,
        followups VARCHAR(32) NOT NULL DEFAULT '0',
        camp_status VARCHAR(64) NOT NULL DEFAULT 'Pending',
        scheduledDate DATETIME NULL,
        status VARCHAR(64) NOT NULL DEFAULT 'draft',
        subject VARCHAR(255) NULL,
        body MEDIUMTEXT NULL,
        user_id INT NOT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_campaigns_user (user_id),
        CONSTRAINT fk_campaigns_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
};
