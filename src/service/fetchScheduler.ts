import { fetchWorldsMatches } from '../api/fetchApi';
import { Colors } from '../interface/color';
import { 
  getLiveMatches, 
  getNextMatches, 
  getMatchesApproaching 
} from '../db/matches';

type FetchMode = 'idle' | 'approaching' | 'live';

export class FetchScheduler {
  private currentMode: FetchMode = 'idle';
  private currentTimeout: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor() {
    console.log(`${Colors.Orange}[SCHEDULER]: FetchScheduler initialized${Colors.Reset}`);
  }

  public start() {
    if (this.isRunning) {
      console.log(`${Colors.Orange}[SCHEDULER]: Already running${Colors.Reset}`);
      return;
    }
    this.isRunning = true;
    console.log(`${Colors.Orange}[SCHEDULER]: Starting adaptive fetch scheduler${Colors.Reset}`);
    this.scheduleNext();
  }

  public stop() {
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }
    this.isRunning = false;
    console.log(`${Colors.Orange}[SCHEDULER]: Stopped${Colors.Reset}`);
  }

  private scheduleNext() {
    if (!this.isRunning) return;

    // Define current interval mode
    const newMode = this.determineFetchMode();
    
    // Print interval log modification
    if (newMode !== this.currentMode) {
      console.log(`${Colors.Orange}[SCHEDULER]: Mode changed: ${this.currentMode} -> ${newMode}${Colors.Reset}`);
      this.currentMode = newMode;
    }

    // Get interval
    const interval = this.getIntervalForMode(this.currentMode);
    
    // Schedule next fetch
    this.currentTimeout = setTimeout(async () => {
      await this.executeFetch();
      this.scheduleNext();
    }, interval);
    
    console.log(`${Colors.Orange}[SCHEDULER]: Next fetch in ${interval/1000}s (${this.currentMode} mode)${Colors.Reset}`);
  }

  private determineFetchMode(): FetchMode {
    // Check for a running match
    if (this.isMatchCurrentlyLive()) {
      return 'live';
    }
    
    // Check for approaching match
    if (this.isMatchApproaching()) {
      return 'approaching';
    }
    
    // If their is no match, idle fetch interval
    return 'idle';
  }

  private isMatchCurrentlyLive(): boolean {
    const liveMatches = getLiveMatches();
    const hasLiveMatch = liveMatches.length > 0;
    if (hasLiveMatch) {
      console.log(`${Colors.Orange}[SCHEDULER]: ${liveMatches.length} live match(es) detected${Colors.Reset}`);
    }
    return hasLiveMatch;
  }

  private isMatchApproaching(): boolean {
    const approachingMatches = getMatchesApproaching();
    const hasApproachingMatch = approachingMatches.length > 0;
    if (hasApproachingMatch) {
      const nextMatch = approachingMatches[0];
      const timeUntilMatch = new Date(nextMatch.begin_at).getTime() - new Date().getTime();
      const minutesUntil = Math.round(timeUntilMatch / (1000 * 60));
      console.log(`${Colors.Orange}[SCHEDULER]: Match approaching: ${nextMatch.name} in ${minutesUntil} minutes${Colors.Reset}`);
    }
    
    return hasApproachingMatch;
  }

  private getIntervalForMode(mode: FetchMode): number {
    switch (mode) {
      case 'live':
        return 2 * 60 * 1000;      // 2 minutes
      case 'approaching':
        return 5 * 60 * 1000;      // 5 minutes
      case 'idle':
        return 60 * 60 * 1000;     // 1 heure
    }
  }

  private async executeFetch() {
    try {
      const beforeTime = new Date().toLocaleTimeString();
      console.log(`${Colors.Orange}[SCHEDULER]: Executing fetch at ${beforeTime} (${this.currentMode} mode)${Colors.Reset}`);
      await fetchWorldsMatches();
      const afterTime = new Date().toLocaleTimeString();
      console.log(`${Colors.Orange}[SCHEDULER]: Fetch completed at ${afterTime}${Colors.Reset}`);
    } catch (error) {
      console.error(`${Colors.Orange}[SCHEDULER]: Fetch failed: ${error}${Colors.Reset}`);
    }
  }

  // GETTERS

  public getCurrentMode(): FetchMode {
    return this.currentMode;
  }

  public getNextFetchIn(): number {
    return this.getIntervalForMode(this.currentMode);
  }

  public isActive(): boolean {
    return this.isRunning;
  }
}