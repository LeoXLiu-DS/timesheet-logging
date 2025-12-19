import React, { useState } from 'react';
import { Project, TimeEntry, Status } from '../types';
import { MOCK_PROJECTS } from '../constants';
import { enhanceDescription } from '../services/geminiService';
import { Loader2, Sparkles, Send } from 'lucide-react';

interface TimeEntryFormProps {
  tenantId: string;
  contractorId: string;
  contractorName: string;
  onSubmit: (entry: Omit<TimeEntry, 'id'>) => void;
  onCancel: () => void;
}

const TimeEntryForm: React.FC<TimeEntryFormProps> = ({ tenantId, contractorId, contractorName, onSubmit, onCancel }) => {
  const [projectId, setProjectId] = useState(MOCK_PROJECTS[0].id);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [hours, setHours] = useState<number | ''>(8);
  const [description, setDescription] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);

  const handleEnhance = async () => {
    if (!description.trim()) return;
    setIsEnhancing(true);
    const improved = await enhanceDescription(description);
    setDescription(improved);
    setIsEnhancing(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const project = MOCK_PROJECTS.find(p => p.id === projectId);
    if (!project || !hours) return;

    onSubmit({
      tenantId,
      contractorId,
      contractorName,
      projectId,
      projectName: project.name,
      date,
      hours: Number(hours),
      description,
      status: Status.SUBMITTED // Direct submit for demo flow, normally DRAFT
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-5">Log New Time</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Project</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
            >
              {MOCK_PROJECTS.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Hours Spent</label>
          <input
            type="number"
            min="0.1"
            step="0.1"
            max="24"
            value={hours}
            onChange={(e) => setHours(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-slate-700">Work Description</label>
            <button
              type="button"
              onClick={handleEnhance}
              disabled={isEnhancing || !description}
              className="text-xs flex items-center text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
            >
              {isEnhancing ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
              AI Polish
            </button>
          </div>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your tasks..."
            className="w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!hours || !description}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4 mr-2" />
            Submit Report
          </button>
        </div>
      </form>
    </div>
  );
};

export default TimeEntryForm;