import type { PipelineStage, PipelineContext } from '../skill-pipeline.js';

export class BudgetStage implements PipelineStage {
  readonly name = 'budget';

  constructor(...args: any[]) {}

  async process(context: PipelineContext): Promise<PipelineContext> {
    return context;
  }
}
