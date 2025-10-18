import { useCallback, useEffect, useMemo, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

interface FeedbackInsert {
  rating: number;
  message: string;
  contact?: string;
}

export interface FeedbackEntry extends FeedbackInsert {
  id: string;
  created_at: string;
}

export interface FeedbackAutomation {
  feedbackEntries: FeedbackEntry[];
  loading: boolean;
  error: string | null;
  promptOpen: boolean;
  automationActive: boolean;
  setPromptOpen: (open: boolean) => void;
  submitFeedback: (payload: FeedbackInsert) => Promise<{ success: boolean; error?: string }>;
  registerTripGeneration: () => void;
  refreshFeedback: () => Promise<void>;
}

export function useFeedbackAutomation(): FeedbackAutomation {
  const [feedbackEntries, setFeedbackEntries] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promptOpen, setPromptOpen] = useState(false);
  const [lastPrompt, setLastPrompt] = useState<number>(0);

  const refreshFeedback = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: queryError } = await supabase
        .from("feedback")
        .select("id, rating, message, contact, created_at")
        .order("created_at", { ascending: false })
        .limit(10);

      if (queryError) throw queryError;

      setFeedbackEntries(data ?? []);
    } catch (refreshError) {
      console.error("Failed to refresh feedback", refreshError);
      setError(refreshError instanceof Error ? refreshError.message : "Unable to fetch feedback");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshFeedback();
    const interval = window.setInterval(() => {
      void refreshFeedback();
    }, 60_000);

    return () => window.clearInterval(interval);
  }, [refreshFeedback]);

  useEffect(() => {
    const channel = supabase
      .channel("feedback-automation")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "feedback" },
        (payload) => {
          const newEntry = payload.new as FeedbackEntry;
          setFeedbackEntries((entries) => [newEntry, ...entries].slice(0, 10));
        }
      )
      .subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, []);

  const submitFeedback = useCallback(
    async (payload: FeedbackInsert) => {
      try {
        const { error: insertError } = await supabase.from("feedback").insert(payload);

        if (insertError) throw insertError;

        setPromptOpen(false);
        setLastPrompt(Date.now());
        return { success: true };
      } catch (submitError) {
        console.error("Unable to submit feedback", submitError);
        return {
          success: false,
          error: submitError instanceof Error ? submitError.message : "Unknown error",
        };
      }
    },
    []
  );

  const registerTripGeneration = useCallback(() => {
    setPromptOpen(true);
    setLastPrompt(Date.now());
  }, []);

  useEffect(() => {
    if (!lastPrompt) return;

    const timeout = window.setTimeout(() => {
      setPromptOpen(true);
    }, 5 * 60_000);

    return () => window.clearTimeout(timeout);
  }, [lastPrompt]);

  const automationActive = useMemo(() => loading || feedbackEntries.length > 0, [feedbackEntries.length, loading]);

  return {
    feedbackEntries,
    loading,
    error,
    promptOpen,
    automationActive,
    setPromptOpen,
    submitFeedback,
    registerTripGeneration,
    refreshFeedback,
  };
}
