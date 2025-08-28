/**
 * AddProfileModal
 * - Purpose: Create or edit a MemberProfile via a modal form.
 * - Required fields: roleType, firstName, lastName.
 * - Optional fields validated lightly if provided.
 */

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '../../stores/authStore';
import { useProfilesStore } from '../../stores/profilesStore';
import type { MemberProfile, RoleType } from '../../types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';

/** Roles dropdown */
const ROLE_OPTIONS: RoleType[] = ['Pharmacist-PIC', 'Pharmacist-Staff', 'Pharmacy Technician'];

/** Zod schema */
const schema = z.object({
  roleType: z.enum(['Pharmacist-PIC', 'Pharmacist-Staff', 'Pharmacy Technician'], {
    required_error: 'Role is required',
  }),
  firstName: z.string().min(1, 'First Name is required'),
  lastName: z.string().min(1, 'Last Name is required'),
  phoneNumber: z.string().optional().refine((v) => !v || /^[0-9+()\-\s]{7,}$/.test(v), { message: 'Invalid phone number' }),
  profileEmail: z.string().optional().refine((v) => !v || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), { message: 'Invalid email' }),
  dobMonth: z.string().optional().refine((v) => !v || /^(0[1-9]|1[0-2])$/.test(v), { message: 'Use two digits (01-12)' }),
  dobDay: z.string().optional().refine((v) => !v || /^(0[1-9]|[12][0-9]|3[01])$/.test(v), { message: 'Use two digits (01-31)' }),
  dobYear: z.string().optional().refine((v) => !v || /^(19|20)\d{2}$/.test(v), { message: 'Use four digits (YYYY)' }),
  licenseNumber: z.string().optional(),
  nabpEprofileId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface AddProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId?: string;
  defaultValues?: Partial<MemberProfile>;
  onCreated?: (id: string) => void;
}

export default function AddProfileModal({
  open,
  onOpenChange,
  profileId,
  defaultValues,
  onCreated,
}: AddProfileModalProps) {
  const { account } = useAuthStore();
  const { ensureLoaded, addProfile, updateProfile } = useProfilesStore();

  useEffect(() => {
    if (account?.id) ensureLoaded(account.id);
  }, [account?.id, ensureLoaded]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      roleType: (defaultValues?.roleType as RoleType) || undefined,
      firstName: defaultValues?.firstName || '',
      lastName: defaultValues?.lastName || '',
      phoneNumber: defaultValues?.phoneNumber || '',
      profileEmail: defaultValues?.profileEmail || '',
      dobMonth: defaultValues?.dobMonth || '',
      dobDay: defaultValues?.dobDay || '',
      dobYear: defaultValues?.dobYear || '',
      licenseNumber: defaultValues?.licenseNumber || '',
      nabpEprofileId: defaultValues?.nabpEprofileId || '',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        roleType: (defaultValues?.roleType as RoleType) || undefined,
        firstName: defaultValues?.firstName || '',
        lastName: defaultValues?.lastName || '',
        phoneNumber: defaultValues?.phoneNumber || '',
        profileEmail: defaultValues?.profileEmail || '',
        dobMonth: defaultValues?.dobMonth || '',
        dobDay: defaultValues?.dobDay || '',
        dobYear: defaultValues?.dobYear || '',
        licenseNumber: defaultValues?.licenseNumber || '',
        nabpEprofileId: defaultValues?.nabpEprofileId || '',
      });
    }
  }, [open, defaultValues, reset]);

  async function onSubmit(values: FormValues) {
    if (!account?.id) return;

    if (profileId) {
      updateProfile(account.id, profileId, values);
    } else {
      const created = addProfile(account.id, {
        accountId: account.id,
        roleType: values.roleType,
        firstName: values.firstName,
        lastName: values.lastName,
        phoneNumber: values.phoneNumber || undefined,
        profileEmail: values.profileEmail || undefined,
        dobMonth: values.dobMonth || undefined,
        dobDay: values.dobDay || undefined,
        dobYear: values.dobYear || undefined,
        licenseNumber: values.licenseNumber || undefined,
        nabpEprofileId: values.nabpEprofileId || undefined,
        isActive: true,
      } as any);
      onCreated?.(created.id);
    }

    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{profileId ? 'Edit Profile' : 'Add Profile'}</DialogTitle>
          <DialogDescription>
            Only Role, First Name, and Last Name are required. You can add other details now or later.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Role */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              Role<span className="text-red-600">*</span>
            </label>
            <select className="w-full rounded-md border p-2" {...register('roleType')} defaultValue={defaultValues?.roleType || ''}>
              <option value="" disabled>
                Select role...
              </option>
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {errors.roleType && <p className="mt-1 text-xs text-red-600">{errors.roleType.message}</p>}
          </div>

          {/* Name */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">
                First Name<span className="text-red-600">*</span>
              </label>
              <input className="w-full rounded-md border p-2" {...register('firstName')} />
              {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Last Name<span className="text-red-600">*</span>
              </label>
              <input className="w-full rounded-md border p-2" {...register('lastName')} />
              {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName.message}</p>}
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Phone Number</label>
              <input className="w-full rounded-md border p-2" {...register('phoneNumber')} />
              {errors.phoneNumber && <p className="mt-1 text-xs text-red-600">{errors.phoneNumber.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Profile Email</label>
              <input type="email" className="w-full rounded-md border p-2" {...register('profileEmail')} />
              {errors.profileEmail && <p className="mt-1 text-xs text-red-600">{errors.profileEmail.message}</p>}
            </div>
          </div>

          {/* DOB */}
          <div>
            <label className="mb-1 block text-sm font-medium">Date of Birth</label>
            <div className="grid grid-cols-3 gap-2">
              <input placeholder="MM" maxLength={2} className="w-full rounded-md border p-2" {...register('dobMonth')} />
              <input placeholder="DD" maxLength={2} className="w-full rounded-md border p-2" {...register('dobDay')} />
              <input placeholder="YYYY" maxLength={4} className="w-full rounded-md border p-2" {...register('dobYear')} />
            </div>
            {(errors.dobMonth || errors.dobDay || errors.dobYear) && (
              <p className="mt-1 text-xs text-red-600">
                {errors.dobMonth?.message || errors.dobDay?.message || errors.dobYear?.message}
              </p>
            )}
          </div>

          {/* License + NABP */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">License Number</label>
              <input className="w-full rounded-md border p-2" {...register('licenseNumber')} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">NABP e-Profile ID</label>
              <input className="w-full rounded-md border p-2" {...register('nabpEprofileId')} />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {profileId ? 'Save Changes' : 'Create Profile'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
