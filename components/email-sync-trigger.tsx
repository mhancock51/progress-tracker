'use client';

import { useEffect, useRef } from 'react';

export function EmailSyncTrigger() {
  const hasTriggered = useRef(false);

  useEffect(() => {
    // Only trigger once per app load
    if (hasTriggered.current) return;
    hasTriggered.current = true;

    // Trigger sync after a short delay to ensure everything is loaded
    const timer = setTimeout(async () => {
      try {
        const response = await fetch('/api/sync-email', {
          method: 'POST',
        });

        const contentType = response.headers.get('content-type');
        
        if (contentType?.includes('application/json')) {
          const result = await response.json();
          if (result.success) {
            console.log('✓ Email synced:', result.message);
          }
        }
      } catch (error) {
        // Silently fail - sync can be triggered manually if needed
        console.log('Email sync skipped');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return null;
}
