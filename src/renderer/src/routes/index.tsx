import { Navigate, createHashRouter } from 'react-router-dom';
import { AppLayout } from '@/app/AppLayout';
import { AuthLayout } from '@/app/AuthLayout';
import { ProtectedRoute } from '@/components/routing/ProtectedRoute';
import { PublicRoute } from '@/components/routing/PublicRoute';
import { APP_ROUTES } from '@/constants/app-constants';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ProjectDetailPage } from '@/pages/ProjectDetailPage';
import { ProjectsPage } from '@/pages/ProjectsPage';
import { RegisterPage } from '@/pages/RegisterPage';

export const router = createHashRouter([
  {
    path: APP_ROUTES.root,
    element: <Navigate to={APP_ROUTES.projects} replace />,
  },
  {
    element: <PublicRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          {
            path: APP_ROUTES.login,
            element: <LoginPage />,
          },
          {
            path: APP_ROUTES.register,
            element: <RegisterPage />,
          },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            path: APP_ROUTES.projects,
            element: <ProjectsPage />,
          },
          {
            path: APP_ROUTES.projectDetailPattern,
            element: <ProjectDetailPage />,
          },
        ],
      },
    ],
  },
  {
    path: APP_ROUTES.notFound,
    element: <NotFoundPage />,
  },
]);
