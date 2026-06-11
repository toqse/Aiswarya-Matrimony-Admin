import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { formatPhoneForApi } from "@/lib/phone";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRole } from "@/contexts/RoleContext";
import { fetchAdminMe, sendChangePhoneOtp, updateAdminMe, verifyChangePhoneOtp } from "@/lib/admin-api/me";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Building2, Shield, Phone, Loader2 } from "lucide-react";

const roleLabels: Record<string, string> = {
  admin: "Admin",
  staff: "Staff",
  "branch-manager": "Branch Manager",
};

export default function MyProfile() {
  const { role, branch } = useRole();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [newMobile, setNewMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "me"],
    queryFn: fetchAdminMe,
  });

  const saveMut = useMutation({
    mutationFn: () => updateAdminMe({ name: name.trim(), email: email.trim() }),
    onSuccess: () => {
      toast({ title: "Profile updated" });
      setEditOpen(false);
      qc.invalidateQueries({ queryKey: ["admin", "me"] });
    },
    onError: (e: Error) => toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  });

  const sendOtpMut = useMutation({
    mutationFn: () => sendChangePhoneOtp(formatPhoneForApi(newMobile)),
    onSuccess: (d) => {
      setOtpSent(true);
      toast({
        title: "OTP sent successfully.",
        description: d.otp ? `OTP (debug): ${d.otp}` : undefined,
      });
    },
    onError: (e: Error) => toast({ title: "Could not send OTP", description: e.message, variant: "destructive" }),
  });

  const verifyOtpMut = useMutation({
    mutationFn: () => verifyChangePhoneOtp({ new_mobile: formatPhoneForApi(newMobile), otp: otp.trim() }),
    onSuccess: () => {
      toast({ title: "Mobile number updated successfully." });
      setPhoneOpen(false);
      setOtp("");
      setNewMobile("");
      setOtpSent(false);
      qc.invalidateQueries({ queryKey: ["admin", "me"] });
    },
    onError: (e: Error) => toast({ title: "OTP verification failed", description: e.message, variant: "destructive" }),
  });

  const user = {
    name: data?.name ?? "—",
    email: data?.email ?? "—",
    role: data?.role_display ?? roleLabels[role] ?? role,
    branch:
      branch?.name ??
      (role === "admin" ? "Head Office" : role === "branch-manager" ? "—" : "—"),
    mobile: data?.mobile_display ?? data?.mobile ?? "—",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">Your account information</p>
      </div>
      {error && <p className="text-sm text-destructive">{(error as Error).message}</p>}
      {isLoading && (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading profile...
        </div>
      )}

      <Card className="shadow-elegant border-0 max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Account details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium">{user.name}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b gap-2">
            <span className="text-muted-foreground flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </span>
            <span className="font-medium">{user.email}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted-foreground flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Role
            </span>
            <span className="font-medium">{user.role}</span>
          </div>
          {(role === "staff" || role === "branch-manager") && (
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Branch
              </span>
              <span className="font-medium">{user.branch}</span>
            </div>
          )}
          <div className="flex justify-between items-center py-2">
            <span className="text-muted-foreground flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Mobile
            </span>
            <span className="font-medium">{user.mobile}</span>
          </div>
          <div className="pt-2 flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setName(data?.name ?? "");
                setEmail(data?.email ?? "");
                setEditOpen(true);
              }}
            >
              Edit profile
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setPhoneOpen(true);
                setOtp("");
                setNewMobile("");
                setOtpSent(false);
              }}
            >
              Change phone
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saveMut.isPending}>Cancel</Button>
            <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
              {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={phoneOpen} onOpenChange={setPhoneOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change phone number</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <PhoneInput value={newMobile} onChange={setNewMobile} />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => sendOtpMut.mutate()} disabled={sendOtpMut.isPending || !newMobile.trim()}>
                {sendOtpMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send OTP"}
              </Button>
            </div>
            <Input placeholder="Enter 6-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} disabled={!otpSent} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPhoneOpen(false)} disabled={verifyOtpMut.isPending}>Cancel</Button>
            <Button onClick={() => verifyOtpMut.mutate()} disabled={!otpSent || !otp.trim() || verifyOtpMut.isPending}>
              {verifyOtpMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
