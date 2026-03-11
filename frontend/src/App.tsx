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
import { AnalyticsView } from './views/family/AnalyticsView';
import { BudgetView } from './views/family/BudgetView';

const DashboardOverviewWrapper = () => {
  const context = useOutletContext<any>();
  return <DashboardOverview {...context} />;
};

const TransactionsViewWrapper = () => {
  const context = useOutletContext<any>();
  return <TransactionsView {...context} />;
};

const AnalyticsViewWrapper = () => {
  const context = useOutletContext<any>();
  return <AnalyticsView {...context} />;
};

const WalletsViewWrapper = () => {
  const context = useOutletContext<any>();
  return <WalletsView {...context} />;
};

const BudgetViewWrapper = () => {
  const context = useOutletContext<any>();
  return <BudgetView {...context} />;
};

const DebtViewWrapper = () => {
  // Assuming DebtView exists or will be implemented. 
  // For now, let's keep it consistent or redirect.
  return <div className="p-8">Debt View (Coming Soon)</div>;
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
            <Route path="analytics" element={<AnalyticsViewWrapper />} />
            <Route path="wallets" element={<WalletsViewWrapper />} />
            <Route path="budget" element={<BudgetViewWrapper />} />
            <Route path="debts" element={<DebtViewWrapper />} />
          </Route>
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route
            path="/admin"
            element={token && user?.role === 'super_admin' ? <AdminDashboard /> : <Navigate to="/" />}
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
