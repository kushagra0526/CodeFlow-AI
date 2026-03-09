// CodeFlow AI - Offline Detector
// Detects and responds to online/offline status changes

/**
 * OfflineDetector class
 * Monitors browser online/offline status and notifies subscribers
 */
export class OfflineDetector {
  private listeners: Set<(online: boolean) => void> = new Set()

  constructor() {
    // Only set up listeners in browser environment
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.notifyListeners(true))
      window.addEventListener('offline', () => this.notifyListeners(false))
    }
  }

  /**
   * Check if browser is currently online
   */
  isOnline(): boolean {
    if (typeof navigator === 'undefined') {
      // Server-side rendering - assume online
      return true
    }
    return navigator.onLine
  }

  /**
   * Subscribe to online/offline status changes
   * @param callback Function to call when status changes
   * @returns Unsubscribe function
   */
  subscribe(callback: (online: boolean) => void): () => void {
    this.listeners.add(callback)
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback)
    }
  }

  /**
   * Notify all subscribers of status change
   */
  private notifyListeners(online: boolean): void {
    this.listeners.forEach(listener => {
      try {
        listener(online)
      } catch (error) {
        console.error('Error in offline detector listener:', error)
      }
    })
  }

  /**
   * Clean up event listeners
   */
  destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', () => this.notifyListeners(true))
      window.removeEventListener('offline', () => this.notifyListeners(false))
    }
    this.listeners.clear()
  }
}

// Export singleton instance
export const offlineDetector = new OfflineDetector()
