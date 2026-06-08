import type { AuditLogRow } from "@/lib/admin-api/audit-log";

export type AuditVerbTone = "create" | "update" | "delete" | "neutral";

const API_PATH_RE = /\/api\/v\d+[^ \n)]*/gi;
const METHOD_API_RE = /(GET|POST|PATCH|PUT|DELETE)\s+(?:https?:\/\/[^\s]+\/api\/v\d+|\/api\/v\d+)[^\s)]*/gi;

export function stripRawApiFromText(text: string): string {
  if (!text) return "";
  return text
    .replace(/https?:\/\/[^\s)]+/gi, "")
    .replace(METHOD_API_RE, "")
    .replace(API_PATH_RE, "")
    .replace(/\(\s*\)/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function looksLikeApiPath(s: string): boolean {
  return /\/api\/v\d+/i.test(s) || /^https?:\/\//i.test(s) || /^(GET|POST|PATCH|PUT|DELETE)\s+\S/i.test(s);
}

function titleCaseWords(s: string): string {
  return s
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function snakeToHumanAction(act: string): string {
  const parts = act.split("_").filter(Boolean);
  if (parts.length < 2) return titleCaseWords(act);
  const verb = parts[parts.length - 1].toLowerCase();
  const noun = parts
    .slice(0, -1)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(" ");
  const vmap: Record<string, string> = {
    create: "Created",
    update: "Updated",
    delete: "Deleted",
    verify: "Verified",
    unverify: "Unverified",
    assign: "Assigned",
    approve: "Approved",
    block: "Blocked",
    unblock: "Unblocked",
  };
  const past = vmap[verb] ?? titleCaseWords(verb);
  return `${noun} ${past}`;
}

function pathToLabel(path: string, method: string): string | null {
  const p = path.replace(/^\/+|\/+$/g, "").replace(/\/+$/, "");
  const M = method ? method.toUpperCase() : "";

  if (/^admin\/profiles\/[^/]+\/?$/i.test(p)) {
    if (M === "PATCH" || M === "PUT") return "Profile Updated";
    if (M === "DELETE") return "Profile Deleted";
    if (M === "GET") return "Profile Viewed";
    if (!M) return "Profile Activity";
  }
  if (/^admin\/profiles\/?$/i.test(p) && M === "POST") return "Profile Created";

  if (/^admin\/branches\/\d+\/?$/i.test(p)) {
    if (M === "PATCH" || M === "PUT") return "Branch Updated";
    if (M === "DELETE") return "Branch Deleted";
    if (M === "GET") return "Branch Viewed";
    if (!M) return "Branch Activity";
  }
  if (/^admin\/branches\/?$/i.test(p) && M === "POST") return "Branch Created";

  if (/^admin\/staff\/\d+\/?$/i.test(p)) {
    if (M === "PATCH" || M === "PUT") return "Staff Updated";
    if (M === "DELETE") return "Staff Deleted";
    if (!M) return "Staff Activity";
  }
  if (/^admin\/staff\/?$/i.test(p) && M === "POST") return "Staff Created";

  const detail = /^admin\/([\w-]+)\/([^/]+)\/?$/i.exec(p);
  if (detail) {
    const noun = titleCaseWords(detail[1].replace(/-/g, " "));
    if (M === "POST") return `${noun} Created`;
    if (M === "PATCH" || M === "PUT") return `${noun} Updated`;
    if (M === "DELETE") return `${noun} Deleted`;
    if (M === "GET") return `${noun} Viewed`;
    if (!M) return `${noun} Activity`;
  }

  const listOnly = /^admin\/([\w-]+)\/?$/i.exec(p);
  if (listOnly && M === "POST") return `${titleCaseWords(listOnly[1].replace(/-/g, " "))} Created`;

  return null;
}

export function humanizeAuditAction(action: string, actionDisplay: string): string {
  const disp = (actionDisplay || "").trim();
  const act = (action || "").trim();
  if (disp && !looksLikeApiPath(disp)) return disp;

  const m = act.match(/^(GET|POST|PATCH|PUT|DELETE)\s+(\S+)/i);
  if (m) {
    let path = m[2];
    path = path.replace(/^https?:\/\/[^/]+/i, "");
    path = path.replace(/\/api\/v\d+\//i, "");
    const label = pathToLabel(path, m[1]);
    if (label) return label;
  }

  if (looksLikeApiPath(act)) {
    let path = act.replace(/^https?:\/\/[^/]+/i, "").replace(/\/api\/v\d+\//i, "");
    path = path.replace(/^\/+|\/+$/g, "");
    const label = pathToLabel(path, "");
    if (label) return label;
    return stripRawApiFromText(act) || "Activity";
  }

  if (act && /^[\w_]+$/.test(act)) return snakeToHumanAction(act);

  return disp || stripRawApiFromText(act) || "Activity";
}

export function getAuditVerbTone(humanLabel: string, rawAction: string): AuditVerbTone {
  const s = `${humanLabel} ${rawAction}`.toLowerCase();
  if (/\b(delete|deleted|remove|removed|destroy|destroyed)\b/.test(s)) return "delete";
  if (/\b(create|created|insert|imported)\b/.test(s)) return "create";
  if (/\b(update|updated|patch|edit|edited|modify|modified|verify|verified|unverify|assign|assigned|approve|approved|block|blocked|unblock)\b/.test(s))
    return "update";
  return "neutral";
}

export function prettyTargetFromResource(resource: string): string {
  if (!resource) return "";
  const r = resource.trim();
  const i = r.indexOf(":");
  if (i > 0) {
    const kind = r.slice(0, i).replace(/_/g, " ").trim();
    const id = r.slice(i + 1).trim();
    if (kind.toLowerCase() === "profile") return id;
    return `${titleCaseWords(kind)} ${id}`;
  }
  return r;
}

const ROLE_OPENER: Record<string, string> = {
  admin: "Admin",
  staff: "Staff",
  branch_manager: "Branch Manager",
};

export function formatAuditDetailsLine(row: AuditLogRow, humanAction: string): string {
  // Per UI requirement: show only the API-provided message (but cleaned),
  // and do not synthesize sentences in the UI layer.
  const cleaned = stripRawApiFromText(row.details || "");
  return cleaned || "-";
}

export function actionToneClass(tone: AuditVerbTone): string {
  switch (tone) {
    case "create":
      return "border-emerald-500/50 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/35 dark:text-emerald-100";
    case "update":
      return "border-sky-500/50 bg-sky-50 text-sky-900 dark:bg-sky-950/35 dark:text-sky-100";
    case "delete":
      return "border-red-500/50 bg-red-50 text-red-900 dark:bg-red-950/35 dark:text-red-100";
    default:
      return "border-border bg-muted/40 text-foreground";
  }
}
