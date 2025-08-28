/**
 * My Account page (editable)
 * - Authenticated accounts can update their own account information.
 * - No billing content is shown (handled externally).
 */

import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Settings, Plus, Building, Mail, Phone } from 'lucide-react';
import Breadcrumbs from '../components/common/Breadcrumbs';
import AppShell from '../components/layout/AppShell';
import MemberSidebar from '../components/layout/MemberSidebar';
import ProfilesTable from '../components/profiles/ProfilesTable';
import AddProfileModal from '../components/profiles/AddProfileModal';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useProfilesStore } from '../stores/profilesStore';
import { useAuth } from '../components/auth/AuthContext';
import { useAuthStore } from '../stores/authStore';

export default function Account() {
  const { account } = useAuth();
  const { ensureLoaded } = useProfilesStore();
  const { updateAccount } = useAuthStore();
  const [addOpen, setAddOpen] = useState(false);

  // Local editable state seeded from account
  const [form, setForm] = useState({
    email: account?.email || '',
    pharmacyName: account?.pharmacyName || '',
    pharmacyPhone: account?.pharmacyPhone || '',
    address1: account?.address1 || '',
    city: account?.city || '',
    state: account?.state || '',
    zipcode: account?.zipcode || '',
  });

  useEffect(() => {
    if (account?.id) ensureLoaded(account.id);
  }, [account?.id, ensureLoaded]);

  useEffect(() => {
    setForm({
      email: account?.email || '',
      pharmacyName: account?.pharmacyName || '',
      pharmacyPhone: account?.pharmacyPhone || '',
      address1: account?.address1 || '',
      city: account?.city || '',
      state: account?.state || '',
      zipcode: account?.zipcode || '',
    });
  }, [
    account?.email,
    account?.pharmacyName,
    account?.pharmacyPhone,
    account?.address1,
    account?.city,
    account?.state,
    account?.zipcode,
  ]);

  const header = (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-4">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'My Account' },
        ]}
        className="mb-2"
      />
      <div className="mb-1 text-2xl font-bold">My Account</div>
      <div className="text-sm text-gray-600">Manage your pharmacy account and team profiles.</div>
    </div>
  );

  const statusBadge =
    account?.subscriptionStatus === 'active' ? (
      <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100">
        Active
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-100">
        Inactive
      </Badge>
    );

  async function handleSave() {
    try {
      const updated = await updateAccount({
        email: form.email,
        pharmacyName: form.pharmacyName,
        pharmacyPhone: form.pharmacyPhone || null,
        address1: form.address1 || null,
        city: form.city || null,
        state: form.state || null,
        zipcode: form.zipcode || null,
      });
      if (updated) toast.success('Account updated successfully');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update account');
    }
  }

  return (
    <AppShell sidebar={<MemberSidebar />} header={header}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Account summary (editable) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">Pharmacy Name</label>
                  <input
                    type="text"
                    value={form.pharmacyName}
                    onChange={(e) => setForm((s) => ({ ...s, pharmacyName: e.target.value }))}
                    className="w-full rounded-md border p-2"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Status</label>
                  <div className="flex h-10 items-center">{statusBadge}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">Email</label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-500" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                      className="w-full rounded-md border p-2"
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Note: Changing your account email does not change your Supabase auth login email automatically.
                  </p>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Phone</label>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      value={form.pharmacyPhone ?? ''}
                      onChange={(e) => setForm((s) => ({ ...s, pharmacyPhone: e.target.value }))}
                      className="w-full rounded-md border p-2"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">Address</label>
                  <input
                    type="text"
                    value={form.address1 ?? ''}
                    onChange={(e) => setForm((s) => ({ ...s, address1: e.target.value }))}
                    className="w-full rounded-md border p-2"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">City</label>
                  <input
                    type="text"
                    value={form.city ?? ''}
                    onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))}
                    className="w-full rounded-md border p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium">State</label>
                  <input
                    type="text"
                    value={form.state ?? ''}
                    onChange={(e) => setForm((s) => ({ ...s, state: e.target.value }))}
                    className="w-full rounded-md border p-2"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium">Zip Code</label>
                  <input
                    type="text"
                    value={form.zipcode ?? ''}
                    onChange={(e) => setForm((s) => ({ ...s, zipcode: e.target.value }))}
                    className="w-full rounded-md border p-2"
                  />
                </div>
              </div>

              <Button onClick={handleSave}>
                <Settings className="mr-2 h-4 w-4" />
                Save changes
              </Button>
              <p className="text-xs text-slate-500">Updates apply to this account only. Profiles are managed below.</p>
            </div>
          </CardContent>
        </Card>

        {/* Pharmacy Team Profiles */}
        <div className="mt-6">
          <Card>
            <CardHeader className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2">Pharmacy Team Profiles</CardTitle>
              <Button onClick={() => setAddOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Profile
              </Button>
            </CardHeader>
            <CardContent>
              <ProfilesTable />
            </CardContent>
          </Card>
        </div>

        {/* Add Profile Modal */}
        <AddProfileModal open={addOpen} onOpenChange={setAddOpen} />
      </div>
    </AppShell>
  );
}
