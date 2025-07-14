export type Role = "Inventory Planner" | "Replenisher" | "Sales" | "Warehouse Operator";

export interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export interface ChatSession {
    sessionId: string;
    role: Role;
    messages: Message[];
    timestamp: number;
}