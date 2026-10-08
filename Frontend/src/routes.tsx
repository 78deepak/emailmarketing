import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';

import AuthLayout from '@/components/layouts/auth.layout';
import AppLayout from '@/components/layouts/app.layout';
import AdminLayout from '@/components/layouts/admin.layout';

import LoginPage from '@/auth/login.page';
import SignupPage from '@/auth/signup.page';
import ForgotPasswordPage from '@/auth/forgot-password.page';
import ResetPasswordPage from '@/auth/reset-password.page';
import VerifyEmailPage from '@/auth/verify-email.page';

import DashboardPage from '@/app/dashboard.page';
import ContactsPage from '@/app/contacts/contacts.page';
import ListsPage from '@/app/lists/lists.page';
import ListDetailPage from '@/app/lists/list-detail.page';
import TagsPage from '@/app/tags/tags.page';
import SegmentsPage from '@/app/segments/segments.page';
import TemplatesPage from '@/app/templates/templates.page';
import TemplateEditorPage from '@/app/templates/template-editor.page';
import CampaignsPage from '@/app/campaigns/campaigns.page';
import CampaignFormPage from '@/app/campaigns/campaign-form.page';
import CampaignDetailPage from '@/app/campaigns/campaign-detail.page';
import AutomationsPage from '@/app/automations/automations.page';
import AutomationBuilderPage from '@/app/automations/automation-builder.page';
import SignaturesPage from '@/app/sending/signatures.page';
import DomainsPage from '@/app/sending/domains.page';
import AdminDashboardPage from '@/admin/dashboard.page';

import {
  RequireAuth,
  RequireGuest,
  RequirePlatformAdmin,
} from '@/auth/guards';

/**
 * Route tree.
 */
const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/app" replace /> },

  // Guest-only auth (redirects to /app if already signed in)
  {
    path: '/auth',
    element: (
      <RequireGuest>
        <AuthLayout />
      </RequireGuest>
    ),
    children: [
      { index: true, element: <Navigate to="login" replace /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'signup', element: <SignupPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
    ],
  },

  // Public auth routes — no guest guard (users may be logged in)
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      { path: 'reset-password', element: <ResetPasswordPage /> },
      { path: 'verify-email', element: <VerifyEmailPage /> },
    ],
  },

  {
    path: '/app',
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'contacts', element: <ContactsPage /> },
      { path: 'lists', element: <ListsPage /> },
      { path: 'lists/:id', element: <ListDetailPage /> },
      { path: 'tags', element: <TagsPage /> },
      { path: 'segments', element: <SegmentsPage /> },
      { path: 'campaigns', element: <CampaignsPage /> },
      { path: 'campaigns/new', element: <CampaignFormPage /> },
      { path: 'campaigns/:id', element: <CampaignDetailPage /> },
      { path: 'campaigns/:id/edit', element: <CampaignFormPage /> },
      { path: 'automations', element: <AutomationsPage /> },
      { path: 'automations/:id', element: <AutomationBuilderPage /> },
      { path: 'templates', element: <TemplatesPage /> },
      { path: 'templates/new', element: <TemplateEditorPage /> },
      { path: 'templates/:id/edit', element: <TemplateEditorPage /> },
      { path: 'sending/signatures', element: <SignaturesPage /> },
      { path: 'sending/domains', element: <DomainsPage /> },
      { path: 'sending/blacklist', element: <TagsPage /> },
    ],
  },

  {
    path: '/admin',
    element: (
      <RequirePlatformAdmin>
        <AdminLayout />
      </RequirePlatformAdmin>
    ),
    children: [
      { index: true, element: <AdminDashboardPage /> },
    ],
  },

  { path: '*', element: <Navigate to="/app" replace /> },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
