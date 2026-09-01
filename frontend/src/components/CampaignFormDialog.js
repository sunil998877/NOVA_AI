import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

const empty = {
  title: "",
  workMail: "",
  scheduledDate: "",
};

export function CampaignFormDialog({
  open,
  onOpenChange,
  onSubmit,
  submitting,
  error,
  initial,
  title = "Create New Campaign",
  submitLabel = "Create Campaign",
}) {
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (!open) return;
    setForm({
      title: initial?.title || initial?.name || "",
      workMail: initial?.workMail || "",
      scheduledDate: initial?.scheduledDate
        ? String(initial.scheduledDate).slice(0, 16)
        : "",
    });
  }, [open, initial]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const scheduledDate = form.scheduledDate ? new Date(form.scheduledDate).toISOString() : null;
    onSubmit({
      title: form.title.trim(),
      workMail: form.workMail.trim() || null,
      scheduledDate,
      status: scheduledDate && new Date(scheduledDate) > new Date() ? "scheduled" : "draft",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="campaign-name">Campaign Name</Label>
              <Input
                id="campaign-name"
                placeholder="e.g., Summer Sale 2026"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="work-mail">Sender Gmail (workMail)</Label>
              <Input
                id="work-mail"
                type="email"
                placeholder="you@gmail.com"
                value={form.workMail}
                onChange={(e) => setForm({ ...form, workMail: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="scheduled-date">Schedule (optional)</Label>
              <Input
                id="scheduled-date"
                type="datetime-local"
                value={form.scheduledDate}
                onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !form.title.trim()}>
              {submitting ? "Saving..." : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
