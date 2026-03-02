import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, Save } from "lucide-react";

export default function SystemSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    otpExpiry: 5,
    matchScoreThreshold: 60,
    defaultCommissionRate: 8,
    notificationSchedule: "09:00",
    maintenanceMode: false,
    maxContactViews: 100,
    autoVerification: false,
  });

  const handleSave = () => {
    toast({ title: "Settings Saved", description: "System settings updated successfully" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">System Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Configure platform-wide settings</p>
        </div>
        <Button onClick={handleSave} className="gap-2"><Save className="h-4 w-4" /> Save Changes</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-elegant border-0">
          <CardHeader><CardTitle className="text-base">OTP & Security</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>OTP Expiry Duration (minutes)</Label>
              <Input type="number" value={settings.otpExpiry} onChange={(e) => setSettings({ ...settings, otpExpiry: +e.target.value })} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto Verification</Label>
                <p className="text-xs text-muted-foreground">Automatically verify profiles with complete data</p>
              </div>
              <Switch checked={settings.autoVerification} onCheckedChange={(v) => setSettings({ ...settings, autoVerification: v })} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant border-0">
          <CardHeader><CardTitle className="text-base">Matching</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Match Score Threshold (%)</Label>
              <Input type="number" value={settings.matchScoreThreshold} onChange={(e) => setSettings({ ...settings, matchScoreThreshold: +e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Max Contact Views (Free)</Label>
              <Input type="number" value={settings.maxContactViews} onChange={(e) => setSettings({ ...settings, maxContactViews: +e.target.value })} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant border-0">
          <CardHeader><CardTitle className="text-base">Commission Rules</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Default Commission Rate (%)</Label>
              <Input type="number" value={settings.defaultCommissionRate} onChange={(e) => setSettings({ ...settings, defaultCommissionRate: +e.target.value })} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant border-0">
          <CardHeader><CardTitle className="text-base">Notifications & Maintenance</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Daily Notification Time</Label>
              <Input type="time" value={settings.notificationSchedule} onChange={(e) => setSettings({ ...settings, notificationSchedule: e.target.value })} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-destructive">Maintenance Mode</Label>
                <p className="text-xs text-muted-foreground">Disable access for all non-admin users</p>
              </div>
              <Switch checked={settings.maintenanceMode} onCheckedChange={(v) => setSettings({ ...settings, maintenanceMode: v })} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
