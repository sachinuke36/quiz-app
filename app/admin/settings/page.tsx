"use client";

import { useState, useEffect } from "react";
import { Loader2, Save, QrCode, CreditCard, ImageIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    payment_qr_code: "",
    payment_upi_id: "",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (data.success) {
        setSettings({
          payment_qr_code: data.data.payment_qr_code || "",
          payment_upi_id: data.data.payment_upi_id || "",
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Settings saved successfully");
      } else {
        toast.error(data.error || "Failed to save settings");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure payment and platform settings</p>
      </div>

      {/* Payment Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Payment Settings</CardTitle>
              <CardDescription>Configure QR code and UPI details for payments</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* QR Code URL */}
          <div className="space-y-2">
            <Label htmlFor="qrCode">Payment QR Code Image URL</Label>
            <div className="flex gap-2">
              <Input
                id="qrCode"
                value={settings.payment_qr_code}
                onChange={(e) =>
                  setSettings({ ...settings, payment_qr_code: e.target.value })
                }
                placeholder="https://example.com/your-qr-code.png"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Upload your UPI QR code to an image hosting service (like Imgur, Cloudinary) and paste the URL here
            </p>
          </div>

          {/* QR Code Preview */}
          {settings.payment_qr_code && (
            <div className="space-y-2">
              <Label>QR Code Preview</Label>
              <div className="border rounded-lg p-4 bg-white inline-block">
                <img
                  src={settings.payment_qr_code}
                  alt="Payment QR Code"
                  className="w-48 h-48 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            </div>
          )}

          {!settings.payment_qr_code && (
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <QrCode className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No QR code configured yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Add a QR code URL above to display it to users
              </p>
            </div>
          )}

          {/* UPI ID */}
          <div className="space-y-2">
            <Label htmlFor="upiId">UPI ID</Label>
            <Input
              id="upiId"
              value={settings.payment_upi_id}
              onChange={(e) =>
                setSettings({ ...settings, payment_upi_id: e.target.value })
              }
              placeholder="yourname@upi"
            />
            <p className="text-xs text-muted-foreground">
              Your UPI ID will be displayed to users for manual payment
            </p>
          </div>

          {/* Save Button */}
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How it works</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Generate a QR code from your UPI app (Google Pay, PhonePe, Paytm, etc.)</li>
            <li>Upload the QR code image to an image hosting service</li>
            <li>Paste the image URL in the field above</li>
            <li>Add your UPI ID for users who prefer manual entry</li>
            <li>Users will see this QR code when making payments</li>
            <li>After payment, users submit their UTR number</li>
            <li>You can approve/reject payments from the Payments page</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
