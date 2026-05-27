import React, { useState } from 'react';
import { Task, Member, Role } from '../types';
import { Plus, Trash2, X } from 'lucide-react';

interface DataEntryProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  roles: Role[];
  setRoles: React.Dispatch<React.SetStateAction<Role[]>>;
  holidays: string[];
  setHolidays: React.Dispatch<React.SetStateAction<string[]>>;
  workWeekends: string[];
  setWorkWeekends: React.Dispatch<React.SetStateAction<string[]>>;
}

export const DataEntry: React.FC<DataEntryProps> = ({
  tasks, setTasks, members, setMembers, roles, setRoles, holidays, setHolidays, workWeekends, setWorkWeekends
}) => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'members' | 'roles' | 'holidays'>('tasks');
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);

  const addTask = () => {
    const newTask: Task = {
      id: `t${Date.now()}`,
      name: '新任务',
      memberId: members[0]?.id || '',
      startDate: new Date().toISOString().split('T')[0],
      durationHours: 8,
    };
    setTasks([...tasks, newTask]);
  };

  const updateTask = (id: string, field: keyof Task, value: any) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const removeTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const addMember = () => {
    const newMember: Member = {
      id: `m${Date.now()}`,
      name: '新成员',
      roleId: roles[0]?.id || '',
    };
    setMembers([...members, newMember]);
  };

  const updateMember = (id: string, field: keyof Member, value: any) => {
    setMembers(members.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const addMemberLeave = (memberId: string, date: string) => {
    setMembers(members.map(m => {
      if (m.id === memberId) {
        const leaves = m.leaveDays || [];
        if (!leaves.includes(date)) {
          return { ...m, leaveDays: [...leaves, date].sort() };
        }
      }
      return m;
    }));
  };

  const removeMemberLeave = (memberId: string, date: string) => {
    setMembers(members.map(m => 
      m.id === memberId ? { ...m, leaveDays: (m.leaveDays || []).filter(d => d !== date) } : m
    ));
  };

  const removeMember = (id: string) => {
    setMembers(members.filter(m => m.id !== id));
    // Also remove assigned tasks for this member
    setTasks(tasks.filter(t => t.memberId !== id));
  };

  const addRole = () => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-yellow-500', 'bg-indigo-500', 'bg-red-500'];
    const newRole: Role = {
      id: `r${Date.now()}`,
      name: '新角色',
      color: colors[Math.floor(Math.random() * colors.length)],
    };
    setRoles([...roles, newRole]);
  };

  const updateRole = (id: string, field: keyof Role, value: any) => {
    setRoles(roles.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const removeRole = (id: string) => {
    setRoles(roles.filter(r => r.id !== id));
    // Also remove members with this role
    const membersToRemove = members.filter(m => m.roleId === id).map(m => m.id);
    setMembers(members.filter(m => m.roleId !== id));
    setTasks(tasks.filter(t => !membersToRemove.includes(t.memberId)));
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col h-full overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-gray-50 px-4 overflow-x-auto min-h-[46px] custom-scrollbar">
        <button
          className={`py-3 px-3 min-w-max text-sm font-medium border-b-2 transition-colors ${activeTab === 'tasks' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('tasks')}
        >
          任务排期
        </button>
        <button
          className={`py-3 px-3 min-w-max text-sm font-medium border-b-2 transition-colors ${activeTab === 'members' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('members')}
        >
          人员管理
        </button>
        <button
          className={`py-3 px-3 min-w-max text-sm font-medium border-b-2 transition-colors ${activeTab === 'roles' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('roles')}
        >
          角色配置
        </button>
        <button
          className={`py-3 px-3 min-w-max text-sm font-medium border-b-2 transition-colors ${activeTab === 'holidays' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('holidays')}
        >
          节假日
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-800">任务列表</h3>
              <button onClick={addTask} className="flex items-center space-x-1 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors">
                <Plus className="w-4 h-4" />
                <span>添加任务</span>
              </button>
            </div>
            
            <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
              <div className="col-span-4">任务名称</div>
              <div className="col-span-3">负责人</div>
              <div className="col-span-2">入场时间</div>
              <div className="col-span-2">工时(h)</div>
              <div className="col-span-1 text-right">操作</div>
            </div>
            
            {tasks.map(task => (
              <div key={task.id} className="grid grid-cols-12 gap-4 items-center bg-gray-50 p-2 rounded-md border border-gray-100 hover:border-gray-300 transition-colors">
                <div className="col-span-4">
                  <input
                    type="text"
                    value={task.name}
                    onChange={(e) => updateTask(task.id, 'name', e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="输入任务名称"
                  />
                </div>
                <div className="col-span-3">
                  <select
                    value={task.memberId}
                    onChange={(e) => updateTask(task.id, 'memberId', e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="" disabled>选择负责人</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <input
                    type="date"
                    value={task.startDate}
                    onChange={(e) => updateTask(task.id, 'startDate', e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={task.durationHours}
                    onChange={(e) => updateTask(task.id, 'durationHours', parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div className="col-span-1 flex justify-end">
                  <button onClick={() => removeTask(task.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {tasks.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">暂无任务，点击右上角添加</div>
            )}
          </div>
        )}

        {activeTab === 'members' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-800">人员列表</h3>
              <button onClick={addMember} className="flex items-center space-x-1 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors">
                <Plus className="w-4 h-4" />
                <span>添加人员</span>
              </button>
            </div>
            
            <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
              <div className="col-span-4">姓名</div>
              <div className="col-span-5">角色</div>
              <div className="col-span-3 text-right">操作</div>
            </div>
            
            {members.map(member => (
              <div key={member.id} className="flex flex-col bg-gray-50 rounded-md border border-gray-100 hover:border-gray-300 transition-colors pt-2 pb-2">
                <div className="grid grid-cols-12 gap-4 items-center px-2">
                  <div className="col-span-4">
                    <input
                      type="text"
                      value={member.name}
                      onChange={(e) => updateMember(member.id, 'name', e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      placeholder="输入姓名"
                    />
                  </div>
                  <div className="col-span-5">
                    <select
                      value={member.roleId}
                      onChange={(e) => updateMember(member.id, 'roleId', e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      <option value="" disabled>选择角色</option>
                      {roles.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-3 flex justify-end space-x-1">
                    <button 
                      onClick={() => setExpandedMemberId(expandedMemberId === member.id ? null : member.id)}
                      className={`px-2 py-1.5 text-xs rounded transition-colors ${expandedMemberId === member.id ? 'bg-orange-100 text-orange-700' : 'text-orange-600 hover:bg-orange-50'}`}
                    >
                      请假排期
                    </button>
                    <button onClick={() => removeMember(member.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {expandedMemberId === member.id && (
                  <div className="mt-3 mx-2 px-3 py-3 border-t border-gray-200 bg-white rounded flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-semibold text-gray-700">请假 / 不可用日期</h4>
                    </div>
                    <div className="flex space-x-2">
                      <input 
                        type="date"
                        id={`newLeaveInput-${member.id}`}
                        className="bg-white border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.getElementById(`newLeaveInput-${member.id}`) as HTMLInputElement;
                          if (input.value) {
                            addMemberLeave(member.id, input.value);
                            input.value = '';
                          }
                        }}
                        className="bg-orange-50 text-orange-600 px-3 py-1 rounded text-xs font-medium hover:bg-orange-100 transition-colors"
                      >
                        标记请假
                      </button>
                    </div>
                    {member.leaveDays && member.leaveDays.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {member.leaveDays.map(date => (
                          <div key={date} className="bg-orange-50/80 rounded px-2 py-0.5 flex items-center text-xs space-x-1 border border-orange-100">
                            <span className="text-orange-700 font-mono">{date}</span>
                            <button onClick={() => removeMemberLeave(member.id, date)} className="text-orange-400 hover:text-red-500">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400">该人员暂无请假记录</div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {members.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">暂无人员，点击右上角添加</div>
            )}
          </div>
        )}

        {activeTab === 'roles' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-800">角色配置</h3>
              <button onClick={addRole} className="flex items-center space-x-1 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors">
                <Plus className="w-4 h-4" />
                <span>添加角色</span>
              </button>
            </div>
            
            <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
              <div className="col-span-5">角色名称</div>
              <div className="col-span-6">颜色标识</div>
              <div className="col-span-1 text-right">操作</div>
            </div>
            
            {roles.map(role => (
              <div key={role.id} className="grid grid-cols-12 gap-4 items-center bg-gray-50 p-2 rounded-md border border-gray-100 hover:border-gray-300 transition-colors">
                <div className="col-span-5">
                  <input
                    type="text"
                    value={role.name}
                    onChange={(e) => updateRole(role.id, 'name', e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="输入角色名称"
                  />
                </div>
                <div className="col-span-6 flex items-center space-x-2">
                  <select
                    value={role.color}
                    onChange={(e) => updateRole(role.id, 'color', e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="bg-blue-500">蓝色</option>
                    <option value="bg-green-500">绿色</option>
                    <option value="bg-purple-500">紫色</option>
                    <option value="bg-pink-500">粉色</option>
                    <option value="bg-yellow-500">黄色</option>
                    <option value="bg-indigo-500">靛蓝</option>
                    <option value="bg-red-500">红色</option>
                    <option value="bg-teal-500">青色</option>
                    <option value="bg-orange-500">橙色</option>
                  </select>
                  <div className={`w-6 h-6 rounded-full flex-shrink-0 ${role.color}`}></div>
                </div>
                <div className="col-span-1 flex justify-end">
                  <button onClick={() => removeRole(role.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {roles.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">暂无角色，点击右上角添加</div>
            )}
          </div>
        )}

        {activeTab === 'holidays' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-800">节假日配置</h3>
            </div>

            {/* Holidays List */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-medium text-gray-700">法定休假日 (不上班)</h4>
              </div>
              <div className="flex space-x-2 mb-3">
                <input 
                  type="date"
                  id="newHolidayInput"
                  className="bg-white border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 flex-1"
                />
                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById('newHolidayInput') as HTMLInputElement;
                    if (input.value && !holidays.includes(input.value)) {
                      setHolidays([...holidays, input.value].sort());
                      input.value = '';
                    }
                  }}
                  className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors"
                >
                  添加休息日
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {holidays.map(h => (
                  <div key={h} className="bg-gray-100 rounded-md px-3 py-1 flex items-center text-sm space-x-2">
                    <span className="text-gray-700 font-mono">{h}</span>
                    <button onClick={() => setHolidays(holidays.filter(item => item !== h))} className="text-gray-400 hover:text-red-500">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Work Weekends List */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-medium text-gray-700">调休工作日 (周末上班)</h4>
              </div>
              <div className="flex space-x-2 mb-3">
                <input 
                  type="date"
                  id="newWorkWeekendInput"
                  className="bg-white border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 flex-1"
                />
                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById('newWorkWeekendInput') as HTMLInputElement;
                    if (input.value && !workWeekends.includes(input.value)) {
                      setWorkWeekends([...workWeekends, input.value].sort());
                      input.value = '';
                    }
                  }}
                  className="bg-orange-50 text-orange-600 px-4 py-1.5 rounded-md text-sm font-medium hover:bg-orange-100 transition-colors"
                >
                  添加调休日
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {workWeekends.map(ww => (
                  <div key={ww} className="bg-orange-50/80 rounded-md px-3 py-1 flex items-center text-sm space-x-2">
                    <span className="text-orange-700 font-mono">{ww}</span>
                    <button onClick={() => setWorkWeekends(workWeekends.filter(item => item !== ww))} className="text-orange-400 hover:text-red-500">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
