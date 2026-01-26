
/**
 * Quick action suggestions for the AI Assistant.
 * Each item has a label (shown on the button) and a prompt (text sent to the AI).
 */
export const QUICK_ACTIONS = [
//   { label: "Team status", prompt: "Team status" },
//   { label: "My time", prompt: "My time" },
//   { label: "Workspace", prompt: "Workspace" },
  { label: "Requirements", prompt: "Give me all the requirements for the project." },
  { label: "Tasks", prompt: "List down all my tasks for today." },
  { label: "Leaves", prompt: "Show the approved leave requests for this month." },
] as const;

export type QuickAction = typeof QUICK_ACTIONS[number];
