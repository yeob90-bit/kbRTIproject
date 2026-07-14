export interface ToolResultEvent {
  toolName: string;
  input: unknown;
  output: unknown;
  updatedConditions?: Record<string, unknown>;
  tableSettings?: {
    startMonthlyRent: number;
    endMonthlyRent: number;
    rentStep: number;
  };
}
