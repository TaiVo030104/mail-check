/**
 * Service Worker Registration and Management
 * Provides offline caching capabilities for the email client
 */

export interface ServiceWorkerStatus {
  isSupported: boolean;
  isRegistered: boolean;
  isActive: boolean;
  updateAvailable: boolean;
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private updateCallback: (() => void) | null = null;

  /**
   * Check if service workers are supported
   */
  isSupported(): boolean {
    return 'serviceWorker' in navigator;
  }

  /**
   * Register the service worker
   */
  async register(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported()) {
      console.log('[SW Manager] Service Workers not supported');
      return null;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('[SW Manager] Service Worker registered:', this.registration);

      // Check for updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration?.installing;
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available
              console.log('[SW Manager] New service worker available');
              if (this.updateCallback) {
                this.updateCallback();
              }
            }
          });
        }
      });

      // Check for updates periodically (every hour)
      setInterval(() => {
        this.registration?.update();
      }, 1000 * 60 * 60);

      return this.registration;
    } catch (error) {
      console.error('[SW Manager] Registration failed:', error);
      return null;
    }
  }

  /**
   * Unregister the service worker
   */
  async unregister(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const success = await this.registration.unregister();
      console.log('[SW Manager] Service Worker unregistered:', success);
      return success;
    } catch (error) {
      console.error('[SW Manager] Unregistration failed:', error);
      return false;
    }
  }

  /**
   * Update the service worker
   */
  async update(): Promise<void> {
    if (!this.registration) {
      return;
    }

    try {
      await this.registration.update();
      console.log('[SW Manager] Service Worker update checked');
    } catch (error) {
      console.error('[SW Manager] Update failed:', error);
    }
  }

  /**
   * Skip waiting and activate new service worker
   */
  skipWaiting(): void {
    if (this.registration?.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  /**
   * Clear all caches
   */
  async clearCaches(): Promise<void> {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log('[SW Manager] All caches cleared');
    }
  }

  /**
   * Get current service worker status
   */
  getStatus(): ServiceWorkerStatus {
    return {
      isSupported: this.isSupported(),
      isRegistered: this.registration !== null,
      isActive: this.registration?.active !== null,
      updateAvailable: this.registration?.waiting !== null,
    };
  }

  /**
   * Set callback for when updates are available
   */
  onUpdateAvailable(callback: () => void): void {
    this.updateCallback = callback;
  }

  /**
   * Get cache storage estimate
   */
  async getStorageEstimate(): Promise<{
    usage: number;
    quota: number;
    percentage: number;
  }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const percentage = quota > 0 ? (usage / quota) * 100 : 0;

      return { usage, quota, percentage };
    }

    return { usage: 0, quota: 0, percentage: 0 };
  }
}

// Export singleton instance
export const swManager = new ServiceWorkerManager();

// Auto-register on module load (in production only)
if (import.meta.env.PROD && typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    swManager.register().catch(console.error);
  });
}
