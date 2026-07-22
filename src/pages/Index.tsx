import { lazy, Suspense } from "react";
import { useRole } from "@/contexts/RoleContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Routes, Route } from "react-router-dom";

const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const StaffDashboard = lazy(() => import("@/pages/staff/StaffDashboard"));
const BranchManagerDashboard = lazy(() => import("@/pages/branch/BranchManagerDashboard"));
const BranchManagement = lazy(() => import("@/pages/admin/BranchManagement"));
const StaffManagement = lazy(() => import("@/pages/admin/StaffManagement"));
const SubscriptionPlans = lazy(() => import("@/pages/admin/SubscriptionPlans"));
const BranchStaffPerformance = lazy(() => import("@/pages/branch/BranchStaffPerformance"));
const BranchEnquiryOverview = lazy(() => import("@/pages/branch/BranchEnquiryOverview"));
const BranchSalary = lazy(() => import("@/pages/branch/BranchSalary"));
const AllSubscriptions = lazy(() => import("@/pages/admin/AllSubscriptions"));
const AllCommissions = lazy(() => import("@/pages/admin/AllCommissions"));
const SalaryPayroll = lazy(() => import("@/pages/admin/SalaryPayroll"));
const ProfileAdmin = lazy(() => import("@/pages/admin/ProfileAdmin"));
const BulkUpload = lazy(() => import("@/pages/admin/BulkUpload"));
const EnquiryOverview = lazy(() => import("@/pages/admin/EnquiryOverview"));
const NewsletterSubscribers = lazy(() => import("@/pages/admin/NewsletterSubscribers"));
const AppConfig = lazy(() => import("@/pages/admin/AppConfig"));
const CashPayments = lazy(() => import("@/pages/admin/CashPayments"));
const Reports = lazy(() => import("@/pages/admin/Reports"));
const EmailTemplates = lazy(() => import("@/pages/admin/EmailTemplates"));
const AuditLog = lazy(() => import("@/pages/admin/AuditLog"));
const HoroscopeManagement = lazy(() => import("@/pages/admin/HoroscopeManagement"));
const SuccessStories = lazy(() => import("@/pages/admin/SuccessStories"));
const DistrictAnalysis = lazy(() => import("@/pages/admin/DistrictAnalysis"));
const CasteManagement = lazy(() => import("@/pages/admin/CasteManagement"));
const ReligionManagement = lazy(() => import("@/pages/admin/ReligionManagement"));
const MotherTongueManagement = lazy(() => import("@/pages/admin/MotherTongueManagement"));
const EducationManagement = lazy(() => import("@/pages/admin/EducationManagement"));
const EducationSubjectManagement = lazy(() => import("@/pages/admin/EducationSubjectManagement"));
const OccupationManagement = lazy(() => import("@/pages/admin/OccupationManagement"));
const MyProfiles = lazy(() => import("@/pages/staff/MyProfiles"));
const StaffEnquiries = lazy(() => import("@/pages/staff/StaffEnquiries"));
const StaffSubscriptions = lazy(() => import("@/pages/staff/StaffSubscriptions"));
const MySalary = lazy(() => import("@/pages/staff/MySalary"));
const MyCommissions = lazy(() => import("@/pages/staff/MyCommissions"));
const CashPaymentDashboard = lazy(() => import("@/pages/staff/CashPaymentDashboard"));
const BranchCashPayments = lazy(() => import("@/pages/branch/BranchCashPayments"));
const BranchCommissionApproval = lazy(() => import("@/pages/branch/BranchCommissionApproval"));
const BranchMyProfiles = lazy(() => import("@/pages/branch/BranchMyProfiles"));
const MyProfile = lazy(() => import("@/pages/MyProfile"));
const NotFound = lazy(() => import("@/pages/NotFound"));

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
      Loading…
    </div>
  );
}

function DashboardHome() {
  const { role } = useRole();
  if (role === "staff") return <StaffDashboard />;
  if (role === "branch-manager") return <BranchManagerDashboard />;
  return <AdminDashboard />;
}

const Index = () => {
  const { role } = useRole();
  return (
    <DashboardLayout>
      <Suspense fallback={<RouteFallback />}>
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
          <Route path="/newsletter" element={<NewsletterSubscribers />} />
          <Route path="/app-config" element={<AppConfig />} />
          <Route path="/cash-payments" element={<CashPayments />} />
          <Route path="/success-stories" element={<SuccessStories />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/email-templates" element={<EmailTemplates />} />
          <Route path="/profile" element={<MyProfile />} />
          <Route path="/audit-log" element={<AuditLog />} />
          <Route path="/horoscope" element={<HoroscopeManagement />} />
          <Route path="/district-analysis" element={<DistrictAnalysis />} />
          <Route path="/caste" element={<CasteManagement />} />
          <Route path="/religion" element={<ReligionManagement />} />
          <Route path="/mother-tongue" element={<MotherTongueManagement />} />
          <Route path="/education" element={<EducationManagement />} />
          <Route path="/education-subject" element={<EducationSubjectManagement />} />
          <Route path="/occupation" element={<OccupationManagement />} />
          <Route path="/my-commissions" element={<MyCommissions />} />
          <Route path="/my-salary" element={<MySalary />} />
          <Route path="/my-profiles" element={role === "branch-manager" ? <BranchMyProfiles /> : <MyProfiles />} />
          <Route path="/my-enquiries" element={<StaffEnquiries />} />
          <Route path="/my-subscriptions" element={<StaffSubscriptions />} />
          <Route path="/cash-entry" element={<CashPaymentDashboard />} />
          <Route path="/activity-log" element={<AuditLog />} />
          <Route path="/staff-performance" element={<BranchStaffPerformance />} />
          <Route path="/commission-approval" element={<BranchCommissionApproval />} />
          <Route path="/branch-salary" element={<BranchSalary />} />
          <Route path="/branch-enquiries" element={<BranchEnquiryOverview />} />
          <Route path="/day-close" element={<BranchCashPayments />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </DashboardLayout>
  );
};

export default Index;
