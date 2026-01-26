import { useState, useEffect, useCallback } from 'react';
import type { AppSettings } from '../types';
import { initializeSettings, getSettings, updateSettings as dbUpdateSettings } from '../db/database';

/**
 * Hook for managing app settings
 */
export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Load settings on mount
  useEffect(() => {
    let mounted = true;

    async function loadSettings() {
      try {
        await initializeSettings();
        const loaded = await getSettings();
        if (mounted) {
          setSettings(loaded);
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadSettings();

    return () => {
      mounted = false;
    };
  }, []);

  // Update settings
  const updateSettings = useCallback(async (updates: Partial<AppSettings>) => {
    const updated = await dbUpdateSettings(updates);
    setSettings(updated);
    return updated;
  }, []);

  // Toggle LLM feature
  const toggleLLM = useCallback(async (enabled: boolean) => {
    return updateSettings({ llmEnabled: enabled });
  }, [updateSettings]);

  // Set LLM API key
  const setLLMApiKey = useCallback(async (apiKey: string) => {
    return updateSettings({ llmApiKey: apiKey });
  }, [updateSettings]);

  // Toggle sync
  const toggleSync = useCallback(async (enabled: boolean) => {
    return updateSettings({ syncEnabled: enabled });
  }, [updateSettings]);

  // Set sync token
  const setSyncToken = useCallback(async (token: string) => {
    return updateSettings({ syncToken: token });
  }, [updateSettings]);

  // Set encryption passphrase
  const setEncryptionPassphrase = useCallback(async (passphrase: string) => {
    return updateSettings({ encryptionPassphrase: passphrase });
  }, [updateSettings]);

  // Set theme
  const setTheme = useCallback(async (theme: AppSettings['theme']) => {
    return updateSettings({ theme });
  }, [updateSettings]);

  return {
    settings,
    loading,
    updateSettings,
    toggleLLM,
    setLLMApiKey,
    toggleSync,
    setSyncToken,
    setEncryptionPassphrase,
    setTheme
  };
}
