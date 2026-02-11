export interface ServiceWorkerStatus {
  isSupported: boolean;
  isRegistered: boolean;
  isActive: boolean;
  updateAvailable: boolean;
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private updateCallback: (() => void) | null = null;

  isSupported(): boolean {
    return "serviceWorker" in navigator;
  }

  async register(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported()) {
      return null;
    }

    try {
      this.registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      this.registration.addEventListener("updatefound", () => {
        const newWorker = this.registration?.installing;

        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              if (this.updateCallback) {
                this.updateCallback();
              }
            }
          });
        }
      });

      setInterval(
        () => {
          this.registration?.update();
        },
        1000 * 60 * 60
      );

      return this.registration;
    } catch (error) {
      return null;
    }
  }

  async unregister(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const success = await this.registration.unregister();
      return success;
    } catch (error) {
      return false;
    }
  }

  async update(): Promise<void> {
    if (!this.registration) {
      return;
    }

    try {
      await this.registration.update();
    } catch {
      // ignore - SW update failure is non-critical
    }
  }

  skipWaiting(): void {
    if (this.registration?.waiting) {
      this.registration.waiting.postMessage({ type: "SKIP_WAITING" });
    }
  }

  async clearCaches(): Promise<void> {
    if ("caches" in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
    }
  }

  getStatus(): ServiceWorkerStatus {
    return {
      isSupported: this.isSupported(),
      isRegistered: this.registration !== null,
      isActive: this.registration?.active !== null,
      updateAvailable: this.registration?.waiting !== null,
    };
  }

  onUpdateAvailable(callback: () => void): void {
    this.updateCallback = callback;
  }

  async getStorageEstimate(): Promise<{
    usage: number;
    quota: number;
    percentage: number;
  }> {
    if ("storage" in navigator && "estimate" in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const percentage = quota > 0 ? (usage / quota) * 100 : 0;

      return { usage, quota, percentage };
    }

    return { usage: 0, quota: 0, percentage: 0 };
  }
}

export const swManager = new ServiceWorkerManager();

if (import.meta.env.PROD && typeof window !== "undefined") {
  window.addEventListener("load", () => {
    swManager.register().catch(console.error);
  });
}
