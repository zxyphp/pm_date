export interface Role {
  id: string;
  name: string;
  color: string;
}

export interface Member {
  id: string;
  name: string;
  roleId: string;
  leaveDays?: string[];
}

export interface Task {
  id: string;
  name: string;
  memberId: string;
  startDate: string; // YYYY-MM-DD
  durationHours: number;
}

export interface CalculatedTask extends Task {
  actualStartDate: string;
  endDate: string;
}
