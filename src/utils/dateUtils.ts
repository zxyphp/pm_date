import { addDays, isWeekend, format, parseISO, differenceInDays } from 'date-fns';
import { Task, CalculatedTask } from '../types';

export const DEFAULT_HOLIDAYS = [
  '2026-01-01', // New Year
  '2026-02-16', // Spring Festival
  '2026-02-17',
  '2026-02-18',
  '2026-04-04', // Tomb Sweeping
  '2026-05-01', // Labor Day
  '2026-06-19', // Dragon Boat
  '2026-09-25', // Mid-Autumn
  '2026-10-01', // National Day
  '2026-10-02',
  '2026-10-03',
];

export const DEFAULT_WORK_WEEKENDS = [
  '2026-02-14',
  '2026-02-15',
  '2026-05-09',
  '2026-10-10',
];

export function isWorkDay(date: Date | string, holidays: string[], workWeekends: string[]) {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if(isNaN(d.getTime())) return true;
  const dateStr = format(d, 'yyyy-MM-dd');
  
  if (workWeekends.includes(dateStr)) return true;
  if (holidays.includes(dateStr)) return false;
  if (isWeekend(d)) return false;
  
  return true;
}

export function isMemberAvailable(date: Date | string, memberId: string, members: Member[], holidays: string[], workWeekends: string[]) {
  const isGlobalWorkDay = isWorkDay(date, holidays, workWeekends);
  if (!isGlobalWorkDay) return false;
  
  const d = typeof date === 'string' ? parseISO(date) : date;
  if(isNaN(d.getTime())) return true;
  const dateStr = format(d, 'yyyy-MM-dd');

  const member = members.find(m => m.id === memberId);
  if (member && member.leaveDays && member.leaveDays.includes(dateStr)) {
    return false;
  }
  
  return true;
}

export function calculateTaskDates(startDateStr: string, durationHours: number, holidays: string[], workWeekends: string[]) {
  if (!startDateStr) return { actualStartDate: '', endDate: '' };
  
  let currentDate = parseISO(startDateStr);
  let remainingHours = durationHours > 0 ? durationHours : 8; // Default to 1 day if 0
  
  // Find the actual start date (skip non-work days)
  while (!isWorkDay(currentDate, holidays, workWeekends)) {
    currentDate = addDays(currentDate, 1);
  }
  
  const actualStartDate = format(currentDate, 'yyyy-MM-dd');

  remainingHours -= 8;

  while (remainingHours > 0) {
    currentDate = addDays(currentDate, 1);
    if (isWorkDay(currentDate, holidays, workWeekends)) {
      remainingHours -= 8;
    }
  }
  
  return { actualStartDate, endDate: format(currentDate, 'yyyy-MM-dd') };
}

export function scheduleTasks(tasks: Task[], members: Member[], holidays: string[], workWeekends: string[]): CalculatedTask[] {
  const memberTasks = new Map<string, Task[]>();
  
  tasks.forEach(task => {
    if (!memberTasks.has(task.memberId)) {
      memberTasks.set(task.memberId, []);
    }
    memberTasks.get(task.memberId)!.push(task);
  });

  const calculatedTasks: CalculatedTask[] = [];

  memberTasks.forEach((memberTaskList) => {
    // Sort tasks by startDate
    memberTaskList.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    let currentDate: Date | null = null;
    let hoursUsedOnCurrentDate = 0;

    memberTaskList.forEach(task => {
      let taskStart = parseISO(task.startDate);
      
      // Find the first valid work day for taskStart
      while (!isMemberAvailable(taskStart, task.memberId, members, holidays, workWeekends)) {
        taskStart = addDays(taskStart, 1);
      }

      if (!currentDate || taskStart > currentDate) {
        currentDate = taskStart;
        hoursUsedOnCurrentDate = 0;
      }

      // Ensure currentDate is a work day and has available hours
      while (true) {
        if (!isMemberAvailable(currentDate!, task.memberId, members, holidays, workWeekends)) {
          currentDate = addDays(currentDate!, 1);
          hoursUsedOnCurrentDate = 0;
        } else if (hoursUsedOnCurrentDate >= 8) {
          currentDate = addDays(currentDate!, 1);
          hoursUsedOnCurrentDate = 0;
        } else {
          break;
        }
      }

      const actualStartDate = format(currentDate!, 'yyyy-MM-dd');
      let remainingHours = task.durationHours > 0 ? task.durationHours : 8;

      while (remainingHours > 0) {
        const availableHours = 8 - hoursUsedOnCurrentDate;
        if (remainingHours <= availableHours) {
          hoursUsedOnCurrentDate += remainingHours;
          remainingHours = 0;
        } else {
          remainingHours -= availableHours;
          // Move to next work day
          do {
            currentDate = addDays(currentDate!, 1);
          } while (!isMemberAvailable(currentDate!, task.memberId, members, holidays, workWeekends));
          hoursUsedOnCurrentDate = 0;
        }
      }

      calculatedTasks.push({
        ...task,
        actualStartDate,
        endDate: format(currentDate!, 'yyyy-MM-dd')
      });
    });
  });

  return calculatedTasks;
}

export function getDatesBetween(startDate: Date, endDate: Date) {
  const dates = [];
  let currentDate = startDate;
  const diff = differenceInDays(endDate, startDate);
  
  for (let i = 0; i <= diff; i++) {
    dates.push(addDays(currentDate, i));
  }
  return dates;
}
