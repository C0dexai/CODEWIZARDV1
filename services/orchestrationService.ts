import { generatePlanAndCode } from './geminiService';
import { getOpenAiAgentResponse } from './openaiService';
import type { FileSystemState, OrchestrationPlan } from '../types';

/**
 * Orchestrates a multi-agent task to deconstruct a high-level goal into a concrete development plan.
 * 1. A "planning" agent (Gemini) generates the steps and code.
 * 2. A "reviewing" agent (OpenAI mock) provides feedback on the plan.
 * 3. The final, reviewed plan is returned.
 * @param goal The user's high-level objective.
 * @param fileSystem The current state of the project files.
 * @returns A promise that resolves to a structured `OrchestrationPlan`.
 */
export async function runDeconstructionTask(goal: string, fileSystem: FileSystemState, customInstructions: string, modelName: string): Promise<OrchestrationPlan> {
    console.log("Orchestration started for goal:", goal);

    // Step 1: Call the planning agent (Gemini) to get a plan and code.
    const geminiResult = await generatePlanAndCode(goal, fileSystem, customInstructions, modelName);
    
    // Step 2: Call the reviewing agent (OpenAI mock) for feedback.
    const planString = geminiResult.steps.map((step, i) => `${i+1}. ${step}`).join('\n');
    const reviewInstruction = `Please review the following development plan for clarity and completeness. Plan:\n${planString}`;
    const review = await getOpenAiAgentResponse(reviewInstruction, "review");

    // Step 3: Combine results into the final document for the user.
    const finalPlan: OrchestrationPlan = {
        title: geminiResult.title,
        steps: geminiResult.steps.map(desc => ({ description: desc, status: 'pending' })),
        code: geminiResult.code,
        review: review, // Add the review from the second agent
    };

    console.log("Orchestration finished. Returning plan:", finalPlan);
    return finalPlan;
}