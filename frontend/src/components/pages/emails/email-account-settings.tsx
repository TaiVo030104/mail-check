import { AlertCircle, CheckCircle, Loader2, Mail, Settings, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useEmailConfig,
  useRemoveEmailConfig,
  useSaveEmailConfig,
} from "@/hooks/react-query/use-email-config";

interface EmailAccountSettingsProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function EmailAccountSettings({
  open = false,
  onOpenChange,
}: EmailAccountSettingsProps = {}) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [provider, setProvider] = useState<"gmail" | "outlook" | "yahoo" | "other">("gmail");

  const { data: emailConfig, isLoading } = useEmailConfig();
  const saveConfig = useSaveEmailConfig();
  const removeConfig = useRemoveEmailConfig();

  const handleSaveConfig = async () => {
    if (!email || !password) {
      return;
    }

    await saveConfig.mutateAsync({
      email,
      password,
      provider,
    });

    setShowAddDialog(false);
    setEmail("");
    setPassword("");
  };

  const handleRemoveConfig = async () => {
    if (window.confirm("Are you sure you want to remove this email account?")) {
      await removeConfig.mutateAsync();
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="size-6 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <div className="space-y-6">
            <div>
              <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                <Settings className="size-6" />
                Email Account Settings
              </h2>
              <p className="mt-2 text-muted-foreground">
                Connect your IMAP/SMTP email accounts to read and send emails
              </p>
            </div>

            {emailConfig ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="size-5 text-green-600" />
                    Connected Account
                  </CardTitle>
                  <CardDescription>
                    Your email account is configured and ready to use
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg bg-muted p-4">
                    <div className="flex items-center gap-3">
                      <Mail className="size-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{emailConfig.email}</p>
                        <p className="text-sm capitalize text-muted-foreground">
                          Provider: {emailConfig.provider}
                        </p>
                        {emailConfig.lastVerified && (
                          <p className="text-xs text-muted-foreground">
                            Last verified: {new Date(emailConfig.lastVerified).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleRemoveConfig}
                      disabled={removeConfig.isPending}
                    >
                      {removeConfig.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="mr-2 size-4" />
                          Remove
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="size-5 text-yellow-600" />
                    No Email Account Connected
                  </CardTitle>
                  <CardDescription>
                    Connect an IMAP/SMTP email account to access your emails from Outlook, Yahoo, or
                    other providers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => setShowAddDialog(true)}>
                    <Mail className="mr-2 size-4" />
                    Add Email Account
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Supported Providers</CardTitle>
                <CardDescription>We support the following email providers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-lg border p-4">
                    <h3 className="font-semibold">Gmail</h3>
                    <p className="text-sm text-muted-foreground">
                      Uses OAuth2 - login with Google button
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h3 className="font-semibold">Outlook / Office 365</h3>
                    <p className="text-sm text-muted-foreground">IMAP: outlook.office365.com</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h3 className="font-semibold">Yahoo Mail</h3>
                    <p className="text-sm text-muted-foreground">IMAP: imap.mail.yahoo.com</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Email Account</DialogTitle>
            <DialogDescription>
              Enter your email credentials. Your password will be encrypted and stored securely.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="provider">Email Provider</Label>
              <Select value={provider} onValueChange={(v) => setProvider(v as typeof provider)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gmail">Gmail (IMAP/SMTP)</SelectItem>
                  <SelectItem value="outlook">Outlook / Office 365</SelectItem>
                  <SelectItem value="yahoo">Yahoo Mail</SelectItem>
                  <SelectItem value="other">Other Provider</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password / App Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Your email password or app-specific password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                For Gmail: Use an{" "}
                <a
                  href="https://support.google.com/accounts/answer/185833"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  app password
                </a>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveConfig}
              disabled={saveConfig.isPending || !email || !password}
            >
              {saveConfig.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Connect Account"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
