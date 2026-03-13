import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './views/LandingPage';
import { LoginPage } from './views/LoginPage';
import { RegisterPage } from './views/RegisterPage';
import { ForgotPasswordPage } from './views/ForgotPasswordPage';
import { ResetPasswordPage } from './views/ResetPasswordPage';
import { FamilyDashboard } from './views/FamilyDashboard';
import { PricingPage } from './views/PricingPage';
import { CheckoutPage } from './views/CheckoutPage';
import { AdminDashboard } from './views/AdminDashboard';
import { useAuthStore } from './store/authStore';
import { useOutletContext } from 'react-router-dom';

// Import sub-views
import { DashboardOverview } from './views/family/DashboardOverview';
import { TransactionsView } from './views/family/TransactionsView';
import { WalletsView } from './views/family/WalletsView';
import { BudgetView } from './views/family/BudgetView';
import { CoachView } from './views/family/CoachView';
import { MembersView } from './views/family/MembersView';
import { DebtView } from './views/family/DebtView';
import { NotificationsView } from './views/family/NotificationsView';
import { SettingsView } from './views/family/SettingsView';

const DashboardOverviewWrapper = () => {
  const context = useOutletContext<any>();
  return <DashboardOverview {...context} />;
};

const TransactionsViewWrapper = () => {
  const context = useOutletContext<any>();
  return <TransactionsView {...context} />;
};


const WalletsViewWrapper = () => {
  const context = useOutletContext<any>();
  return <WalletsView {...context} />;
};

const BudgetViewWrapper = () => {
  const context = useOutletContext<any>();
  return <BudgetView {...context} />;
};

const CoachViewWrapper = () => {
  const context = useOutletContext<any>();
  return <CoachView {...context} />;
};

const MembersViewWrapper = () => {
  const context = useOutletContext<any>();
  return <MembersView {...context} />;
};

const DebtViewWrapper = () => {
  const context = useOutletContext<any>();
  return <DebtView {...context} />;
};

const NotificationsViewWrapper = () => {
  return <NotificationsView />;
};

const SettingsViewWrapper = () => {
    return <SettingsView />;
};

function App() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  console.log('App rendering, token:', token, 'user:', user);

  return (
    <Router>
      <div className="min-h-screen">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/login"
            element={
              token && user ? (
                user.role === 'super_admin' ? (
                  <Navigate to="/admin" />
                ) : (
                  <Navigate to={`/${encodeURIComponent(user.familyName)}/dashboard`} />
                )
              ) : (
                <LoginPage />
              )
            }
          />
          <Route
            path="/register"
            element={
              token && user ? (
                user.role === 'super_admin' ? (
                  <Navigate to="/admin" />
                ) : (
                  <Navigate to={`/${encodeURIComponent(user.familyName)}/dashboard`} />
                )
              ) : (
                <RegisterPage />
              )
            }
          />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route
            path="/:familyName/dashboard"
            element={token ? <FamilyDashboard /> : <Navigate to="/login" />}
          >
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<DashboardOverviewWrapper />} />
            <Route path="transactions" element={<TransactionsViewWrapper />} />
            <Route path="wallets" element={<WalletsViewWrapper />} />
            <Route path="budget" element={<BudgetViewWrapper />} />
            <Route path="coach" element={<CoachViewWrapper />} />
            <Route path="family" element={<MembersViewWrapper />} />
            <Route path="debts" element={<DebtViewWrapper />} />
            <Route path="notifications" element={<NotificationsViewWrapper />} />
            <Route path="settings" element={<SettingsViewWrapper />} />
          </Route>
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route
            path="/admin"
            element={token && user?.role === 'super_admin' ? <AdminDashboard /> : <Navigate to="/" />}
          >
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<AdminDashboard activeSection="overview" />} />
            <Route path="users" element={<AdminDashboard activeSection="users" />} />
            <Route path="families" element={<AdminDashboard activeSection="families" />} />
            <Route path="settings" element={<AdminDashboard activeSection="settings" />} />
            <Route path="plans" element={<AdminDashboard activeSection="plans" />} />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
