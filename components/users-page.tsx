"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { roleLabels, type User, type UserRole } from "@/lib/mock-data"
import { ExportButton } from "@/components/export-button"
import { exportPDF, exportCSV } from "@/lib/export-utils"
import { fetchUsers, createUser, updateUser, deleteUser } from "@/lib/supabase-queries"
import { Plus, Pencil, Trash2, Search, UserCircle } from "lucide-react"
import { toast } from "sonner"

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)

  // Form state
  const [formNome, setFormNome] = useState("")
  const [formEmail, setFormEmail] = useState("")
  const [formRole, setFormRole] = useState<UserRole>("voluntario")

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const data = await fetchUsers()
      setUsers(data)
    } catch (error) {
      toast.error("Erro ao carregar usuários")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const openCreateDialog = () => {
    setEditingUser(null)
    setFormNome("")
    setFormEmail("")
    setFormRole("voluntario")
    setIsDialogOpen(true)
  }

  const openEditDialog = (user: User) => {
    setEditingUser(user)
    setFormNome(user.nome)
    setFormEmail(user.email)
    setFormRole(user.role)
    setIsDialogOpen(true)
  }

  const openDeleteDialog = (user: User) => {
    setDeletingUser(user)
    setIsDeleteDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formNome.trim() || !formEmail.trim()) {
      toast.error("Preencha todos os campos obrigatórios")
      return
    }

    try {
      if (editingUser) {
        await updateUser(editingUser.id, { nome: formNome, email: formEmail, role: formRole })
        toast.success("Usuário atualizado com sucesso")
      } else {
        await createUser({ nome: formNome, email: formEmail, role: formRole, ativo: true })
        toast.success("Usuário criado com sucesso")
      }
      await loadUsers()
      setIsDialogOpen(false)
    } catch (error) {
      toast.error("Erro ao salvar usuário")
      console.error(error)
    }
  }

  const handleDelete = async () => {
    if (!deletingUser) return

    try {
      await deleteUser(deletingUser.id)
      toast.success("Usuário removido com sucesso")
      await loadUsers()
      setIsDeleteDialogOpen(false)
      setDeletingUser(null)
    } catch (error) {
      toast.error("Erro ao excluir usuário")
      console.error(error)
    }
  }

  const handleExportPDF = () => {
    const headers = ["Nome", "E-mail", "Perfil", "Status", "Criado em"]
    const rows = users.map((u) => [
      u.nome,
      u.email,
      roleLabels[u.role],
      u.ativo ? "Ativo" : "Inativo",
      u.criadoEm,
    ])

    exportPDF({
      filename: "afapan-usuarios",
      title: "Relatorio de Usuarios",
      subtitle: `${users.length} usuarios cadastrados no sistema`,
      headers,
      rows,
    })
    toast.success("PDF de usuarios gerado com sucesso")
  }

  const handleExportCSV = () => {
    const headers = ["Nome", "E-mail", "Perfil", "Status", "Criado em"]
    const rows = users.map((u) => [
      u.nome,
      u.email,
      roleLabels[u.role],
      u.ativo ? "Ativo" : "Inativo",
      u.criadoEm,
    ])

    exportCSV({
      filename: "afapan-usuarios",
      headers,
      rows,
    })
    toast.success("CSV de usuarios gerado com sucesso")
  }

  const roleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case "admin":
        return "default"
      case "gestor":
        return "secondary"
      case "voluntario":
        return "outline"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Usuarios</h2>
          <p className="text-muted-foreground">
            Gerencie os usuarios que possuem acesso ao sistema.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton onExportPDF={handleExportPDF} onExportCSV={handleExportCSV} />
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus size={16} />
            Novo usuario
          </Button>
        </div>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Lista de usuarios</CardTitle>
              <CardDescription>{users.length} usuarios cadastrados</CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="Buscar por nome ou e-mail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">
              Carregando usuários...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                        Nenhum usuário encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                              <UserCircle size={18} className="text-primary" />
                            </div>
                            <span className="font-medium text-foreground">{user.nome}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={roleBadgeVariant(user.role)}>
                            {roleLabels[user.role]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              user.ativo
                                ? "border-success/30 bg-success/10 text-success"
                                : "border-destructive/30 bg-destructive/10 text-destructive"
                            }
                          >
                            {user.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(user)}
                              className="h-8 w-8"
                            >
                              <Pencil size={14} />
                              <span className="sr-only">Editar {user.nome}</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteDialog(user)}
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 size={14} />
                              <span className="sr-only">Excluir {user.nome}</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? "Editar usuario" : "Novo usuario"}</DialogTitle>
            <DialogDescription>
              {editingUser
                ? "Atualize as informacoes do usuario."
                : "Preencha os dados para criar um novo usuario."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="form-nome">Nome completo</Label>
              <Input
                id="form-nome"
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
                placeholder="Nome do usuario"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="form-email">E-mail</Label>
              <Input
                id="form-email"
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="email@afapan.org.br"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="form-role">Perfil de acesso</Label>
              <Select value={formRole} onValueChange={(v) => setFormRole(v as UserRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="gestor">Gestor</SelectItem>
                  <SelectItem value="voluntario">Voluntario</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editingUser ? "Salvar alteracoes" : "Criar usuario"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusao</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuario{" "}
              <strong>{deletingUser?.nome}</strong>? Esta acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
