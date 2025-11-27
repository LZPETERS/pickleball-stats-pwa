import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import App from './App';
import SignIn from './routes/SignIn';
import Dashboard from './routes/Dashboard';
import Reset from './routes/Reset';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />, // layout with <Outlet />
    children: [
      { index: true, element: <SignIn /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'reset', element: <Reset /> },   // ← reset page
    ],
  },
]);

const qc = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
);
