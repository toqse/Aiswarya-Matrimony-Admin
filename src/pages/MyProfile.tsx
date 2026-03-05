import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRole } from "@/contexts/RoleContext";
import { User, Mail, Building2, Shield } from "lucide-react";

const roleLabels: Record<string, string> = {
  admin: "Admin",
  staff: "Staff",
  "branch-manager": "Branch Manager",
};

export default function MyProfile() {
  const { role } = useRole();

  // Mock current user – replace with real auth data when available
  const user = {
    name: "Admin User",
    email: "admin@aiswaryamatrimony.com",
    role: roleLabels[role] ?? role,
    branch: role === "admin" ? "Head Office" : role === "branch-manager" ? "Chennai Branch" : "—",
    mobile: "+91 98765 43210",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">Your account information</p>
      </div>

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
            <span className="text-muted-foreground">Mobile</span>
            <span className="font-medium">{user.mobile}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
