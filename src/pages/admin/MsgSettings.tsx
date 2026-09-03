import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MessageSquare, Save } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/contexts/RoleContext";
import { formatDateTime } from "@/lib/format-date";
import {
  fetchMsgConfig,
  updateMsgConfig,
  type MsgConfigPatch,
} from "@/lib/admin-api/msg-config";
import { getApiErrorMessage } from "@/lib/admin-api/http";

const QUERY_KEY = ["admin", "msg-config"];

type FormState = {
  development_mode: boolean;
  auth_key: string;
  clear_auth_key: boolean;
  integrated_number: string;
  namespace: string;
};

const emptyForm: FormState = {
  development_mode: true,
  auth_key: "",
  clear_auth_key: false,
  integrated_number: "",
  namespace: "",
};

export default function MsgSettings() {
  const { role } = useRole();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(emptyForm);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchMsgConfig,
    enabled: role === "admin",
  });

  useEffect(() => {
    if (!data) return;
    setForm({
      development_mode: data.development_mode,
      auth_key: "",
      clear_auth_key: false,
      integrated_number: data.integrated_number,
      namespace: data.namespace,
    });
  }, [data]);

  const saveMut = useMutation({
    mutationFn: () => {
      const patch: MsgConfigPatch = {
        development_mode: form.development_mode,
        integrated_number: form.integrated_number.trim(),
        namespace: form.namespace.trim(),
      };
      if (form.clear_auth_key) {
        patch.clear_auth_key = true;
      } else if (form.auth_key.trim()) {
        patch.auth_key = form.auth_key.trim();
      }
      return updateMsgConfig(patch);
    },
    onSuccess: (updated) => {
      qc.setQueryData(QUERY_KEY, updated);
      setForm((f) => ({ ...f, auth_key: "", clear_auth_key: false }));
      toast({
        title: "MSG settings saved",
        description: "WhatsApp / OTP settings were updated successfully.",
      });
    },
    onError: (err) => {
      toast({
        title: "Could not save MSG settings",
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
        Loading MSG settings…
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
            <MessageSquare className="h-6 w-6 text-primary" />
            MSG Settings
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            MSG91 WhatsApp OTP and template delivery. Development Mode skips real sends and autofills OTPs.
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
            <CardTitle className="text-base">Delivery mode</CardTitle>
            <CardDescription>
              When Development Mode is on, OTPs are printed / returned for UI autofill and WhatsApp templates are not sent.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="development_mode">Development Mode</Label>
                <p className="text-xs text-muted-foreground">
                  Turn off only when MSG91 is configured for production WhatsApp delivery.
                </p>
              </div>
              <Switch
                id="development_mode"
                checked={Boolean(form.development_mode)}
                onCheckedChange={(checked) =>
                  setForm({ ...form, development_mode: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant border-0">
          <CardHeader>
            <CardTitle className="text-base">MSG91 Auth Key</CardTitle>
            <CardDescription>
              Stored key overrides <code className="text-xs">MSG91_AUTH_KEY</code> in the environment.
              Leave blank on save to keep the current value.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="auth_key">Auth key</Label>
              <Input
                id="auth_key"
                type="password"
                autoComplete="new-password"
                value={form.auth_key}
                onChange={(e) =>
                  setForm({ ...form, auth_key: e.target.value, clear_auth_key: false })
                }
                placeholder={
                  data?.auth_key_masked
                    ? `Current: ${data.auth_key_masked}`
                    : "Paste MSG91 authkey"
                }
              />
              <p className="text-xs text-muted-foreground">
                {data?.using_env_fallback
                  ? "Currently using environment fallback (no DB key stored)."
                  : data?.auth_key_set
                    ? "A key is configured (masked above)."
                    : "No auth key configured yet."}
              </p>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="clear_auth_key">Clear stored key</Label>
                <p className="text-xs text-muted-foreground">
                  Remove the DB key and fall back to the environment variable.
                </p>
              </div>
              <Switch
                id="clear_auth_key"
                checked={Boolean(form.clear_auth_key)}
                onCheckedChange={(checked) =>
                  setForm({
                    ...form,
                    clear_auth_key: checked,
                    auth_key: checked ? "" : form.auth_key,
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant border-0 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">WhatsApp sender</CardTitle>
            <CardDescription>
              Integrated number and template namespace used for OTP, registration, and subscription messages.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="integrated_number">Integrated number</Label>
              <Input
                id="integrated_number"
                value={form.integrated_number}
                onChange={(e) => setForm({ ...form, integrated_number: e.target.value })}
                placeholder="918590123876"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="namespace">Template namespace</Label>
              <Input
                id="namespace"
                value={form.namespace}
                onChange={(e) => setForm({ ...form, namespace: e.target.value })}
                placeholder="2a0ae24e_63d6_47b2_85f4_b18d0d9e2acb"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
