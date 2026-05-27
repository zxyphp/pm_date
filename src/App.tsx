import React, { useState } from 'react';
import { GanttChart } from './components/GanttChart';
import { DataEntry } from './components/DataEntry';
import { ImportModal } from './components/ImportModal';
import { Role, Member, Task } from './types';
import { CalendarDays, Edit2, Upload, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { DEFAULT_HOLIDAYS, DEFAULT_WORK_WEEKENDS } from './utils/dateUtils';
import { cn } from './utils/cn';

const defaultRoles: Role[] = [
  { id: 'r1', name: '产品经理', color: 'bg-blue-500' },
  { id: 'r2', name: '前端开发', color: 'bg-green-500' },
  { id: 'r3', name: '后端开发', color: 'bg-purple-500' },
  { id: 'r4', name: 'UI设计', color: 'bg-pink-500' },
  { id: 'r5', name: '测试', color: 'bg-yellow-500' },
];

const defaultMembers: Member[] = [
  { id: 'm1', name: '张三', roleId: 'r1' },
  { id: 'm2', name: '李四', roleId: 'r4' },
  { id: 'm3', name: '王五', roleId: 'r2' },
  { id: 'm4', name: '赵六', roleId: 'r3' },
  { id: 'm5', name: '钱七', roleId: 'r5' },
];

const today = new Date().toISOString().split('T')[0];

const defaultTasks: Task[] = [
  { id: 't1', name: '需求分析', memberId: 'm1', startDate: today, durationHours: 16 },
  { id: 't2', name: 'UI设计', memberId: 'm2', startDate: today, durationHours: 24 },
  { id: 't3', name: '前端架构', memberId: 'm3', startDate: today, durationHours: 16 },
  { id: 't4', name: '后端接口', memberId: 'm4', startDate: today, durationHours: 32 },
  { id: 't5', name: '前端页面开发', memberId: 'm3', startDate: today, durationHours: 40 },
  { id: 't6', name: '联调测试', memberId: 'm5', startDate: today, durationHours: 24 },
];

export default function App() {
  const [roles, setRoles] = useState<Role[]>(defaultRoles);
  const [members, setMembers] = useState<Member[]>(defaultMembers);
  const [tasks, setTasks] = useState<Task[]>(defaultTasks);
  const [holidays, setHolidays] = useState<string[]>(DEFAULT_HOLIDAYS);
  const [workWeekends, setWorkWeekends] = useState<string[]>(DEFAULT_WORK_WEEKENDS);
  
  const [projectName, setProjectName] = useState('新项目排期');
  const [projectVersion, setProjectVersion] = useState('v1.0.0');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleImportData = (data: { tasks: Task[], members: Member[], roles: Role[] }) => {
    setRoles(data.roles);
    setMembers(data.members);
    setTasks(data.tasks);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center space-x-3 md:space-x-4">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            title={isSidebarOpen ? "隐藏左侧面板" : "展开左侧面板"}
          >
            {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
          </button>
          
          <div className="bg-blue-600 p-2 rounded-lg hidden sm:block">
            <CalendarDays className="w-5 h-5 text-white" />
          </div>
          
          {isEditingTitle ? (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="text-lg md:text-xl font-bold text-gray-800 border-b-2 border-blue-500 focus:outline-none bg-transparent px-1 w-32 md:w-48"
                placeholder="项目名称"
                autoFocus
              />
              <input
                type="text"
                value={projectVersion}
                onChange={(e) => setProjectVersion(e.target.value)}
                className="text-xs md:text-sm font-medium text-gray-500 border-b-2 border-blue-500 focus:outline-none bg-transparent px-1 w-16 md:w-24"
                placeholder="版本号"
              />
              <button 
                onClick={() => setIsEditingTitle(false)}
                className="ml-2 px-3 py-1 bg-blue-50 text-blue-600 rounded text-sm font-medium hover:bg-blue-100"
              >
                保存
              </button>
            </div>
          ) : (
            <div className="flex items-center group cursor-pointer" onClick={() => setIsEditingTitle(true)}>
              <h1 className="text-lg md:text-xl font-bold text-gray-800 tracking-tight truncate max-w-[150px] md:max-w-xs">{projectName}</h1>
              <span className="ml-2 md:ml-3 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs font-medium border border-gray-200">
                {projectVersion}
              </span>
              <Edit2 className="w-4 h-4 text-gray-400 ml-2 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block" />
            </div>
          )}
        </div>
        
        <div className="flex items-center">
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center space-x-2 px-3 md:px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">智能导入表格</span>
            <span className="sm:hidden">导入</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row gap-6 p-4 md:p-6 overflow-hidden">
        {/* Left Panel: Data Entry */}
        {isSidebarOpen && (
          <div className="w-full lg:w-1/3 xl:w-1/4 flex flex-col h-full min-h-[400px]">
            <DataEntry 
              tasks={tasks} setTasks={setTasks}
              members={members} setMembers={setMembers}
              roles={roles} setRoles={setRoles}
              holidays={holidays} setHolidays={setHolidays}
              workWeekends={workWeekends} setWorkWeekends={setWorkWeekends}
            />
          </div>
        )}

        {/* Right Panel: Gantt Chart */}
        <div className={cn("flex flex-col h-full min-h-[400px] transition-all duration-300", isSidebarOpen ? "w-full lg:w-2/3 xl:w-3/4" : "w-full")}>
          <GanttChart tasks={tasks} members={members} roles={roles} holidays={holidays} workWeekends={workWeekends} />
        </div>
      </main>
      
      <ImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        onImport={handleImportData} 
      />
    </div>
  );
}
