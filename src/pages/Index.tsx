import { useRole } from "@/contexts/RoleContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Routes, Route } from "react-router-dom";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import StaffDashboard from "@/pages/staff/StaffDashboard";
import BranchManagerDashboard from "@/pages/branch/BranchManagerDashboard";
import BranchManagement from "@/pages/admin/BranchManagement";
import StaffManagement from "@/pages/admin/StaffManagement";
import SubscriptionPlans from "@/pages/admin/SubscriptionPlans";
import BranchStaffPerformance from "@/pages/branch/BranchStaffPerformance";
import BranchEnquiryOverview from "@/pages/branch/BranchEnquiryOverview";
import BranchSalary from "@/pages/branch/BranchSalary";
import AllSubscriptions from "@/pages/admin/AllSubscriptions";
import AllCommissions from "@/pages/admin/AllCommissions";
import SalaryPayroll from "@/pages/admin/SalaryPayroll";
import ProfileAdmin from "@/pages/admin/ProfileAdmin";
import BulkUpload from "@/pages/admin/BulkUpload";
import EnquiryOverview from "@/pages/admin/EnquiryOverview";
import CashPayments from "@/pages/admin/CashPayments";
import Reports from "@/pages/admin/Reports";
import EmailTemplates from "@/pages/admin/EmailTemplates";
import SystemSettings from "@/pages/admin/SystemSettings";
import AuditLog from "@/pages/admin/AuditLog";
import HoroscopeManagement from "@/pages/admin/HoroscopeManagement";
import MyProfiles from "@/pages/staff/MyProfiles";
import StaffEnquiries from "@/pages/staff/StaffEnquiries";
import StaffSubscriptions from "@/pages/staff/StaffSubscriptions";
import MySalary from "@/pages/staff/MySalary";
import MyCommissions from "@/pages/staff/MyCommissions";

function DashboardHome() {
  const { role } = useRole();
  if (role === "staff") return <StaffDashboard />;
  if (role === "branch-manager") return <BranchManagerDashboard />;
  return <AdminDashboard />;
}

const Index = () => {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<DashboardHome />} />
        <Route path="/branches" element={<BranchManagement />} />
        <Route path="/staff" element={<StaffManagement />} />
        <Route path="/plans" element={<SubscriptionPlans />} />
        <Route path="/subscriptions" element={<AllSubscriptions />} />
        <Route path="/commissions" element={<AllCommissions />} />
        <Route path="/salary" element={<SalaryPayroll />} />
        <Route path="/profiles" element={<ProfileAdmin />} />
        <Route path="/bulk-upload" element={<BulkUpload />} />
        <Route path="/enquiries" element={<EnquiryOverview />} />
        <Route path="/cash-payments" element={<CashPayments />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/email-templates" element={<EmailTemplates />} />
        <Route path="/settings" element={<SystemSettings />} />
        <Route path="/audit-log" element={<AuditLog />} />
        <Route path="/horoscope" element={<HoroscopeManagement />} />
        {/* Staff & Branch Manager dedicated routes */}
        <Route path="/my-commissions" element={<MyCommissions />} />
        <Route path="/my-salary" element={<MySalary />} />
        <Route path="/my-profiles" element={<MyProfiles />} />
        <Route path="/my-enquiries" element={<StaffEnquiries />} />
        <Route path="/my-subscriptions" element={<StaffSubscriptions />} />
        <Route path="/cash-entry" element={<CashPayments />} />
        <Route path="/activity-log" element={<AuditLog />} />
        <Route path="/staff-performance" element={<BranchStaffPerformance />} />
        <Route path="/commission-approval" element={<AllCommissions />} />
        <Route path="/branch-salary" element={<BranchSalary />} />
        <Route path="/branch-enquiries" element={<BranchEnquiryOverview />} />
        <Route path="/day-close" element={<CashPayments />} />
      </Routes>
    </DashboardLayout>
  );
};

export default Index;
