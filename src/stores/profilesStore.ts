/**
 * profilesStore
 * - Purpose: Manage pharmacy profiles per authenticated member account.
 * - Features:
 *   - CRUD: add, update, remove.
 *   - Persist profiles per user in localStorage (keyed by user id).
 *   - Track the currently active profile (currentProfileId).
 * - Note: All roles have equal access in-app; profile selection is for personalization and record-keeping only.
 */

import { create } from 'zustand';
import type { PharmacyProfile, ProfileRole } from '../types';

/**
 * Shape of the persisted payload for a given user.
 */
interface PersistedProfiles {
  profiles: PharmacyProfile[];
  currentProfileId: string | null;
  updatedAt: string;
}

interface ProfilesState {
  profiles: PharmacyProfile[];
  currentProfileId: string | null;
  loadedForUserId: string | null;
  // Actions
  ensureLoaded: (userId: string) => void;
  setCurrentProfile: (profileId: string | null) => void;
  addProfile: (userId: string, data: Omit<PharmacyProfile, 'id' | 'createdAt' | 'updatedAt'>) => PharmacyProfile;
  updateProfile: (userId: string, id: string, changes: Partial<PharmacyProfile>) => void;
  removeProfile: (userId: string, id: string) => void;
  reset: () => void;
}

/**
 * Build a localStorage key for a user's profiles.
 */
function storageKey(userId: string) {
  return `profiles:${userId}`;
}

/**
 * Safe JSON parse from localStorage.
 */
function loadFromStorage(userId: string): PersistedProfiles | null {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedProfiles;
    if (!parsed || !Array.isArray(parsed.profiles)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Save to localStorage.
 */
function saveToStorage(userId: string, payload: PersistedProfiles) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(payload));
  } catch {
    // ignore quota or serialization errors
  }
}

/**
 * Generate a simple unique id.
 */
function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useProfilesStore = create<ProfilesState>((set, get) => ({
  profiles: [],
  currentProfileId: null,
  loadedForUserId: null,

  /**
   * Ensure profiles are loaded for the given user id (idempotent).
   */
  ensureLoaded: (userId) => {
    const state = get();
    if (state.loadedForUserId === userId) return;

    const persisted = loadFromStorage(userId);
    if (persisted) {
      set({
        profiles: persisted.profiles,
        currentProfileId: persisted.currentProfileId,
        loadedForUserId: userId,
      });
    } else {
      // Initialize empty for this user
      set({
        profiles: [],
        currentProfileId: null,
        loadedForUserId: userId,
      });
      saveToStorage(userId, {
        profiles: [],
        currentProfileId: null,
        updatedAt: new Date().toISOString(),
      });
    }
  },

  /**
   * Set the current active profile id (persisted).
   */
  setCurrentProfile: (profileId) => {
    const { loadedForUserId, profiles } = get();
    set({ currentProfileId: profileId });
    if (loadedForUserId) {
      saveToStorage(loadedForUserId, {
        profiles,
        currentProfileId: profileId,
        updatedAt: new Date().toISOString(),
      });
    }
  },

  /**
   * Add a new profile for the current user.
   */
  addProfile: (userId, data) => {
    const profile: PharmacyProfile = {
      id: uid(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const { profiles, currentProfileId } = get();
    const next = [...profiles, profile];
    set({ profiles: next, currentProfileId: currentProfileId ?? profile.id, loadedForUserId: userId });
    saveToStorage(userId, {
      profiles: next,
      currentProfileId: currentProfileId ?? profile.id,
      updatedAt: new Date().toISOString(),
    });
    return profile;
  },

  /**
   * Update an existing profile by id.
   */
  updateProfile: (userId, id, changes) => {
    const { profiles, currentProfileId } = get();
    const next = profiles.map((p) => (p.id === id ? { ...p, ...changes, updatedAt: new Date().toISOString() } : p));
    set({ profiles: next });
    saveToStorage(userId, {
      profiles: next,
      currentProfileId,
      updatedAt: new Date().toISOString(),
    });
  },

  /**
   * Remove a profile by id.
   */
  removeProfile: (userId, id) => {
    const { profiles, currentProfileId } = get();
    const next = profiles.filter((p) => p.id !== id);
    const nextCurrent = currentProfileId === id ? (next[0]?.id ?? null) : currentProfileId;
    set({ profiles: next, currentProfileId: nextCurrent });
    saveToStorage(userId, {
      profiles: next,
      currentProfileId: nextCurrent,
      updatedAt: new Date().toISOString(),
    });
  },

  /**
   * Reset store (e.g., on logout).
   */
  reset: () => {
    set({ profiles: [], currentProfileId: null, loadedForUserId: null });
  },
}));
