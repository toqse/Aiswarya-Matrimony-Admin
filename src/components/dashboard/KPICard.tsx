import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Users, CreditCard, IndianRupee, UserCheck, UserPlus, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, any> = {
  Users, CreditCard, TrendingUp, UserCheck, UserPlus, IndianRupee, Wallet,
};

interface KPICardProps {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  icon: string;
  index: number;
}

const gradients = [
  "from-primary/10 to-primary/5",
  "from-accent/15 to-accent/5",
  "from-secondary to-secondary/50",
  "from-success/10 to-success/5",
  "from-info/10 to-info/5",
  "from-primary/8 to-accent/8",
];

export function KPICard({ label, value, change, trend, icon, index }: KPICardProps) {
  const Icon = iconMap[icon] || Users;
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <Card className={cn("shadow-elegant border-0 bg-gradient-to-br overflow-hidden relative group hover:shadow-lg transition-shadow", gradients[index % gradients.length])}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground font-medium">{label}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <div className={cn("flex items-center gap-1 text-xs font-medium",
              trend === "up" ? "text-success" : trend === "down" ? "text-destructive" : "text-muted-foreground"
            )}>
              <TrendIcon className="h-3.5 w-3.5" />
              <span>{change}</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
