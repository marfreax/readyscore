"use client";
import { useEffect } from "react";
import { trackFunnelEvent } from "../../lib/client-funnel";
export default function FunnelPageTracker({ event, attemptId }: { event: string; attemptId?: string }) {
  useEffect(() => { trackFunnelEvent(event, attemptId); }, [event, attemptId]);
  return null;
}
