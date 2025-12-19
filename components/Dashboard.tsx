import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TimeEntry, Status } from '../types';

interface DashboardProps {
  entries: TimeEntry[];
}

const Dashboard: React.FC<DashboardProps> = ({ entries }) => {
  // Aggregate hours by project
  const projectData = entries.reduce((acc, entry) => {
    const existing = acc.find(p => p.name === entry.projectName);
    if (existing) {
      existing.hours += entry.hours;
    } else {
      acc.push({ name: entry.projectName, hours: entry.hours });
    }
    return acc;
  }, [] as { name: string; hours: number }[]);

  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
  const pendingHours = entries.filter(e => e.status === Status.SUBMITTED).reduce((sum, e) => sum + e.hours, 0);

  const COLORS = ['#6366f1', '#8b5cf6', '#d946ef', '#06b6d4'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Stats Cards */}
      <div className="lg:col-span-1 grid grid-cols-2 lg:grid-cols-1 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500">Total Hours Logged</p>
          <p className="text-3xl font-bold text-indigo-600 mt-2">{totalHours.toFixed(1)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500">Pending Approval</p>
          <p className="text-3xl font-bold text-amber-500 mt-2">{pendingHours.toFixed(1)}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Hours by Project</h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={projectData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} />
              <YAxis />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                {projectData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;