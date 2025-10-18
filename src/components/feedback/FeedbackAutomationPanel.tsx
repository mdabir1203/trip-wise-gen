import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Activity, MessageCircle, RefreshCw, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import type { FeedbackAutomation } from "@/hooks/use-feedback-automation";

interface FeedbackAutomationPanelProps {
  automation: FeedbackAutomation;
}

export function FeedbackAutomationPanel({ automation }: FeedbackAutomationPanelProps) {
  const {
    feedbackEntries,
    loading,
    error,
    promptOpen,
    automationActive,
    setPromptOpen,
    submitFeedback,
    refreshFeedback,
  } = automation;

  const [rating, setRating] = useState("5");
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const averageRating = useMemo(() => {
    if (!feedbackEntries.length) return 0;
    const total = feedbackEntries.reduce((sum, entry) => sum + entry.rating, 0);
    return total / feedbackEntries.length;
  }, [feedbackEntries]);

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error("Please share a short message with your rating");
      return;
    }

    setSubmitting(true);
    const result = await submitFeedback({
      rating: Number(rating),
      message: message.trim(),
      contact: contact.trim() || undefined,
    });

    setSubmitting(false);

    if (result.success) {
      toast.success("Thanks for the feedback! We'll keep iterating.");
      setMessage("");
      setContact("");
      setRating("5");
    } else {
      toast.error(result.error ?? "Unable to submit feedback");
    }
  };

  return (
    <Card className="rounded-3xl border-none bg-muted/40 p-6">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Activity className="h-4 w-4" /> Customer Feedback Automation
        </CardTitle>
        <CardDescription>
          Continuous capture of traveler insights keeps Trip Wise improving.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-0 pb-0">
        <div className="flex items-center justify-between rounded-2xl bg-background/80 p-4">
          <div>
            <p className="text-sm font-semibold">Automation status</p>
            <p className="text-xs text-muted-foreground">
              {automationActive ? "Feedback stream active" : "Waiting for first feedback entry"}
            </p>
          </div>
          <Button variant="outline" size="icon" className="rounded-full" onClick={() => void refreshFeedback()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <div className="space-y-2 rounded-2xl bg-background/80 p-4">
          <div className="flex items-center justify-between text-sm font-medium">
            <span>Rolling satisfaction</span>
            <span className="text-muted-foreground">{averageRating ? averageRating.toFixed(1) : "–"} / 5</span>
          </div>
          <Progress value={averageRating ? (averageRating / 5) * 100 : 0} className="h-2" />
        </div>

        <Dialog open={promptOpen} onOpenChange={setPromptOpen}>
          <DialogTrigger asChild>
            <Button className="w-full rounded-2xl" variant="secondary">
              <MessageCircle className="mr-2 h-4 w-4" /> Share feedback
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>We value your experience</DialogTitle>
              <DialogDescription>
                Tell us how Trip Wise supported your planning so we can fine-tune future releases.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rating">Rating</Label>
                <Select value={rating} onValueChange={setRating}>
                  <SelectTrigger id="rating" className="rounded-2xl">
                    <SelectValue placeholder="Rate your experience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 - Exceptional</SelectItem>
                    <SelectItem value="4">4 - Great</SelectItem>
                    <SelectItem value="3">3 - Good</SelectItem>
                    <SelectItem value="2">2 - Needs work</SelectItem>
                    <SelectItem value="1">1 - Disappointed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">What should we know?</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={4}
                  placeholder="Packing, reminders, weather... tell us what stood out."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact">Contact (optional)</Label>
                <Input
                  id="contact"
                  value={contact}
                  onChange={(event) => setContact(event.target.value)}
                  placeholder="Email or phone if you'd like a follow-up"
                />
              </div>
              <Button onClick={() => void handleSubmit()} disabled={submitting} className="w-full rounded-2xl">
                <Send className="mr-2 h-4 w-4" /> {submitting ? "Sending..." : "Submit feedback"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <div className="rounded-2xl border border-dashed border-primary/20 bg-background/60 p-4">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Recent feedback</p>
          <ScrollArea className="mt-3 max-h-48">
            <div className="space-y-3 pr-2">
              {feedbackEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No responses yet. Automated prompts will encourage travelers after every checklist run.
                </p>
              ) : (
                feedbackEntries.map((entry) => (
                  <div key={entry.id} className="rounded-xl bg-background p-3 shadow-sm">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{`Rating: ${entry.rating}/5`}</span>
                      <span>{formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}</span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed">{entry.message}</p>
                    {entry.contact && (
                      <p className="mt-1 text-xs text-muted-foreground">Contact: {entry.contact}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
