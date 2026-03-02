// ─── KPI Data ───
export const adminKPIs = [
  { label: "Total Users", value: "12,847", change: "+12.5%", trend: "up" as const, icon: "Users" },
  { label: "Total Subscriptions", value: "3,284", change: "+8.2%", trend: "up" as const, icon: "CreditCard" },
  { label: "MRR", value: "₹4,52,000", change: "+15.3%", trend: "up" as const, icon: "TrendingUp" },
  { label: "Active Profiles", value: "9,421", change: "+5.1%", trend: "up" as const, icon: "UserCheck" },
  { label: "Today's Registrations", value: "47", change: "+23%", trend: "up" as const, icon: "UserPlus" },
  { label: "Total Revenue", value: "₹54,20,000", change: "+18.7%", trend: "up" as const, icon: "IndianRupee" },
];

export const staffKPIs = [
  { label: "My Profiles", value: "184", change: "+6", trend: "up" as const, icon: "Users" },
  { label: "Subscriptions This Month", value: "12", change: "+3", trend: "up" as const, icon: "CreditCard" },
  { label: "Revenue This Month", value: "₹1,44,000", change: "+22%", trend: "up" as const, icon: "IndianRupee" },
  { label: "Commission Earned", value: "₹14,400", change: "+18%", trend: "up" as const, icon: "Wallet" },
];

export const branchKPIs = [
  { label: "Branch Profiles", value: "1,842", change: "+8.4%", trend: "up" as const, icon: "Users" },
  { label: "Branch Subscriptions", value: "456", change: "+11.2%", trend: "up" as const, icon: "CreditCard" },
  { label: "Branch Revenue", value: "₹12,30,000", change: "+14.6%", trend: "up" as const, icon: "IndianRupee" },
  { label: "Active Staff", value: "8", change: "0", trend: "neutral" as const, icon: "UserCheck" },
];

// ─── Revenue Chart ───
export const revenueData = [
  { month: "Apr", revenue: 320000, subscriptions: 180 },
  { month: "May", revenue: 380000, subscriptions: 210 },
  { month: "Jun", revenue: 350000, subscriptions: 195 },
  { month: "Jul", revenue: 420000, subscriptions: 240 },
  { month: "Aug", revenue: 390000, subscriptions: 225 },
  { month: "Sep", revenue: 450000, subscriptions: 260 },
  { month: "Oct", revenue: 480000, subscriptions: 280 },
  { month: "Nov", revenue: 510000, subscriptions: 295 },
  { month: "Dec", revenue: 470000, subscriptions: 270 },
  { month: "Jan", revenue: 530000, subscriptions: 310 },
  { month: "Feb", revenue: 520000, subscriptions: 305 },
  { month: "Mar", revenue: 540000, subscriptions: 320 },
];

export const branchPerformance = [
  { branch: "Chennai", profiles: 2400, revenue: 1800000, subscriptions: 620 },
  { branch: "Coimbatore", profiles: 1800, revenue: 1200000, subscriptions: 450 },
  { branch: "Madurai", profiles: 1500, revenue: 980000, subscriptions: 380 },
  { branch: "Trichy", profiles: 1200, revenue: 750000, subscriptions: 290 },
  { branch: "Salem", profiles: 900, revenue: 520000, subscriptions: 210 },
];

export const recentActivity = [
  { id: 1, action: "New profile registered", user: "Priya Sharma", time: "2 min ago", type: "profile" },
  { id: 2, action: "Subscription activated", user: "Rajesh Kumar", time: "5 min ago", type: "subscription" },
  { id: 3, action: "Commission approved", user: "Staff: Anitha", time: "12 min ago", type: "commission" },
  { id: 4, action: "Branch report generated", user: "Chennai Branch", time: "25 min ago", type: "report" },
  { id: 5, action: "Cash deposit verified", user: "Coimbatore Branch", time: "30 min ago", type: "cash" },
  { id: 6, action: "New enquiry added", user: "Walk-in: Karthik", time: "45 min ago", type: "enquiry" },
  { id: 7, action: "Profile verified", user: "Deepa Rajan", time: "1 hr ago", type: "profile" },
  { id: 8, action: "Salary record approved", user: "Staff: Mohan", time: "1.5 hr ago", type: "salary" },
];

// ─── Branches ───
export interface Branch {
  id: number; name: string; code: string; city: string; state: string; phone: string; email: string;
  status: "active" | "inactive"; profiles: number; revenue: number; staff: number;
}
export const branches: Branch[] = [
  { id: 1, name: "Chennai Central", code: "CHN-01", city: "Chennai", state: "Tamil Nadu", phone: "044-28150001", email: "chennai@aiswarya.com", status: "active", profiles: 2400, revenue: 1800000, staff: 12 },
  { id: 2, name: "Coimbatore Main", code: "CBE-01", city: "Coimbatore", state: "Tamil Nadu", phone: "0422-2301001", email: "coimbatore@aiswarya.com", status: "active", profiles: 1800, revenue: 1200000, staff: 8 },
  { id: 3, name: "Madurai Branch", code: "MDU-01", city: "Madurai", state: "Tamil Nadu", phone: "0452-2530001", email: "madurai@aiswarya.com", status: "active", profiles: 1500, revenue: 980000, staff: 6 },
  { id: 4, name: "Trichy Office", code: "TRY-01", city: "Trichy", state: "Tamil Nadu", phone: "0431-2400001", email: "trichy@aiswarya.com", status: "active", profiles: 1200, revenue: 750000, staff: 5 },
  { id: 5, name: "Salem Center", code: "SLM-01", city: "Salem", state: "Tamil Nadu", phone: "0427-2310001", email: "salem@aiswarya.com", status: "inactive", profiles: 900, revenue: 520000, staff: 4 },
];

// ─── Staff ───
export const staffMembers = [
  { id: 1, empCode: "EMP001", name: "Anitha Lakshmi", branch: "Chennai Central", designation: "Senior Consultant", salary: 35000, commissionRate: 10, target: 20, achieved: 18, status: "active" as const },
  { id: 2, empCode: "EMP002", name: "Mohan Raj", branch: "Chennai Central", designation: "Consultant", salary: 28000, commissionRate: 8, target: 15, achieved: 12, status: "active" as const },
  { id: 3, empCode: "EMP003", name: "Priya Krishnan", branch: "Coimbatore Main", designation: "Senior Consultant", salary: 32000, commissionRate: 10, target: 18, achieved: 20, status: "active" as const },
  { id: 4, empCode: "EMP004", name: "Karthik Rajan", branch: "Coimbatore Main", designation: "Consultant", salary: 25000, commissionRate: 8, target: 15, achieved: 14, status: "active" as const },
  { id: 5, empCode: "EMP005", name: "Deepa Sundaram", branch: "Madurai Branch", designation: "Consultant", salary: 26000, commissionRate: 8, target: 12, achieved: 10, status: "active" as const },
  { id: 6, empCode: "EMP006", name: "Vijay Kumar", branch: "Trichy Office", designation: "Junior Consultant", salary: 20000, commissionRate: 6, target: 10, achieved: 8, status: "inactive" as const },
];

// ─── Subscription Plans ───
export const subscriptionPlans = [
  { id: 1, name: "Silver", duration: "3 Months", price: 5000, interests: 10, contactViews: 20, horoscope: false, highlighted: false, status: "active" as const },
  { id: 2, name: "Gold", duration: "6 Months", price: 9000, interests: 25, contactViews: 50, horoscope: true, highlighted: false, status: "active" as const },
  { id: 3, name: "Platinum", duration: "12 Months", price: 15000, interests: 50, contactViews: 100, horoscope: true, highlighted: true, status: "active" as const },
  { id: 4, name: "Diamond", duration: "24 Months", price: 25000, interests: -1, contactViews: -1, horoscope: true, highlighted: true, status: "active" as const },
  { id: 5, name: "Basic", duration: "1 Month", price: 2000, interests: 5, contactViews: 10, horoscope: false, highlighted: false, status: "inactive" as const },
];

// ─── Subscriptions Ledger ───
export const subscriptions = [
  { id: 1, customer: "Priya Sharma", plan: "Gold", amount: 9000, paymentMode: "UPI" as const, staff: "Anitha Lakshmi", branch: "Chennai Central", startDate: "2026-01-15", expiryDate: "2026-07-15", status: "active" as const },
  { id: 2, customer: "Rajesh Kumar", plan: "Platinum", amount: 15000, paymentMode: "Cash" as const, staff: "Mohan Raj", branch: "Chennai Central", startDate: "2025-12-01", expiryDate: "2026-12-01", status: "active" as const },
  { id: 3, customer: "Deepa Rajan", plan: "Silver", amount: 5000, paymentMode: "Card" as const, staff: "Priya Krishnan", branch: "Coimbatore Main", startDate: "2025-09-10", expiryDate: "2025-12-10", status: "expired" as const },
  { id: 4, customer: "Karthik M", plan: "Diamond", amount: 25000, paymentMode: "Netbanking" as const, staff: "Karthik Rajan", branch: "Coimbatore Main", startDate: "2026-02-01", expiryDate: "2028-02-01", status: "active" as const },
  { id: 5, customer: "Arun S", plan: "Gold", amount: 9000, paymentMode: "UPI" as const, staff: "Deepa Sundaram", branch: "Madurai Branch", startDate: "2025-11-20", expiryDate: "2026-05-20", status: "active" as const },
  { id: 6, customer: "Meena K", plan: "Silver", amount: 5000, paymentMode: "Cash" as const, staff: "Vijay Kumar", branch: "Trichy Office", startDate: "2025-08-05", expiryDate: "2025-11-05", status: "cancelled" as const },
];

// ─── Commissions ───
export const commissions = [
  { id: 1, date: "2026-02-28", staff: "Anitha Lakshmi", customer: "Priya Sharma", plan: "Gold", saleAmount: 9000, rate: 10, commission: 900, status: "paid" as const, branch: "Chennai Central" },
  { id: 2, date: "2026-02-25", staff: "Mohan Raj", customer: "Rajesh Kumar", plan: "Platinum", saleAmount: 15000, rate: 8, commission: 1200, status: "approved" as const, branch: "Chennai Central" },
  { id: 3, date: "2026-02-20", staff: "Priya Krishnan", customer: "Karthik M", plan: "Diamond", saleAmount: 25000, rate: 10, commission: 2500, status: "pending" as const, branch: "Coimbatore Main" },
  { id: 4, date: "2026-02-18", staff: "Karthik Rajan", customer: "Arun S", plan: "Gold", saleAmount: 9000, rate: 8, commission: 720, status: "pending" as const, branch: "Coimbatore Main" },
  { id: 5, date: "2026-02-15", staff: "Deepa Sundaram", customer: "Meena K", plan: "Silver", saleAmount: 5000, rate: 8, commission: 400, status: "paid" as const, branch: "Madurai Branch" },
  { id: 6, date: "2026-02-10", staff: "Vijay Kumar", customer: "Lakshmi R", plan: "Gold", saleAmount: 9000, rate: 6, commission: 540, status: "cancelled" as const, branch: "Trichy Office" },
];

// ─── Salary Records ───
export const salaryRecords = [
  { id: 1, staff: "Anitha Lakshmi", branch: "Chennai Central", month: "February", year: 2026, basic: 35000, commission: 3600, allowances: 5000, deductions: 4200, gross: 43600, net: 39400, status: "paid" as const },
  { id: 2, staff: "Mohan Raj", branch: "Chennai Central", month: "February", year: 2026, basic: 28000, commission: 2400, allowances: 4000, deductions: 3400, gross: 34400, net: 31000, status: "approved" as const },
  { id: 3, staff: "Priya Krishnan", branch: "Coimbatore Main", month: "February", year: 2026, basic: 32000, commission: 5000, allowances: 4500, deductions: 3800, gross: 41500, net: 37700, status: "draft" as const },
  { id: 4, staff: "Karthik Rajan", branch: "Coimbatore Main", month: "February", year: 2026, basic: 25000, commission: 1440, allowances: 3500, deductions: 2900, gross: 29940, net: 27040, status: "draft" as const },
  { id: 5, staff: "Deepa Sundaram", branch: "Madurai Branch", month: "February", year: 2026, basic: 26000, commission: 800, allowances: 3000, deductions: 2800, gross: 29800, net: 27000, status: "approved" as const },
];

// ─── Profiles ───
export const profiles = [
  { id: "AMP001", name: "Priya Sharma", gender: "Female", age: 26, religion: "Hindu", caste: "Brahmin", maritalStatus: "Never Married", subscription: "Gold", verified: true, completeness: 92 },
  { id: "AMP002", name: "Rajesh Kumar", gender: "Male", age: 30, religion: "Hindu", caste: "Gounder", maritalStatus: "Never Married", subscription: "Platinum", verified: true, completeness: 88 },
  { id: "AMP003", name: "Deepa Rajan", gender: "Female", age: 28, religion: "Hindu", caste: "Mudaliar", maritalStatus: "Divorced", subscription: "Silver", verified: false, completeness: 75 },
  { id: "AMP004", name: "Karthik M", gender: "Male", age: 32, religion: "Hindu", caste: "Nadar", maritalStatus: "Never Married", subscription: "Diamond", verified: true, completeness: 95 },
  { id: "AMP005", name: "Arun S", gender: "Male", age: 29, religion: "Christian", caste: "RC", maritalStatus: "Never Married", subscription: "Gold", verified: false, completeness: 60 },
  { id: "AMP006", name: "Meena K", gender: "Female", age: 25, religion: "Hindu", caste: "Thevar", maritalStatus: "Never Married", subscription: "None", verified: false, completeness: 45 },
];

// ─── Enquiries ───
export type EnquiryStatus = "new" | "contacted" | "interested" | "converted" | "lost";
export type EnquirySource = "Website" | "Walk-in" | "Phone" | "WhatsApp" | "Email";

export interface Enquiry {
  id: number; name: string; phone: string; source: EnquirySource; status: EnquiryStatus;
  assignedTo: string; branch: string; date: string; notes: string;
}

export const enquiries: Enquiry[] = [
  { id: 1, name: "Suresh M", phone: "9876543210", source: "Website", status: "new", assignedTo: "Anitha Lakshmi", branch: "Chennai Central", date: "2026-03-01", notes: "Interested in Platinum plan" },
  { id: 2, name: "Kavitha R", phone: "9876543211", source: "Walk-in", status: "contacted", assignedTo: "Mohan Raj", branch: "Chennai Central", date: "2026-02-28", notes: "Follow up on Friday" },
  { id: 3, name: "Ravi P", phone: "9876543212", source: "Phone", status: "interested", assignedTo: "Priya Krishnan", branch: "Coimbatore Main", date: "2026-02-27", notes: "Wants to compare Gold vs Platinum" },
  { id: 4, name: "Lakshmi S", phone: "9876543213", source: "WhatsApp", status: "converted", assignedTo: "Karthik Rajan", branch: "Coimbatore Main", date: "2026-02-25", notes: "Converted to Gold plan" },
  { id: 5, name: "Ganesh K", phone: "9876543214", source: "Email", status: "lost", assignedTo: "Deepa Sundaram", branch: "Madurai Branch", date: "2026-02-20", notes: "Not interested anymore" },
];

// ─── Cash Collections ───
export const cashCollections = [
  { branch: "Chennai Central", expected: 45000, physical: 44500, deposited: 44500, status: "settled" as const },
  { branch: "Coimbatore Main", expected: 32000, physical: 31500, deposited: 30000, status: "shortage" as const },
  { branch: "Madurai Branch", expected: 18000, physical: 18000, deposited: 18000, status: "settled" as const },
  { branch: "Trichy Office", expected: 12000, physical: 12000, deposited: 0, status: "pending" as const },
];

// ─── Email Templates ───
export const emailTemplates = [
  { id: 1, name: "Registration Welcome", subject: "Welcome to AIswarya Matrimony!", lastModified: "2026-02-15", status: "active" as const },
  { id: 2, name: "Match Notification", subject: "You have a new match!", lastModified: "2026-02-10", status: "active" as const },
  { id: 3, name: "Interest Alert", subject: "Someone is interested in your profile", lastModified: "2026-01-28", status: "active" as const },
  { id: 4, name: "Subscription Confirmation", subject: "Your subscription is now active", lastModified: "2026-02-01", status: "active" as const },
  { id: 5, name: "Expiry Reminder", subject: "Your subscription is expiring soon", lastModified: "2026-01-20", status: "active" as const },
  { id: 6, name: "Password Reset", subject: "Reset your password", lastModified: "2026-01-15", status: "active" as const },
];

// ─── Audit Log ───
export const auditLogs = [
  { id: 1, timestamp: "2026-03-02 10:45:23", user: "Admin User", role: "Admin", action: "Profile Verified", ip: "192.168.1.100", details: "Verified profile AMP003 - Deepa Rajan" },
  { id: 2, timestamp: "2026-03-02 10:30:15", user: "Anitha Lakshmi", role: "Staff", action: "Subscription Created", ip: "192.168.1.101", details: "Created Gold subscription for Priya Sharma" },
  { id: 3, timestamp: "2026-03-02 10:15:08", user: "Branch Manager", role: "Branch Manager", action: "Commission Approved", ip: "192.168.1.102", details: "Approved commission of ₹1,200 for Mohan Raj" },
  { id: 4, timestamp: "2026-03-02 09:55:42", user: "Admin User", role: "Admin", action: "Branch Updated", ip: "192.168.1.100", details: "Updated Salem Center status to inactive" },
  { id: 5, timestamp: "2026-03-02 09:30:00", user: "Mohan Raj", role: "Staff", action: "Enquiry Added", ip: "192.168.1.103", details: "New walk-in enquiry: Kavitha R" },
];

// ─── Staff Performance (Branch Manager view) ───
export const staffPerformance = [
  { name: "Anitha Lakshmi", profilesCreated: 45, subscriptionsSold: 18, revenue: 234000, commission: 23400, target: 20, achieved: 18 },
  { name: "Mohan Raj", profilesCreated: 38, subscriptionsSold: 12, revenue: 156000, commission: 12480, target: 15, achieved: 12 },
  { name: "Priya Krishnan", profilesCreated: 52, subscriptionsSold: 20, revenue: 280000, commission: 28000, target: 18, achieved: 20 },
  { name: "Karthik Rajan", profilesCreated: 35, subscriptionsSold: 14, revenue: 168000, commission: 13440, target: 15, achieved: 14 },
  { name: "Deepa Sundaram", profilesCreated: 28, subscriptionsSold: 10, revenue: 95000, commission: 7600, target: 12, achieved: 10 },
];

// ─── Day Close ───
export const dayCloseData = {
  date: "2026-03-02",
  expectedCash: 45000,
  physicalCash: 44500,
  staffBreakdown: [
    { staff: "Anitha Lakshmi", receipts: "R001-R008", amount: 22000, receiptCount: 8 },
    { staff: "Mohan Raj", receipts: "R009-R014", amount: 15000, receiptCount: 6 },
    { staff: "Priya K", receipts: "R015-R017", amount: 7500, receiptCount: 3 },
  ],
  discrepancy: 500,
  status: "shortage" as const,
};
