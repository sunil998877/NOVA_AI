import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Mail,
  EllipsisVertical,
  Eye,
  ChartBar,
  Pencil,
  Copy,
  Trash2,
  Send,
  Loader2,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Card } from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { CampaignFormDialog } from "../components/CampaignFormDialog";
import { campaignApi, webhookApi } from "../lib/api";
import { useWorkspaceData } from "../hooks/useWorkspaceData";
import { toCampaignRow } from "../lib/campaigns";

function Campaigns() {
  const navigate = useNavigate();
  const { campaigns, mails, loading, error, reload } = useWorkspaceData();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [actionError, setActionError] = useState("");
  const [sendingId, setSendingId] = useState(null);

  const rows = useMemo(
    () => campaigns.map((campaign) => toCampaignRow(campaign, mails)),
    [campaigns, mails]
  );

  const filtered = rows.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === "all" || c.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status) => {
    if (status === "sent") return <Badge>Sent</Badge>;
    if (status === "draft") return <Badge variant="secondary">Draft</Badge>;
    if (status === "scheduled") return <Badge variant="outline" className="border-primary/40 text-primary">Scheduled</Badge>;
    return <Badge variant="outline">{status}</Badge>;
  };

  const getRate = (num, den) => (den > 0 ? `${((num / den) * 100).toFixed(1)}%` : "0%");

  const handleSave = async (payload) => {
    setSaving(true);
    setFormError("");
    try {
      if (editing) {
        await campaignApi.update(editing.id, payload);
      } else {
        await campaignApi.create(payload);
      }
      setShowModal(false);
      setEditing(null);
      await reload();
    } catch (err) {
      setFormError(err.message || "Could not save campaign");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setActionError("");
    try {
      await campaignApi.remove(id);
      await reload();
    } catch (err) {
      setActionError(err.message || "Could not delete campaign");
    }
  };

  const handleDuplicate = async (row) => {
    setActionError("");
    try {
      await campaignApi.create({
        title: `${row.name} copy`,
        workMail: row.workMail || null,
        status: "draft",
      });
      await reload();
    } catch (err) {
      setActionError(err.message || "Could not duplicate campaign");
    }
  };

  const handleStart = async (row) => {
    setSendingId(row.id);
    setActionError("");
    try {
      await webhookApi.send({
        campaignId: row.id,
        action: "start_campaign",
        workMail: row.workMail || "",
      });
      await campaignApi.update(row.id, { status: "sent", camp_status: "Running" });
      await reload();
    } catch (err) {
      setActionError(err.message || "Could not start campaign");
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Your Campaigns</h2>
          <p className="text-sm text-muted-foreground md:text-base">
            Manage and track all your email campaigns in one place.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormError("");
            setShowModal(true);
          }}
          className="w-full sm:w-auto"
        >
          <Plus />
          New Campaign
        </Button>
      </div>

      {error || actionError ? <p className="text-sm text-destructive">{actionError || error}</p> : null}

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative w-full md:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {["all", "sent", "draft", "scheduled"].map((status) => (
            <Button
              key={status}
              size="sm"
              variant={filterStatus === status ? "default" : "outline"}
              className="capitalize"
              onClick={() => setFilterStatus(status)}
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sent</TableHead>
              <TableHead>Open Rate</TableHead>
              <TableHead>Click Rate</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>From</TableHead>
              <TableHead className="w-[150px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((campaign) => (
              <TableRow key={campaign.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                      <Mail className="size-4" />
                    </div>
                    <div>
                      <div className="font-medium">{campaign.name}</div>
                      <div className="text-xs text-muted-foreground">{campaign.subject}</div>
                      {campaign.body ? (
                        <div className="mt-0.5 line-clamp-1 max-w-[340px] text-xs text-muted-foreground/70">
                          {campaign.body}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                <TableCell className="tabular-nums">{campaign.sent.toLocaleString()}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-14 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full bg-primary" style={{ width: getRate(campaign.opened, campaign.sent) }} />
                    </div>
                    <span className="text-xs font-semibold text-primary">{getRate(campaign.opened, campaign.sent)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-14 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full bg-primary" style={{ width: getRate(campaign.clicked, campaign.sent) }} />
                    </div>
                    <span className="text-xs font-semibold text-primary">{getRate(campaign.clicked, campaign.sent)}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{campaign.date}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="border-primary/30 text-primary">{campaign.list}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1.5">
                    {campaign.status !== "sent" ? (
                      <Button
                        size="sm"
                        className="h-8 gap-1.5"
                        disabled={sendingId === campaign.id}
                        onClick={() => handleStart(campaign)}
                      >
                        {sendingId === campaign.id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Send className="size-3.5" />
                        )}
                        {sendingId === campaign.id ? "Sending..." : "Send"}
                      </Button>
                    ) : null}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <EllipsisVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate("/email-tracking")}>
                          <Eye /> Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate("/campaign-analytics")}>
                          <ChartBar /> Analytics
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setEditing(campaign.raw);
                            setFormError("");
                            setShowModal(true);
                          }}
                        >
                          <Pencil /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(campaign)}>
                          <Copy /> Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(campaign.id)}
                        >
                          <Trash2 /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center px-4 py-16 text-center">
            <div className="mb-3 flex size-16 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Search className="size-7" />
            </div>
            <h3 className="text-base font-semibold">{loading ? "Loading campaigns..." : "No campaigns found"}</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {loading
                ? "Fetching your campaigns from NOVA."
                : "Create a campaign to start sending from your connected Gmail."}
            </p>
          </div>
        )}
      </Card>

      <CampaignFormDialog
        open={showModal}
        onOpenChange={(open) => {
          setShowModal(open);
          if (!open) setEditing(null);
        }}
        onSubmit={handleSave}
        submitting={saving}
        error={formError}
        initial={editing}
        title={editing ? "Edit Campaign" : "Create New Campaign"}
        submitLabel={editing ? "Save changes" : "Create Campaign"}
      />
    </div>
  );
}

export default Campaigns;
