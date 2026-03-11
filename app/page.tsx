"use client"

import { useState } from "react"
import { AuthProvider, useAuth } from "@/lib/auth-context"
import { LoginForm } from "@/components/login-form"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardPage } from "@/components/dashboard-page"
import { UsersPage } from "@/components/users-page"
import { CompostagemPage } from "@/components/compostagem-page"

type Page = "dashboard" | "usuarios" | "compostagem"

function AppContent() {
  const { isAuthenticated } = useAuth()
  const [currentPage, setCurrentPage] = useState<Page>("dashboard")

  if (!isAuthenticated) {
    return <LoginForm />
  }

  return (
    <DashboardLayout currentPage={currentPage} onNavigate={setCurrentPage}>
      {currentPage === "dashboard" && <DashboardPage />}
      {currentPage === "usuarios" && <UsersPage />}
      {currentPage === "compostagem" && <CompostagemPage />}
    </DashboardLayout>
  )
}

export default function Home() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
