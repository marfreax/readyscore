/**
 * Subject-context navigation rules shared by the global SubjectSwitcher.
 *
 * Detail routes are bound to the previously active subject. After switching
 * subjects, those URLs can no longer safely represent the new subject.
 * Navigate to the corresponding subject-safe collection/entry page instead
 * of reloading a stale resource URL.
 */
export function getSubjectSwitchFallback(pathname: string): string | null {
  const path = pathname.split("?")[0].split("#")[0];

  if (/^\/result\/[^/]+(?:\/.*)?$/.test(path)) return "/results";
  if (/^\/reports\/[^/]+(?:\/parent)?$/.test(path)) return "/reports";
  if (/^\/assessments\/[^/]+\/(?:test|pre-test)$/.test(path)) return "/assessments";
  if (/^\/reassessment\/[^/]+$/.test(path)) return "/assessments";

  // Commercial checkout is also subject-scoped. Never carry a stale product
  // checkout context across a subject switch.
  if (/^\/checkout\//.test(path)) return "/access";

  return null;
}
