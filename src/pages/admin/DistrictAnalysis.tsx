import { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  fetchDistrictAnalysis,
  fetchDistrictAnalysisGeoJson,
} from "@/lib/admin-api/district-analysis";
import { Loader2, MapPin } from "lucide-react";

export default function DistrictAnalysis() {
  const [stateIdText, setStateIdText] = useState("");

  const stateId = useMemo(() => {
    const n = Number(stateIdText.trim());
    return Number.isInteger(n) && n > 0 ? n : undefined;
  }, [stateIdText]);

  const [metricsQ, geoQ] = useQueries({
    queries: [
      {
        queryKey: ["admin", "district-analysis", "cards", stateId],
        queryFn: () => fetchDistrictAnalysis({ stateId }),
      },
      {
        queryKey: ["admin", "district-analysis", "geojson", stateId],
        queryFn: () => fetchDistrictAnalysisGeoJson({ stateId }),
      },
    ],
  });

  const isLoading = metricsQ.isLoading || geoQ.isLoading;
  const err = (metricsQ.error || geoQ.error) as Error | null;
  const districtData = metricsQ.data ?? [];
  const geoFeatures = geoQ.data?.features?.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-primary rounded-full" />
          <div>
            <h1 className="text-2xl font-bold">Comprehensive District Analytics</h1>
            <p className="text-sm text-muted-foreground">
              GeoJSON features loaded: {geoFeatures.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            value={stateIdText}
            onChange={(e) => setStateIdText(e.target.value)}
            placeholder="State ID (optional)"
            className="sm:w-44"
          />
        </div>
      </div>

      {err && <p className="text-sm text-destructive">{err.message}</p>}
      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading district analytics...
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {districtData.map((d) => (
          <Card key={d.district_id} className="border border-border hover:border-primary/40 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-5">
                <MapPin className="h-4 w-4 text-pink-500" />
                <h3 className="font-bold text-lg">{d.district}</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Registrations</span>
                  <span className="font-bold text-base">{d.registrations.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Paid Users</span>
                  <span className="font-bold text-base">{d.paid_users.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {!isLoading && !err && districtData.length === 0 && (
        <p className="text-sm text-muted-foreground">No district analytics data found for this filter.</p>
      )}
    </div>
  );
}
