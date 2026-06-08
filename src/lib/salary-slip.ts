import { getMatrimonyAdminSession } from "@/lib/matrimony-admin-storage";

type SlipStatus = string | null | undefined;

export interface SalarySlipData {
  title?: string;
  employeeCode?: string | number | null;
  name?: string | null;
  branch?: string | null;
  designation?: string | null;
  status?: SlipStatus;
  month?: string | null;
  year?: string | number | null;
  basic?: string | number | null;
  commission?: string | number | null;
  allowances?: string | number | null;
  deductions?: string | number | null;
  gross?: string | number | null;
  net?: string | number | null;
}

function asAmount(value: unknown): string {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return "0.00";
  return n.toFixed(2);
}

function show(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}

function esc(text: unknown): string {
  return String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderRow(label: string, value: string): string {
  return `<div class="row"><span class="label">${esc(label)}</span><span class="sep">:</span><span class="value">${esc(value)}</span></div>`;
}

function statusClass(status: SlipStatus): string {
  const s = String(status ?? "").toLowerCase();
  if (s === "active" || s === "paid" || s === "approved") return "ok";
  if (s === "draft" || s === "pending") return "warn";
  return "";
}

export function openSalarySlipWindow(data: SalarySlipData): void {
  const session = getMatrimonyAdminSession();
  const now = new Date();
  const formattedDate = now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const formattedTime = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  const monthText = [show(data.month), data.year ? String(data.year) : ""].filter((x) => x !== "—" && x !== "").join(" ");
  const status = show(data.status);

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Salary Slip</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #f4f4f6; font-family: Arial, sans-serif; color: #111827; }
    .sheet { width: 820px; margin: 20px auto; background: #fff; border: 1px solid #e5e7eb; }
    .head { border-bottom: 2px solid #9f1239; padding: 22px 26px 16px; }
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand-mark { font-size: 34px; font-weight: 800; color: #9f1239; line-height: 1; }
    .title { margin: 6px 0 0; text-align: center; color: #881337; font-size: 36px; font-weight: 700; }
    .content { padding: 14px 24px 8px; }
    .row { display: grid; grid-template-columns: 210px 20px 1fr; padding: 13px 4px; border-bottom: 1px dashed #e5e7eb; align-items: center; }
    .label { color: #4b5563; font-size: 14px; }
    .sep { color: #9ca3af; text-align: center; }
    .value { color: #111827; font-weight: 700; font-size: 22px; }
    .value.status.ok { color: #9f1239; }
    .value.status.warn { color: #92400e; }
    .foot { margin-top: 12px; background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 12px 24px; display: flex; gap: 30px; }
    .meta { color: #6b7280; font-size: 12px; }
    .meta b { color: #111827; display: block; margin-top: 3px; font-size: 14px; }
    @media print {
      body { background: #fff; }
      .sheet { margin: 0; width: auto; border: 0; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="head">
      <div class="brand">
        <div class="brand-mark">AVB</div>
      </div>
      <div class="title">${esc(data.title || "Salary Slip")}</div>
    </div>
    <div class="content">
      ${renderRow("Employee Code", show(data.employeeCode || "EMP"))}
      ${renderRow("Name", show(data.name || session?.name || "Staff"))}
      ${renderRow("Branch", show(data.branch || session?.branch?.name || "—"))}
      ${renderRow("Designation", show(data.designation || "Staff"))}
      ${renderRow("Status", status)}
      ${renderRow("Month", monthText || "—")}
      ${renderRow("Commission %", "—")}
      ${renderRow("Basic Salary", asAmount(data.basic))}
      ${renderRow("Commission", asAmount(data.commission))}
      ${renderRow("Allowances", asAmount(data.allowances))}
      ${renderRow("Deductions", asAmount(data.deductions))}
      ${renderRow("Gross", asAmount(data.gross))}
      ${renderRow("Net", asAmount(data.net))}
    </div>
    <div class="foot">
      <div class="meta">Date<b>${esc(formattedDate)}</b></div>
      <div class="meta">Time<b>${esc(formattedTime)}</b></div>
    </div>
  </div>
  <script>
    window.onload = () => window.print();
  </script>
</body>
</html>`;

  const win = window.open("", "_blank", "noopener,noreferrer,width=900,height=900");
  if (!win) throw new Error("Pop-up blocked. Please allow pop-ups to print salary slip.");
  win.document.open();
  win.document.write(html);
  win.document.close();

  const statusNode = win.document.querySelector(".row:nth-child(5) .value");
  if (statusNode && statusClass(data.status)) {
    statusNode.classList.add("status", statusClass(data.status));
  }
}

