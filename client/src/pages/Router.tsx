import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from './MainLayout';
import { AuthenticatedLayout } from './AuthenticatedLayout';
import { LoginPage } from './LoginPage';
import { PolicyPage } from './PolicyPage';
import { DocumentManagement } from './DocumentManagement';


export const router = createBrowserRouter([
    {
      element: <MainLayout />,
      children: [
        {
            path: '/',
            element: <AuthenticatedLayout />,
            children: [
                {
                    path: '/docbot',
                    element: <PolicyPage/>
                },
                {
                    path: '/documentManagement',
                    element: <DocumentManagement/>
                },
                {
                    path:'*',
                    element: <Navigate to="/" replace />
                }

            ]
        },
        {
            path: '/login',
            element: <LoginPage />
        },
        {
            path: '*',
            element: <Navigate to="/login" replace />
        }
      ]
    },
  ]);
