export function trackFunnelEvent(event: string, attemptId?: string) {
  void fetch("/api/funnel/event", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ event, ...(attemptId ? { attemptId } : {}) }), keepalive: true }).catch(() => {});
}
