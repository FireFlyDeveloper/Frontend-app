import { LoginForm } from '@/components/auth/LoginForm'

export function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Admin Records</h1>
          <p className="text-muted-foreground mt-2">Document & Inventory Management</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
