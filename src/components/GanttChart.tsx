import React, { useMemo, useState } from 'react';
import { format, parseISO, subDays, addDays, isSameDay, isToday } from 'date-fns';
import { Task, Member, Role, CalculatedTask } from '../types';
import { scheduleTasks, getDatesBetween, isWorkDay } from '../utils/dateUtils';
import { cn } from '../utils/cn';
import { ArrowDownAZ, CalendarDays } from 'lucide-react';

interface GanttChartProps {
  tasks: Task[];
  members: Member[];
  roles: Role[];
  holidays: string[];
  workWeekends: string[];
}

export const GanttChart: React.FC<GanttChartProps> = ({ tasks, members, roles, holidays, workWeekends }) => {
  const [sortBy, setSortBy] = useState<'date' | 'member'>('member');

  const calculatedTasks: CalculatedTask[] = useMemo(() => {
    // Use the new sequential scheduling algorithm
    const calcTasks = scheduleTasks(tasks, members, holidays, workWeekends);

    if (sortBy === 'date') {
      return calcTasks.sort((a, b) => new Date(a.actualStartDate).getTime() - new Date(b.actualStartDate).getTime());
    } else {
      return calcTasks.sort((a, b) => {
        const memberA = members.find(m => m.id === a.memberId)?.name || '';
        const memberB = members.find(m => m.id === b.memberId)?.name || '';
        if (memberA === memberB) {
          return new Date(a.actualStartDate).getTime() - new Date(b.actualStartDate).getTime();
        }
        return memberA.localeCompare(memberB);
      });
    }
  }, [tasks, sortBy, members, holidays, workWeekends]);

  const { minDate, maxDate, dates } = useMemo(() => {
    if (calculatedTasks.length === 0) {
      const today = new Date();
      return { minDate: subDays(today, 3), maxDate: addDays(today, 14), dates: getDatesBetween(subDays(today, 3), addDays(today, 14)) };
    }

    let min = new Date(calculatedTasks[0].actualStartDate);
    let max = new Date(calculatedTasks[0].endDate);

    calculatedTasks.forEach(task => {
      const start = new Date(task.actualStartDate);
      const end = new Date(task.endDate);
      if (start < min) min = start;
      if (end > max) max = end;
    });

    const paddedMin = subDays(min, 3);
    const paddedMax = addDays(max, 7);

    return { minDate: paddedMin, maxDate: paddedMax, dates: getDatesBetween(paddedMin, paddedMax) };
  }, [calculatedTasks]);

  const getMember = (id: string) => members.find(m => m.id === id);
  const getRole = (id: string) => roles.find(r => r.id === id);

  const CELL_WIDTH = 40; // px

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      {/* Scrollable Container */}
      <div className="overflow-auto flex-1 w-full relative custom-scrollbar">
        <div className="min-w-max pb-8">
          {/* Header */}
          <div className="flex border-b border-gray-200 bg-gray-50 sticky top-0 z-30">
            <div className="w-64 flex-shrink-0 border-r border-gray-200 p-3 sticky left-0 bg-gray-50 z-40 flex items-center justify-between shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
              <span className="text-sm font-semibold text-gray-700">任务信息</span>
              <div className="flex bg-gray-200/50 rounded-md p-0.5">
                <button
                  onClick={() => setSortBy('date')}
                  className={cn("p-1 rounded text-gray-500 hover:text-gray-700 transition-colors", sortBy === 'date' && "bg-white text-blue-600 shadow-sm")}
                  title="按时间排序"
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setSortBy('member')}
                  className={cn("p-1 rounded text-gray-500 hover:text-gray-700 transition-colors", sortBy === 'member' && "bg-white text-blue-600 shadow-sm")}
                  title="按人员排序"
                >
                  <ArrowDownAZ className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="flex relative">
              {dates.map((date, i) => {
                const isWeekendDay = !isWorkDay(date, holidays, workWeekends);
                const isCurrentDay = isToday(date);
                return (
                  <div
                    key={i}
                    className={cn(
                      "flex-shrink-0 text-center border-r border-gray-200 flex flex-col items-center justify-center py-2 bg-gray-50",
                      isWeekendDay ? "text-gray-400" : "text-gray-600",
                      isCurrentDay && "bg-blue-50"
                    )}
                    style={{ width: CELL_WIDTH }}
                  >
                    <span className="text-[10px] font-medium text-gray-500">{format(date, 'M')}月</span>
                    <span className={cn("text-sm font-medium", isCurrentDay && "text-blue-600")}>{format(date, 'dd')}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Body */}
          <div className="relative">
            {calculatedTasks.length === 0 ? (
              <div className="p-8 text-center text-gray-500 sticky left-0 w-full max-w-md mx-auto">暂无任务数据，请在左侧添加</div>
            ) : (
              calculatedTasks.map((task, index) => {
                const member = getMember(task.memberId);
                const role = member ? getRole(member.roleId) : null;
                
                const startIdx = dates.findIndex(d => format(d, 'yyyy-MM-dd') === task.actualStartDate);
                const endIdx = dates.findIndex(d => format(d, 'yyyy-MM-dd') === task.endDate);
                
                const left = startIdx >= 0 ? startIdx * CELL_WIDTH : 0;
                const width = startIdx >= 0 && endIdx >= 0 ? (endIdx - startIdx + 1) * CELL_WIDTH : 0;

                // Add a thicker top border if sorting by member and the member changes
                const prevTask = index > 0 ? calculatedTasks[index - 1] : null;
                const isNewMember = sortBy === 'member' && prevTask && prevTask.memberId !== task.memberId;

                return (
                  <div key={task.id} className={cn("flex border-b border-gray-100 hover:bg-gray-50 relative group", isNewMember && "border-t-2 border-t-gray-200")}>
                    {/* Left Panel */}
                    <div className="w-64 flex-shrink-0 border-r border-gray-200 p-3 sticky left-0 bg-white group-hover:bg-gray-50 z-20 flex flex-col justify-center shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] transition-colors">
                      <div className="text-sm font-medium text-gray-800 truncate" title={task.name}>{task.name}</div>
                      <div className="flex items-center mt-1 space-x-2">
                        <span className="text-xs text-gray-500 truncate">{member?.name || '未分配'}</span>
                        {role && (
                          <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full text-white", role.color)}>
                            {role.name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Timeline Grid */}
                    <div className="flex relative">
                      {dates.map((date, i) => {
                        const dateStr = format(date, 'yyyy-MM-dd');
                        const isGlobalWeekend = !isWorkDay(date, holidays, workWeekends);
                        const isMemberLeave = member?.leaveDays?.includes(dateStr);
                        
                        return (
                          <div
                            key={i}
                            className={cn(
                              "flex-shrink-0 border-r border-gray-100",
                              isGlobalWeekend ? "bg-gray-50/50" : "",
                              isToday(date) && "bg-blue-50/30",
                              isMemberLeave && !isGlobalWeekend && "bg-orange-50/50 relative overflow-hidden"
                            )}
                            style={{ width: CELL_WIDTH }}
                          >
                            {isMemberLeave && !isGlobalWeekend && (
                              <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(45deg,#000_25%,transparent_25%,transparent_50%,#000_50%,#000_75%,transparent_75%,transparent)] bg-[length:8px_8px]" />
                            )}
                          </div>
                        );
                      })}
                      
                      {/* Task Bar */}
                      {startIdx >= 0 && width > 0 && (
                        <div
                          className={cn(
                            "absolute top-2 bottom-2 rounded-md shadow-sm transition-all duration-200 hover:shadow-md hover:opacity-90 flex items-center px-2 overflow-hidden",
                            role?.color || "bg-blue-500"
                          )}
                          style={{
                            left: left + 2,
                            width: width - 4,
                          }}
                          title={`${task.name}\n${task.actualStartDate} ~ ${task.endDate}\n${task.durationHours}h`}
                        >
                          <span className="text-xs text-white font-medium truncate mix-blend-overlay">
                            {task.durationHours}h
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
