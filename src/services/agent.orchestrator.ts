import { Agent, AgentStatus } from '../types';

/**
 * AgentOrchestrator manages parallel agent execution.
 * Handles error recovery and user iteration loops.
 */
export class AgentOrchestrator {
    private agents: Map<string, Agent> = new Map();
    private listeners: Set<(agents: Agent[]) => void> = new Set();

    /**
     * Register an agent
     */
    registerAgent(agent: Agent): void {
        this.agents.set(agent.id, agent);
        this.notifyListeners();
    }

    /**
     * Update agent status
     */
    updateAgent(id: string, updates: Partial<Agent>): void {
        const agent = this.agents.get(id);
        if (agent) {
            Object.assign(agent, updates);
            this.notifyListeners();
        }
    }

    /**
     * Run multiple agents in parallel
     */
    async runParallelAgents(
        agentTasks: Array<{
            id: string;
            name: string;
            task: () => Promise<string>;
        }>
    ): Promise<Map<string, string>> {
        // Register all agents
        agentTasks.forEach(({ id, name }) => {
            this.registerAgent({
                id,
                name,
                status: AgentStatus.IDLE,
                progress: 0,
            });
        });

        // Execute all tasks in parallel using Promise.allSettled
        const results = await Promise.allSettled(
            agentTasks.map(async ({ id, task }) => {

                try {
                    this.updateAgent(id, { status: AgentStatus.RUNNING, progress: 0 });

                    const result = await task();

                    this.updateAgent(id, {
                        status: AgentStatus.COMPLETED,
                        progress: 100,
                        output: result,
                    });

                    return { id, result };
                } catch (error) {
                    this.updateAgent(id, {
                        status: AgentStatus.FAILED,
                        error: error instanceof Error ? error.message : 'Unknown error',
                    });
                    throw error;
                }
            })
        );

        // Collect results
        const outputMap = new Map<string, string>();
        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                outputMap.set(result.value.id, result.value.result);
            } else {
                console.error(`Agent ${agentTasks[index].id} failed:`, result.reason);
            }
        });

        return outputMap;
    }

    /**
     * Subscribe to agent updates
     */
    subscribe(listener: (agents: Agent[]) => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    /**
     * Get all agents
     */
    getAgents(): Agent[] {
        return Array.from(this.agents.values());
    }

    /**
     * Clear all agents
     */
    clear(): void {
        this.agents.clear();
        this.notifyListeners();
    }

    private notifyListeners(): void {
        const agents = this.getAgents();
        this.listeners.forEach((listener) => listener(agents));
    }
}

export const agentOrchestrator = new AgentOrchestrator();
