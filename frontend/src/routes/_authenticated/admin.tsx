import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, BarChart, FileText, Mail, Settings, Shield, User, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserRole } from "@/constants";
import { useSignOut } from "@/hooks/react-query/use-auth";
import { ensureAuthForRoute } from "@/hooks/use-require-auth";
import { useUserRole } from "@/hooks/use-role";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const result = await ensureAuthForRoute([UserRole.ADMIN]);
    if (result !== true) return result;
    return true;
  },
  component: AdminPage,
});

function AdminPage() {
  const role = useUserRole();
  const signOutMutation = useSignOut();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        {}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/inbox" })}>
            <ArrowLeft className="size-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-lg border-2 border-slate-900 bg-slate-900">
                <Shield className="size-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Role: <span className="font-semibold">{role?.toUpperCase() || "UNKNOWN"}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Users</CardDescription>
              <CardTitle className="text-3xl">127</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active Sessions</CardDescription>
              <CardTitle className="text-3xl">43</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Currently online</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Emails</CardDescription>
              <CardTitle className="text-3xl">3,842</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Across all users</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>System Health</CardDescription>
              <CardTitle className="text-3xl text-green-600">100%</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">All systems operational</p>
            </CardContent>
          </Card>
        </div>

        {}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="transition-colors hover:border-slate-400">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="size-5 text-slate-700" />
                <CardTitle className="text-base font-semibold">User Management</CardTitle>
              </div>
              <CardDescription className="text-sm">
                View and manage all user accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Manage Users
              </Button>
            </CardContent>
          </Card>

          <Card className="transition-colors hover:border-slate-400">
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="size-5 text-slate-700" />
                <CardTitle className="text-base font-semibold">System Logs</CardTitle>
              </div>
              <CardDescription className="text-sm">View system activity and errors</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                View Logs
              </Button>
            </CardContent>
          </Card>

          <Card className="transition-colors hover:border-slate-400">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart className="size-5 text-slate-700" />
                <CardTitle className="text-base font-semibold">Analytics</CardTitle>
              </div>
              <CardDescription className="text-sm">Monitor usage and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                View Analytics
              </Button>
            </CardContent>
          </Card>

          <Card className="transition-colors hover:border-slate-400">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="size-5 text-slate-700" />
                <CardTitle className="text-base font-semibold">Email Settings</CardTitle>
              </div>
              <CardDescription className="text-sm">Configure email system settings</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Configure
              </Button>
            </CardContent>
          </Card>

          <Card className="transition-colors hover:border-slate-400">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="size-5 text-slate-700" />
                <CardTitle className="text-base font-semibold">Role Assignment</CardTitle>
              </div>
              <CardDescription className="text-sm">
                Manage user roles and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Assign Roles
              </Button>
            </CardContent>
          </Card>

          <Card className="transition-colors hover:border-slate-400">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="size-5 text-slate-700" />
                <CardTitle className="text-base font-semibold">System Config</CardTitle>
              </div>
              <CardDescription className="text-sm">Update system configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Configure
              </Button>
            </CardContent>
          </Card>
        </div>

        {}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button variant="default" onClick={() => navigate({ to: "/inbox" })}>
              <Mail className="mr-2 size-4" />
              Back to Inbox
            </Button>
            <Button variant="secondary" onClick={() => navigate({ to: "/profile" })}>
              <User className="mr-2 size-4" />
              View Profile
            </Button>
            <Button
              variant="outline"
              onClick={() => signOutMutation.mutate()}
              disabled={signOutMutation.isPending}
            >
              {signOutMutation.isPending ? "Signing out..." : "Sign Out"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
