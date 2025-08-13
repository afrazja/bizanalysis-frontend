import React from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App'
import ViewSnapshot from './pages/ViewSnapshot'
import './styles.css'

const router = createBrowserRouter([
  { path: '/', element: <App /> },
  { path: '/view/:id', element: <ViewSnapshot /> },
])

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
