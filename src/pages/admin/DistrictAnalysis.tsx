import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";

const districtData = [
  { district: "Malappuram", registrations: 1850, paidUsers: 720, activeProfiles: 1450, conversionRate: "38.9%" },
  { district: "Kozhikode", registrations: 1620, paidUsers: 680, activeProfiles: 1320, conversionRate: "42.0%" },
  { district: "Thrissur", registrations: 1450, paidUsers: 590, activeProfiles: 1180, conversionRate: "40.7%" },
  { district: "Kannur", registrations: 980, paidUsers: 420, activeProfiles: 780, conversionRate: "42.9%" },
  { district: "Ernakulam", registrations: 2120, paidUsers: 890, activeProfiles: 1680, conversionRate: "42.0%" },
  { district: "Kottayam", registrations: 1230, paidUsers: 510, activeProfiles: 950, conversionRate: "41.5%" },
  { district: "Thiruvananthapuram", registrations: 1880, paidUsers: 760, activeProfiles: 1520, conversionRate: "40.4%" },
  { district: "Palakkad", registrations: 1100, paidUsers: 450, activeProfiles: 870, conversionRate: "40.9%" },
  { district: "Kollam", registrations: 920, paidUsers: 380, activeProfiles: 710, conversionRate: "41.3%" },
];

export default function DistrictAnalysis() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-1 h-8 bg-primary rounded-full" />
        <h1 className="text-2xl font-bold">Comprehensive District Analytics</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {districtData.map((d) => (
          <Card key={d.district} className="border border-border hover:border-primary/40 transition-colors">
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
                  <span className="font-bold text-base">{d.paidUsers.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active Profiles</span>
                  <span className="font-bold text-base">{d.activeProfiles.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Conversion Rate</span>
                  <span className="font-bold text-base">{d.conversionRate}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
