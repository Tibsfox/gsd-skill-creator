import * as fs from 'fs';
import * as path from 'path';
import { CoActivationTracker, SkillCoActivation } from './co-activation-tracker.js';
import { ClusterDetector, SkillCluster } from './cluster-detector.js';
import { AgentGenerator, GeneratedAgent } from './agent-generator.js';
import { SessionObservation } from '../types/observation.js';
import { SkillStore } from '../storage/skill-store.js';
import { inferDomain, generateAgentId } from '../identifiers/generator.js';
import type { AgentId } from '../identifiers/types.js';

export type AgentSuggestionState = 'pending' | 'accepted' | 'deferred' | 'dismissed';

export interface AgentSuggestion {
  id: string;
  cluster: SkillCluster;
  state: AgentSuggestionState;
  createdAt: number;
  decidedAt?: number;
  createdAgentName?: string;
  agentId?: string;
  dismissReason?: string;
}

export class AgentSuggestionManager {
  private tracker: CoActivationTracker;
  private detector: ClusterDetector;
  private generator: AgentGenerator;
  private suggestionsPath: string;

  constructor(
    patternsDir: string = '.planning/patterns',
    skillStore?: SkillStore
  ) {
    this.tracker = new CoActivationTracker();
    this.detector = new ClusterDetector();
    this.generator = new AgentGenerator(skillStore ?? new SkillStore());
    this.suggestionsPath = path.join(patternsDir, 'agent-suggestions.json');
  }

  /**
   * Analyze sessions and detect new agent suggestions
   */
  async analyze(sessionsPath?: string): Promise<{
    newSuggestions: number;
    totalPending: number;
    suggestions: AgentSuggestion[];
  }> {
    // Load session observations
    const sessions = await this.loadSessions(sessionsPath);

    // Detect co-activations
    const coActivations = this.tracker.analyze(sessions);

    // Detect clusters
    const clusters = this.detector.detect(coActivations);

    // Load existing suggestions
    const existing = await this.loadSuggestions();
    const existingIds = new Set(existing.map(s => s.id));

    // Create new suggestions for clusters not yet suggested
    const newSuggestions: AgentSuggestion[] = [];
    for (const cluster of clusters) {
      if (!existingIds.has(cluster.id) && !this.isAlreadyAddressed(cluster, existing)) {
        newSuggestions.push({
          id: cluster.id,
          cluster,
          state: 'pending',
          createdAt: Date.now(),
        });
      }
    }

    // Merge and save
    const all = [...existing, ...newSuggestions];
    await this.saveSuggestions(all);

    const pending = all.filter(s => s.state === 'pending');

    return {
      newSuggestions: newSuggestions.length,
      totalPending: pending.length,
      suggestions: pending,
    };
  }

  async getPending(): Promise<AgentSuggestion[]> {
    const all = await this.loadSuggestions();
    return all.filter(s => s.state === 'pending');
  }

  async preview(suggestionId: string): Promise<GeneratedAgent | null> {
    const suggestions = await this.loadSuggestions();
    const suggestion = suggestions.find(s => s.id === suggestionId);
    if (!suggestion) return null;
    return this.generator.generateContent(suggestion.cluster);
  }

  async accept(suggestionId: string): Promise<{ success: boolean; agentName?: string; error?: string }> {
    const suggestions = await this.loadSuggestions();
    const idx = suggestions.findIndex(s => s.id === suggestionId);
    if (idx === -1) return { success: false, error: 'Suggestion not found' };

    try {
      const agent = await this.generator.create(suggestions[idx].cluster);
      const domain = inferDomain(suggestions[idx].cluster.suggestedDescription);
      const existingAgentIds = suggestions
        .filter(s => s.state === 'accepted' && s.agentId)
        .map(s => s.agentId as AgentId);
      const agentId = generateAgentId(domain, existingAgentIds);
      suggestions[idx].state = 'accepted';
      suggestions[idx].decidedAt = Date.now();
      suggestions[idx].createdAgentName = agent.name;
      suggestions[idx].agentId = agentId;
      await this.saveSuggestions(suggestions);
      return { success: true, agentName: agent.name };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  async defer(suggestionId: string): Promise<boolean> {
    return this.transition(suggestionId, 'deferred');
  }

  async dismiss(suggestionId: string, reason?: string): Promise<boolean> {
    const suggestions = await this.loadSuggestions();
    const idx = suggestions.findIndex(s => s.id === suggestionId);
    if (idx === -1) return false;

    suggestions[idx].state = 'dismissed';
    suggestions[idx].decidedAt = Date.now();
    suggestions[idx].dismissReason = reason;
    await this.saveSuggestions(suggestions);
    return true;
  }

  private async transition(suggestionId: string, state: AgentSuggestionState): Promise<boolean> {
    const suggestions = await this.loadSuggestions();
    const idx = suggestions.findIndex(s => s.id === suggestionId);
    if (idx === -1) return false;

    suggestions[idx].state = state;
    suggestions[idx].decidedAt = Date.now();
    await this.saveSuggestions(suggestions);
    return true;
  }

  private isAlreadyAddressed(cluster: SkillCluster, existing: AgentSuggestion[]): boolean {
    // Check if any existing suggestion covers the same skills
    const skillSet = new Set(cluster.skills);
    return existing.some(s => {
      const existingSkills = new Set(s.cluster.skills);
      return cluster.skills.every(sk => existingSkills.has(sk));
    });
  }

  private async loadSessions(sessionsPath?: string): Promise<SessionObservation[]> {
    const p = sessionsPath ?? '.planning/patterns/sessions.jsonl';
    if (!fs.existsSync(p)) return [];

    const content = fs.readFileSync(p, 'utf8');
    return content
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line) as SessionObservation);
  }

  private async loadSuggestions(): Promise<AgentSuggestion[]> {
    if (!fs.existsSync(this.suggestionsPath)) return [];
    const content = fs.readFileSync(this.suggestionsPath, 'utf8');
    return JSON.parse(content);
  }

  private async saveSuggestions(suggestions: AgentSuggestion[]): Promise<void> {
    fs.mkdirSync(path.dirname(this.suggestionsPath), { recursive: true });
    fs.writeFileSync(this.suggestionsPath, JSON.stringify(suggestions, null, 2));
  }
}
