import { lazyRetry } from "@/lib/lazyRetry";
import { useEffect, useState, Suspense } from "react";
import { useRole } from "@/contexts/RoleContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Button } from "@/components/ui/button";
import { Routes, Route } from "react-router-dom";

// Eager home dashboards — avoids stuck Suspense "Loading…" on `/` after login.
import AdminDashboard from "@/pages/admin/AdminDashboard";
import StaffDashboard from "@/pages/staff/StaffDashboard";
import BranchManagerDashboard from "@/pages/branch/BranchManagerDashboard";

const BranchManagement = lazyRetry(() => import("@/pages/admin/BranchManagement"));
const StaffManagement = lazyRetry(() => import("@/pages/admin/StaffManagement"));
const SubscriptionPlans = lazyRetry(() => import("@/pages/admin/SubscriptionPlans"));
const BranchStaffPerformance = lazyRetry(
  () => import("@/pages/branch/BranchStaffPerformance"),
);
const BranchEnquiryOverview = lazyRetry(
  () => import("@/pages/branch/BranchEnquiryOverview"),
);
const BranchSalary = lazyRetry(() => import("@/pages/branch/BranchSalary"));
const AllSubscriptions = lazyRetry(() => import("@/pages/admin/AllSubscriptions"));
const AllCommissions = lazyRetry(() => import("@/pages/admin/AllCommissions"));
const SalaryPayroll = lazyRetry(() => import("@/pages/admin/SalaryPayroll"));
const ProfileAdmin = lazyRetry(() => import("@/pages/admin/ProfileAdmin"));
const BulkUpload = lazyRetry(() => import("@/pages/admin/BulkUpload"));
const EnquiryOverview = lazyRetry(() => import("@/pages/admin/EnquiryOverview"));
const NewsletterSubscribers = lazyRetry(
  () => import("@/pages/admin/NewsletterSubscribers"),
);
const AppConfig = lazyRetry(() => import("@/pages/admin/AppConfig"));
const MsgSettings = lazyRetry(() => import("@/pages/admin/MsgSettings"));
const CashPayments = lazyRetry(() => import("@/pages/admin/CashPayments"));
const Reports = lazyRetry(() => import("@/pages/admin/Reports"));
const EmailTemplates = lazyRetry(() => import("@/pages/admin/EmailTemplates"));
const AuditLog = lazyRetry(() => import("@/pages/admin/AuditLog"));
const HoroscopeManagement = lazyRetry(
  () => import("@/pages/admin/HoroscopeManagement"),
);
const SuccessStories = lazyRetry(() => import("@/pages/admin/SuccessStories"));
const Testimonials = lazyRetry(() => import("@/pages/admin/Testimonials"));
const DistrictAnalysis = lazyRetry(() => import("@/pages/admin/DistrictAnalysis"));
const CountryManagement = lazyRetry(() => import("@/pages/admin/CountryManagement"));
const StateManagement = lazyRetry(() => import("@/pages/admin/StateManagement"));
const DistrictManagement = lazyRetry(() => import("@/pages/admin/DistrictManagement"));
const CityManagement = lazyRetry(() => import("@/pages/admin/CityManagement"));
const CasteManagement = lazyRetry(() => import("@/pages/admin/CasteManagement"));
const ReligionManagement = lazyRetry(
  () => import("@/pages/admin/ReligionManagement"),
);
const MotherTongueManagement = lazyRetry(
  () => import("@/pages/admin/MotherTongueManagement"),
);
const EducationManagement = lazyRetry(
  () => import("@/pages/admin/EducationManagement"),
);
const EducationSubjectManagement = lazyRetry(
  () => import("@/pages/admin/EducationSubjectManagement"),
);
const OccupationManagement = lazyRetry(
  () => import("@/pages/admin/OccupationManagement"),
);
const MyProfiles = lazyRetry(() => import("@/pages/staff/MyProfiles"));
const StaffEnquiries = lazyRetry(() => import("@/pages/staff/StaffEnquiries"));
const StaffSubscriptions = lazyRetry(
  () => import("@/pages/staff/StaffSubscriptions"),
);
const MySalary = lazyRetry(() => import("@/pages/staff/MySalary"));
const MyCommissions = lazyRetry(() => import("@/pages/staff/MyCommissions"));
const CashPaymentDashboard = lazyRetry(
  () => import("@/pages/staff/CashPaymentDashboard"),
);
const BranchCashPayments = lazyRetry(
  () => import("@/pages/branch/BranchCashPayments"),
);
const BranchCommissionApproval = lazyRetry(
  () => import("@/pages/branch/BranchCommissionApproval"),
);
const BranchMyProfiles = lazyRetry(() => import("@/pages/branch/BranchMyProfiles"));
const MyProfile = lazyRetry(() => import("@/pages/MyProfile"));
const NotFound = lazyRetry(() => import("@/pages/NotFound"));

function RouteFallback() {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setSlow(true), 8_000);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 p-6 text-center text-sm text-muted-foreground">
      <p>Loading…</p>
      {slow && (
        <>
          <p className="max-w-sm">
            This is taking longer than usual. The page script may be blocked or
            outdated after a deploy.
          </p>
          <Button type="button" variant="outline" size="sm" onClick={() => window.location.reload()}>
            Reload page
          </Button>
        </>
      )}
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
      <ErrorBoundary>
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
            <Route path="/msg-settings" element={<MsgSettings />} />
            <Route path="/cash-payments" element={<CashPayments />} />
            <Route path="/success-stories" element={<SuccessStories />} />
            <Route path="/testimonials" element={<Testimonials />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/email-templates" element={<EmailTemplates />} />
            <Route path="/profile" element={<MyProfile />} />
            <Route path="/audit-log" element={<AuditLog />} />
            <Route path="/horoscope" element={<HoroscopeManagement />} />
            <Route path="/district-analysis" element={<DistrictAnalysis />} />
            <Route path="/country" element={<CountryManagement />} />
            <Route path="/state" element={<StateManagement />} />
            <Route path="/district" element={<DistrictManagement />} />
            <Route path="/city" element={<CityManagement />} />
            <Route path="/caste" element={<CasteManagement />} />
            <Route path="/religion" element={<ReligionManagement />} />
            <Route path="/mother-tongue" element={<MotherTongueManagement />} />
            <Route path="/education" element={<EducationManagement />} />
            <Route path="/education-subject" element={<EducationSubjectManagement />} />
            <Route path="/occupation" element={<OccupationManagement />} />
            <Route path="/my-commissions" element={<MyCommissions />} />
            <Route path="/my-salary" element={<MySalary />} />
            <Route
              path="/my-profiles"
              element={
                role === "branch-manager" ? <BranchMyProfiles /> : <MyProfiles />
              }
            />
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
      </ErrorBoundary>
    </DashboardLayout>
  );
};

export default Index;
