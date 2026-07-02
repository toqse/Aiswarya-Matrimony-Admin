import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, Smartphone } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/contexts/RoleContext";
import { formatDateTime } from "@/lib/format-date";
import { fetchAppConfig, updateAppConfig, type AppConfigPatch } from "@/lib/admin-api/app-config";
import { getApiErrorMessage } from "@/lib/admin-api/http";

const QUERY_KEY = ["admin", "app-config"];

type FormState = AppConfigPatch;

const emptyForm: FormState = {
  android_version: "",
  ios_version: "",
  android_force_update: false,
  ios_force_update: false,
};

export default function AppConfig() {
  const { role } = useRole();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(emptyForm);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchAppConfig,
    enabled: role === "admin",
  });

  useEffect(() => {
    if (!data) return;
    setForm({
      android_version: data.android_version,
      ios_version: data.ios_version,
      android_force_update: data.android_force_update,
      ios_force_update: data.ios_force_update,
    });
  }, [data]);

  const saveMut = useMutation({
    mutationFn: () => updateAppConfig(form),
    onSuccess: (updated) => {
      qc.setQueryData(QUERY_KEY, updated);
      toast({
        title: "App config saved",
        description: "Mobile app version settings were updated successfully.",
      });
    },
    onError: (err) => {
      toast({
        title: "Could not save app config",
        description: getApiErrorMessage(err),
        variant: "destructive",
      });
    },
  });

  if (role !== "admin") {
    return <Navigate to="/" replace />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[240px] text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading app config…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        {getApiErrorMessage(error)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Smartphone className="h-6 w-6 text-primary" />
            Mobile App Versions
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Set minimum app versions and force-update flags for Android and iOS clients.
          </p>
          {data?.updated_at ? (
            <p className="text-xs text-muted-foreground mt-2">
              Last updated: {formatDateTime(data.updated_at)}
            </p>
          ) : null}
        </div>
        <Button
          onClick={() => saveMut.mutate()}
          disabled={saveMut.isPending}
          className="gap-2 shrink-0"
        >
          {saveMut.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-elegant border-0">
          <CardHeader>
            <CardTitle className="text-base">Android</CardTitle>
            <CardDescription>
              Version string compared by the Android app on launch (e.g. 1.2.0).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="android_version">App version</Label>
              <Input
                id="android_version"
                value={form.android_version ?? ""}
                onChange={(e) => setForm({ ...form, android_version: e.target.value })}
                placeholder="1.0.0"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="android_force_update">Force update</Label>
                <p className="text-xs text-muted-foreground">
                  Block app usage until the user updates from the Play Store.
                </p>
              </div>
              <Switch
                id="android_force_update"
                checked={Boolean(form.android_force_update)}
                onCheckedChange={(checked) =>
                  setForm({ ...form, android_force_update: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant border-0">
          <CardHeader>
            <CardTitle className="text-base">iOS</CardTitle>
            <CardDescription>
              Version string compared by the iOS app on launch (e.g. 1.2.0).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ios_version">App version</Label>
              <Input
                id="ios_version"
                value={form.ios_version ?? ""}
                onChange={(e) => setForm({ ...form, ios_version: e.target.value })}
                placeholder="1.0.0"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="ios_force_update">Force update</Label>
                <p className="text-xs text-muted-foreground">
                  Block app usage until the user updates from the App Store.
                </p>
              </div>
              <Switch
                id="ios_force_update"
                checked={Boolean(form.ios_force_update)}
                onCheckedChange={(checked) =>
                  setForm({ ...form, ios_force_update: checked })
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
