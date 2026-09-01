import React, { useState } from "react";
import { Sparkles, Copy, Check, RefreshCw } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { craftEmail } from "../lib/novaChat";

const tones = ["Professional", "Friendly", "Urgent", "Casual", "Promotional"];

function MessageCrafting() {
  const [goal, setGoal] = useState("");
  const [audience, setAudience] = useState("VIP Customers");
  const [tone, setTone] = useState("Professional");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    setBusy(true);
    setError("");
    try {
      const data = await craftEmail({
        prompt: goal || "Write a campaign email",
        tone,
        audience,
        conversationTitle: "Message Crafting",
      });
      setDraft(typeof data === "string" ? data : JSON.stringify(data, null, 2));
    } catch (err) {
      setError(err.message || "Could not generate draft");
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!draft) return;
    await navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Message crafting</h2>
        <p className="text-sm text-muted-foreground md:text-base">
          Draft subject lines and bodies for a specific audience and tone.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Brief</CardTitle>
            <CardDescription>Tell NOVA what this email should achieve</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="goal">Campaign goal</Label>
              <Input
                id="goal"
                placeholder="e.g. Drive early access for summer sale"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="audience">Audience</Label>
              <select
                id="audience"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option>All Subscribers</option>
                <option>VIP Customers</option>
                <option>New Leads</option>
                <option>Inactive Users</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Tone</Label>
              <div className="flex flex-wrap gap-2">
                {tones.map((item) => (
                  <Button key={item} size="sm" variant={tone === item ? "default" : "secondary"} onClick={() => setTone(item)}>
                    {item}
                  </Button>
                ))}
              </div>
            </div>
            <Button onClick={generate} disabled={busy}>
              {busy ? <RefreshCw className="animate-spin" /> : <Sparkles />}
              {busy ? "Crafting..." : "Generate draft"}
            </Button>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Draft</CardTitle>
              <CardDescription>
                {audience} · {tone}
              </CardDescription>
            </div>
            {draft && <Badge variant="success">Ready</Badge>}
          </CardHeader>
          <CardContent className="grid gap-3">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Generated copy will appear here..."
              className="min-h-[280px]"
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={copy} disabled={!draft}>
                {copied ? <Check /> : <Copy />}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button variant="secondary" onClick={generate} disabled={busy}>
                <RefreshCw />
                Regenerate
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default MessageCrafting;
