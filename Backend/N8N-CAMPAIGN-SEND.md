# Campaign send → n8n (POST)

## App flow

```
Frontend Send
  → POST /api/campaigns/:campaignId/send   (JWT)
  → Backend counts mails, sets status=processing
  → POST N8N_WEBHOOK_URL  { campaignId, subject, body, workMail, ... }
  → n8n fetches GET /api/mails/campaign/:id
  → Split Out → Loop → Gmail (1 recipient each)
  → PATCH /api/mails/:id  (per send)
  → PATCH /api/campaigns/:id/status  (when done)
```

## Env

```env
N8N_WEBHOOK_URL=https://YOUR-N8N-HOST/webhook/YOUR-PATH
N8N_USER=Nova
N8N_PASSWORD=your_password
```

`N8N_MAIN_WEBHOOK` still works as a fallback.

## n8n Webhook node

| Setting | Value |
|---|---|
| HTTP Method | **GET** (current Nova default) or **POST** if you set `N8N_WEBHOOK_METHOD=POST` |
| Authentication | Basic Auth (`N8N_USER` / `N8N_PASSWORD`) |
| Path | your production path |
| Respond | Immediately or When Last Node Finishes |

### GET (default — matches your current workflow)

Nova calls:

```
GET /webhook/...?campaignId=6&action=start_campaign&workMail=...&timestamp=...
```

Read in n8n:

`{{ $json.query.campaignId }}`

### POST (optional)

Set in `.env`:

```env
N8N_WEBHOOK_METHOD=POST
```

Then change the Webhook node HTTP Method to **POST**. Body:

```json
{
  "campaignId": 6,
  "workMail": "you@gmail.com",
  "subject": "...",
  "body": "...",
  "action": "start_campaign",
  "totalRecipients": 100
}
```

Read campaign id as:

`{{ $json.body.campaignId }}`  
(or `{{ $json.campaignId }}` depending on n8n version)

## HTTP Request — all recipients

| Field | Value |
|---|---|
| Method | GET |
| URL | `https://YOUR-PUBLIC-API/api/mails/campaign/{{ $json.body.campaignId }}` |
| Header | `Authorization: Bearer <JWT>` |
| Header | `ngrok-skip-browser-warning: true` (if using ngrok) |

Response:

```json
{ "data": [ { "id", "campaign_id", "email", "full_name", ... } ], "total": N, "subject", "body" }
```

## Split Out

**Field to Split Out:** `data`  
→ 100 recipients = 100 items

## Edit Fields (optional)

Map `email`, `id`, and pull subject/body from Webhook or HTTP Request node.

## Loop Over Items

- Put **Gmail** on the **loop** branch  
- After Gmail: **PATCH mail status**, then **Update Sheet**  
- Wire back into Loop  
- On **done**: **PATCH /api/campaigns/:id/status**

## Gmail (loop branch)

| Field | Value |
|---|---|
| To | `{{ $json.email }}` |
| Subject | `{{ $('Webhook').item.json.body.subject }}` |
| Message | `{{ $('Webhook').item.json.body.body }}` |

One recipient per iteration — never put all emails in To.

## Per-recipient tracking

`PATCH /api/mails/{{ $json.id }}`

Success:

```json
{ "status": true, "delivery_status": "sent", "sent_at": "2026-09-03T12:00:00.000Z" }
```

Failure:

```json
{ "failed": true, "delivery_status": "failed" }
```

## Final campaign status (done branch)

`PATCH /api/campaigns/{{ campaignId }}/status`

```json
{
  "campaignId": 6,
  "total": 100,
  "sent": 95,
  "failed": 5,
  "status": "completed"
}
```

If n8n never calls this, the UI stays on **Processing**. Then either:

1. Add the PATCH on the Loop **done** branch (preferred), or  
2. In NOVA click **Mark completed** → `POST /api/campaigns/:id/complete`

Listing campaigns also auto-reconciles when every mail is already `sent` / `failed`.

## Publish

Workflow must be **Published**. App uses production `/webhook/...`, not test listen mode.
