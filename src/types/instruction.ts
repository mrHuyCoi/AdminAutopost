export interface Instruction {
  key: string;
  value: string;
}

export interface InstructionsUpdate {
  instructions: Instruction[];
}