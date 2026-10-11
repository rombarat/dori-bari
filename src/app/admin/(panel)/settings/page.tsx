import { PageHeader } from "@/components/admin/page-parts";
import { BusinessSettingsForm } from "@/components/admin/business-settings-form";
import { PasswordForm } from "@/components/admin/password-form";
import { getSettings } from "@/lib/catalog";

export default async function SettingsPage() {
  const settings = await getSettings();
  return (
    <>
      <PageHeader title="הגדרות" description="הפרטים שמופיעים בחנות ובאישור ההזמנה." />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px] xl:items-start">
        <BusinessSettingsForm settings={settings} />
        <PasswordForm />
      </div>
    </>
  );
}
