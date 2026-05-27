import React, { useState } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import { Task, Member, Role } from '../types';
import { GoogleGenAI, Type } from '@google/genai';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: { tasks: Task[], members: Member[], roles: Role[] }) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleImport = async () => {
    if (!text.trim()) {
      setError('请输入或粘贴表格数据');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      
      const prompt = `
You are a helpful assistant that parses project management spreadsheet data (copied from Excel/Sheets) into structured JSON.
The user will provide tab-separated or comma-separated values.
The table usually contains a "Requirement" (需求) column, and multiple role-specific columns (like iOS, Android, Backend, Frontend, Testing) which are further divided into "Owner" (负责人) and "Hours" (工时).
For each row (requirement), extract the tasks for each role.
Task name should be: "[Requirement Name] - [Role Name]".
If a cell contains multiple owners or math (e.g. "32+8"), sum the hours or just take the first owner, do your best to extract a single owner name and a total number of hours.
Default start date for all tasks should be today: ${new Date().toISOString().split('T')[0]}.
Assign random Tailwind colors to roles (e.g., bg-blue-500, bg-green-500, bg-purple-500, bg-pink-500, bg-yellow-500, bg-indigo-500, bg-red-500, bg-teal-500, bg-orange-500).

Return ONLY valid JSON matching this schema:
{
  "roles": [{ "id": "string", "name": "string", "color": "string" }],
  "members": [{ "id": "string", "name": "string", "roleId": "string" }],
  "tasks": [{ "id": "string", "name": "string", "memberId": "string", "startDate": "string", "durationHours": number }]
}

Data to parse:
${text}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              roles: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    color: { type: Type.STRING }
                  },
                  required: ["id", "name", "color"]
                }
              },
              members: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    roleId: { type: Type.STRING }
                  },
                  required: ["id", "name", "roleId"]
                }
              },
              tasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    memberId: { type: Type.STRING },
                    startDate: { type: Type.STRING },
                    durationHours: { type: Type.NUMBER }
                  },
                  required: ["id", "name", "memberId", "startDate", "durationHours"]
                }
              }
            },
            required: ["roles", "members", "tasks"]
          }
        }
      });

      const jsonStr = response.text || '{}';
      const data = JSON.parse(jsonStr);
      
      if (data.tasks && data.members && data.roles) {
        onImport(data);
        onClose();
        setText('');
      } else {
        throw new Error('解析结果格式不正确');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || '解析失败，请检查数据格式或重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
            <Upload className="w-5 h-5 mr-2 text-blue-500" />
            智能导入表格数据
          </h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
          <p className="text-sm text-gray-500 mb-3">
            请从 Excel 或网页表格中复制内容，并粘贴到下方文本框中。AI 将自动识别需求、人员、角色及工时。
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-64 p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm font-mono resize-none"
            placeholder="例如：&#10;需求名称&#9;前端负责人&#9;前端工时&#9;后端负责人&#9;后端工时&#10;登录功能&#9;张三&#9;16&#9;李四&#9;24"
          />
          {error && (
            <div className="mt-3 p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">
              {error}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-100 flex justify-end space-x-3 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-200/50 rounded-lg transition-colors"
            disabled={loading}
          >
            取消
          </button>
          <button
            onClick={handleImport}
            disabled={loading || !text.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                正在解析...
              </>
            ) : (
              '开始解析'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
