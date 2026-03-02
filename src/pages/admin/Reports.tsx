import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { revenueData, branchPerformance, staffPerformance } from "@/data/mockData";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

const communityData = [
  { name: "Hindu - Brahmin", value: 25 },
  { name: "Hindu - Gounder", value: 18 },
  { name: "Hindu - Mudaliar", value: 15 },
  { name: "Hindu - Nadar", value: 12 },
  { name: "Hindu - Thevar", value: 10 },
  { name: "Christian", value: 12 },
  { name: "Muslim", value: 8 },
];

const COLORS = ["hsl(333, 60%, 34%)", "hsl(40, 100%, 58%)", "hsl(8, 100%, 85%)", "hsl(160, 60%, 45%)", "hsl(220, 60%, 50%)", "hsl(280, 50%, 50%)", "hsl(30, 80%, 50%)"];

const leadSources = [
  { name: "Website", value: 350 },
  { name: "Walk-in", value: 250 },
  { name: "Phone", value: 200 },
  { name: "WhatsApp", value: 120 },
  { name: "Email", value: 80 },
];

export default function Reports() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports & Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">Comprehensive business intelligence</p>
      </div>

      {/* Revenue Report */}
      <Card className="shadow-elegant border-0">
        <CardHeader><CardTitle className="text-base">Revenue Report (12 Months)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="rptRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(333, 60%, 34%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(333, 60%, 34%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(333, 15%, 90%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(333, 10%, 46%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(333, 10%, 46%)" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, "Revenue"]} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(333, 60%, 34%)" fill="url(#rptRev)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Staff Productivity */}
        <Card className="shadow-elegant border-0">
          <CardHeader><CardTitle className="text-base">Staff Productivity</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={staffPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(333, 15%, 90%)" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(333, 10%, 46%)" />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} stroke="hsl(333, 10%, 46%)" />
                <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`]} />
                <Bar dataKey="revenue" name="Revenue" fill="hsl(333, 60%, 34%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Community Analytics */}
        <Card className="shadow-elegant border-0">
          <CardHeader><CardTitle className="text-base">Community Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={communityData} cx="50%" cy="50%" outerRadius={100} paddingAngle={2} dataKey="value" label={({ name, percent }) => `${name.split(" - ").pop()} ${(percent * 100).toFixed(0)}%`}>
                  {communityData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Lead Sources */}
        <Card className="shadow-elegant border-0">
          <CardHeader><CardTitle className="text-base">Lead Source Breakdown</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={leadSources} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {leadSources.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Branch Comparison */}
        <Card className="shadow-elegant border-0">
          <CardHeader><CardTitle className="text-base">Branch Revenue Comparison</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={branchPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(333, 15%, 90%)" />
                <XAxis dataKey="branch" tick={{ fontSize: 11 }} stroke="hsl(333, 10%, 46%)" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(333, 10%, 46%)" tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`]} />
                <Bar dataKey="revenue" name="Revenue" fill="hsl(40, 100%, 58%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
