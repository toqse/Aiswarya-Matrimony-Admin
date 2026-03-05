import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-sm shadow-elegant border-0">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Matrimony Admin</CardTitle>
          <CardDescription>Sign in to continue to the admin panel</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleLogin} className="w-full gap-2" size="lg">
            <LogIn className="h-4 w-4" />
            Login
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Demo: Click Login to enter the dashboard. Connect your auth provider to enable real sign-in.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
