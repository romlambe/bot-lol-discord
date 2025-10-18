export class MemoryManager {
  private static instance: MemoryManager;
  
  public static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  public startMemoryMonitoring() {
    setInterval(() => {
      this.cleanupMemory();
    }, 30 * 60 * 1000);
  }

  private cleanupMemory() {
    if (global.gc) {
      console.log('🧹 Running garbage collection...');
      const before = process.memoryUsage().heapUsed / 1024 / 1024;
      global.gc();
      const after = process.memoryUsage().heapUsed / 1024 / 1024;
      console.log(`Memory cleaned: ${before.toFixed(2)}MB → ${after.toFixed(2)}MB`);
    }
  }

  public getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024 * 100) / 100,
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024 * 100) / 100,
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100,
      external: Math.round(usage.external / 1024 / 1024 * 100) / 100
    };
  }
}