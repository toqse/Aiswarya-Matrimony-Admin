import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Download, Search, Loader2, CheckCircle, Clock, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  fetchJathagamHoroscopes,
  type AstrologyHoroscopeRow,
} from "@/lib/admin-api/horoscope";
import { adminFetchBlob, downloadBlob } from "@/lib/api-client";
import type { UserRole } from "@/types/user-role";
import { formatDate } from "@/lib/format-date";

/**
 * Toggle for the Jathagam PDF download buttons (per-row "Jathagam" + bulk
 * "Download All Ready"). Hidden in the UI for now; flip to `true` to restore.
 */
const SHOW_JATHAGAM_DOWNLOADS = false;

/** Ready when the EXE has produced a full 11-char pr_rasi chart string. */
function isReady(h: AstrologyHoroscopeRow): boolean {
  return !!(h.pr_rasi && h.pr_rasi.length === 11);
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  loading,
}: {
  label: string;
  value: number;
  icon: typeof FileText;
  color: string;
  loading: boolean;
}) {
  return (
    <Card className="shadow-elegant border-0">
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">
              {loading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : value}
            </p>
          </div>
          <Icon className={`h-7 w-7 ${color} opacity-60`} />
        </div>
      </CardContent>
    </Card>
  );
}

export function JathagamTab({ active, role, branchId }: { active: boolean; role: UserRole; branchId?: number }) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterPending, setFilterPending] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [downloadingThalakkuriId, setDownloadingThalakkuriId] = useState<number | null>(null);
  const [bulkRunning, setBulkRunning] = useState(false);

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["astrology", "jathagam", "records", role, branchId],
    queryFn: () => fetchJathagamHoroscopes(role, { page: 1, page_size: 100, branch_id: branchId }),
    enabled: active,
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Failed to load horoscopes",
        description: error instanceof Error ? error.message : "Request failed",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const horoscopes = useMemo(() => data ?? [], [data]);
  const total = horoscopes.length;
  const generated = useMemo(() => horoscopes.filter(isReady).length, [horoscopes]);
  const pending = total - generated;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return horoscopes.filter((h) => {
      const matchSearch = !q || h.name.toLowerCase().includes(q);
      const matchFilter = filterPending ? !isReady(h) : true;
      return matchSearch && matchFilter;
    });
  }, [horoscopes, search, filterPending]);

  const readyCount = generated;

  function pdfFilename(h: AstrologyHoroscopeRow): string {
    const name = (h.name || String(h.horoscope_id)).trim().replace(/\s+/g, "_") || String(h.horoscope_id);
    return h.pr_dob ? `jathagam_${name}_${h.pr_dob}.pdf` : `jathagam_${name}.pdf`;
  }

  async function downloadPdfBlob(h: AstrologyHoroscopeRow): Promise<void> {
    const { ok, status, blob } = await adminFetchBlob(`v1/admin/horoscope/jathagam/${h.horoscope_id}/`);
    if (!ok) throw new Error(`PDF generation failed (HTTP ${status}).`);
    const pdfBlob = new Blob([blob], { type: "application/pdf" });
    downloadBlob(pdfBlob, pdfFilename(h));
  }

  // Backend generates the PDF on-demand from the horoscope id using the authenticated admin API helper.
  async function downloadPDF(h: AstrologyHoroscopeRow) {
    setDownloadingId(h.horoscope_id);
    try {
      await downloadPdfBlob(h);
    } catch (e) {
      console.error("PDF download failed:", e);
      toast({
        title: "Download failed",
        description: "PDF generation failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloadingId(null);
    }
  }

  // Thalakkuri PDF — separate on-demand backend document, same authenticated helper.
  async function downloadThalakkuri(h: AstrologyHoroscopeRow) {
    setDownloadingThalakkuriId(h.horoscope_id);
    try {
      const { ok, status, blob } = await adminFetchBlob(
        `v1/admin/horoscope/thalakkuri/${h.horoscope_id}/`,
      );
      if (!ok) throw new Error(`Thalakkuri generation failed (HTTP ${status}).`);
      const name = (h.name || String(h.horoscope_id)).trim().replace(/\s+/g, "_") || String(h.horoscope_id);
      const fileName = h.pr_dob ? `thalakkuri_${name}_${h.pr_dob}.pdf` : `thalakkuri_${name}.pdf`;
      const pdfBlob = new Blob([blob], { type: "application/pdf" });
      downloadBlob(pdfBlob, fileName);
    } catch (e) {
      console.error("Thalakkuri download failed:", e);
      toast({
        title: "Download failed",
        description: "Thalakkuri generation failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloadingThalakkuriId(null);
    }
  }

  async function handleBulkDownload() {
    const ready = horoscopes.filter(isReady);
    if (ready.length === 0) {
      toast({ title: "Nothing to download", description: "No ready horoscopes found." });
      return;
    }
    setBulkRunning(true);
    toast({ title: "Downloading", description: `Preparing ${ready.length} Jathagam PDF(s)…` });
    let failed = 0;
    for (const h of ready) {
      setDownloadingId(h.horoscope_id);
      try {
        await downloadPdfBlob(h);
      } catch {
        failed += 1;
      }
      // Small gap so the browser handles each download separately.
      await new Promise((r) => setTimeout(r, 800));
    }
    setDownloadingId(null);
    setBulkRunning(false);
    toast({
      title: "Bulk download complete",
      description: failed > 0 ? `${ready.length - failed} downloaded, ${failed} failed.` : `${ready.length} downloaded.`,
      variant: failed > 0 ? "destructive" : undefined,
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Thalakkuri Generated" value={generated} icon={FileText} color="text-success" loading={isLoading} />
        <StatCard label="Pending" value={pending} icon={Clock} color="text-warning" loading={isLoading} />
        <StatCard label="Total Horoscopes" value={total} icon={Star} color="text-accent" loading={isLoading} />
      </div>

      <Card className="shadow-elegant border-0">
        <CardContent className="pt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search member name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant={filterPending ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterPending((v) => !v)}
            >
              <Clock className="h-4 w-4 mr-1" /> Pending Only
            </Button>
            {SHOW_JATHAGAM_DOWNLOADS && (
              <Button size="sm" onClick={handleBulkDownload} disabled={bulkRunning || readyCount === 0}>
                {bulkRunning ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
                Download All Ready{readyCount > 0 ? ` (${readyCount})` : ""}
              </Button>
            )}
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Star</TableHead>
                  <TableHead>Date of Birth</TableHead>
                  <TableHead>Dasa</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin inline mr-2" /> Loading…
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No members found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((h, idx) => {
                    const ready = isReady(h);
                    return (
                      <TableRow key={h.horoscope_id || `${h.name}-${idx}`}>
                        <TableCell className="font-medium">{h.name || "—"}</TableCell>
                        <TableCell className="text-sm">{h.star_display || "—"}</TableCell>
                        <TableCell className="text-sm">{formatDate(h.pr_dob)}</TableCell>
                        <TableCell className="text-sm">{h.dasa_display || "—"}</TableCell>
                        <TableCell>
                          {ready ? (
                            <Badge className="bg-success/10 text-success text-[10px] gap-1">
                              <CheckCircle className="h-3 w-3" /> Ready
                            </Badge>
                          ) : (
                            <Badge className="bg-warning/10 text-warning text-[10px] gap-1">
                              <Clock className="h-3 w-3" /> Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {ready ? (
                            <div className="flex items-center justify-end gap-1.5">
                              {SHOW_JATHAGAM_DOWNLOADS && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => downloadPDF(h)}
                                  disabled={downloadingId === h.horoscope_id || bulkRunning}
                                  title="Download Jathagam PDF"
                                >
                                  {downloadingId === h.horoscope_id ? (
                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                  ) : (
                                    <Download className="h-4 w-4 mr-1" />
                                  )}
                                  Jathagam
                                </Button>
                              )}
                              <Button
                                size="sm"
                                onClick={() => downloadThalakkuri(h)}
                                disabled={downloadingThalakkuriId === h.horoscope_id || bulkRunning}
                                title="Download Thalakkuri PDF"
                                className="bg-[#1a4a8b] text-white hover:bg-[#123a6d]"
                              >
                                {downloadingThalakkuriId === h.horoscope_id ? (
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                ) : (
                                  <Download className="h-4 w-4 mr-1" />
                                )}
                                Thalakkuri
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Generate Horoscope</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {filtered.length} shown{total ? ` · ${total} total` : ""}
              {isFetching && !isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin inline ml-2" /> : null}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
