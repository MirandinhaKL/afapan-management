import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { LoginForm } from "@/components/login-form"

const authMock = {
  login: vi.fn(),
  isPasswordRecovery: false,
  requestPasswordReset: vi.fn(),
  updatePassword: vi.fn(),
  cancelPasswordRecovery: vi.fn(),
}

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => authMock,
}))

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("permite mostrar e ocultar a senha", async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    const passwordInput = screen.getByLabelText("Senha")
    const visibilityButton = screen.getByRole("button", { name: "Mostrar senha" })

    expect(passwordInput).toHaveAttribute("type", "password")

    await user.click(visibilityButton)

    expect(passwordInput).toHaveAttribute("type", "text")
    expect(screen.getByRole("button", { name: "Ocultar senha" })).toHaveAttribute(
      "aria-pressed",
      "true"
    )

    await user.click(screen.getByRole("button", { name: "Ocultar senha" }))

    expect(passwordInput).toHaveAttribute("type", "password")
    expect(screen.getByRole("button", { name: "Mostrar senha" })).toHaveAttribute(
      "aria-pressed",
      "false"
    )
  })
})
