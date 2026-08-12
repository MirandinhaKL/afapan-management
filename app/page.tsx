"use client"

import { useState } from "react"
import { AuthProvider, useAuth } from "@/lib/auth-context"
import { LoginForm } from "@/components/login-form"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardPage } from "@/components/dashboard-page"
import { UsersPage } from "@/components/users-page"
import { CompostagemPage } from "@/components/compostagem-page"
import { EcoDrivePage } from "@/components/eco-drive-page"

type Page = "dashboard" | "usuarios" | "compostagem" | "eco-drive"

function AppContent() {
  const { isAuthenticated, isPasswordRecovery, loading } = useAuth()
  const [currentPage, setCurrentPage] = useState<Page>("dashboard")

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (isPasswordRecovery || !isAuthenticated) {
    return <LoginForm />
  }

  return (
    <DashboardLayout currentPage={currentPage} onNavigate={setCurrentPage}>
      {currentPage === "dashboard" && <DashboardPage />}
      {currentPage === "usuarios" && <UsersPage />}
      {currentPage === "compostagem" && <CompostagemPage />}
      {currentPage === "eco-drive" && <EcoDrivePage />}
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
