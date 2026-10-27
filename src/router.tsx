import { createBrowserRouter } from 'react-router'
import { RequireAuth } from './auth/RequireAuth'
import { AppLayout } from './layouts/AppLayout'
import { RootLayout } from './layouts/RootLayout'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import NotFoundPage from './pages/NotFoundPage'
import RegisterPage from './pages/RegisterPage'
import NewsDetailRoute from './pages/news/NewsDetailModal'
import NewsPage from './pages/news/NewsPage'
import SagaStoryPage from './pages/sagas/SagaStoryPage'
import SagasPage from './pages/sagas/SagasPage'
import WantedDetailRoute from './pages/wanted/WantedDetailModal'
import WantedPage from './pages/wanted/WantedPage'

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      {
        // Todo lo de aquí adentro requiere sesión.
        element: <RequireAuth />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { index: true, element: <DashboardPage /> },
              { path: 'wanted', element: <WantedPage />, children: [{ path: ':id', element: <WantedDetailRoute /> }] },
              { path: 'news', element: <NewsPage />, children: [{ path: ':id', element: <NewsDetailRoute /> }] },
              { path: 'sagas', element: <SagasPage /> },
              { path: 'sagas/:id', element: <SagaStoryPage /> },
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
