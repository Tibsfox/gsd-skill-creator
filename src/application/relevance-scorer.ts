import natural from 'natural';
import type { ScoredSkill } from '../types/application.js';
import type { SkillIndexEntry } from '../storage/skill-index.js';

export class RelevanceScorer {
  private tfidf: natural.TfIdf;
  private skillMap = new Map<number, SkillIndexEntry>();
  private indexed = false;

  constructor() {
    this.tfidf = new natural.TfIdf();
  }

  // Build TF-IDF corpus from skill descriptions and trigger patterns
  indexSkills(skills: SkillIndexEntry[]): void {
    this.tfidf = new natural.TfIdf();
    this.skillMap.clear();

    skills.forEach((skill, index) => {
      const document = this.buildDocument(skill);
      this.tfidf.addDocument(document);
      this.skillMap.set(index, skill);
    });

    this.indexed = true;
  }

  // Build searchable document from skill metadata
  private buildDocument(skill: SkillIndexEntry): string {
    const parts: string[] = [skill.description];

    if (skill.triggers) {
      if (skill.triggers.intents) {
        parts.push(...skill.triggers.intents);
      }
      if (skill.triggers.contexts) {
        parts.push(...skill.triggers.contexts);
      }
    }

    return parts.join(' ');
  }

  // Score skills against a query (user intent or context)
  scoreAgainstQuery(query: string, threshold: number = 0.1): ScoredSkill[] {
    if (!this.indexed) {
      return [];
    }

    const results: ScoredSkill[] = [];

    this.tfidf.tfidfs(query, (index, score) => {
      const skill = this.skillMap.get(index);
      if (skill && score > threshold) {
        results.push({
          name: skill.name,
          score,
          matchType: 'intent',
        });
      }
    });

    return results.sort((a, b) => b.score - a.score);
  }

  // Score with match type detection
  scoreWithMatchType(
    query: string,
    matchType: 'intent' | 'file' | 'context',
    threshold: number = 0.1
  ): ScoredSkill[] {
    const results = this.scoreAgainstQuery(query, threshold);
    return results.map(r => ({ ...r, matchType }));
  }

  // Get top N skills by relevance
  getTopSkills(query: string, n: number = 3, threshold: number = 0.1): ScoredSkill[] {
    return this.scoreAgainstQuery(query, threshold).slice(0, n);
  }

  // Check if scorer has been indexed
  isIndexed(): boolean {
    return this.indexed;
  }

  // Get number of indexed skills
  getIndexSize(): number {
    return this.skillMap.size;
  }
}
