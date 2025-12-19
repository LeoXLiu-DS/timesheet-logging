import React, { useMemo } from 'react';
import { TimeEntry, Status } from '../types';
import { getWeekStart, formatDateKey, formatDuration } from '../utils/dateUtils';
import { ChevronRight, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface ManagerTimesheetListProps {
  entries: TimeEntry[];
  onSelectSheet: (contractorId: string, weekStart: Date) => void;
}

interface TimesheetSummary {
  id: string; // composite key
  contractorId: string;
  contractorName: string;
  weekStart: Date;
  totalHours: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  entryCount: number;
}

const ManagerTimesheetList: React.FC<ManagerTimesheetListProps> = ({ entries, onSelectSheet }) => {
  
  const sheets = useMemo(() => {
    const grouped: { [key: string]: TimesheetSummary } = {};

    entries.forEach(entry => {
      // Ignore Drafts for managers
      if (entry.status === Status.DRAFT) return;

      const date = new Date(entry.date);
      const weekStart = getWeekStart(date);
      const key = `${entry.contractorId}-${formatDateKey(weekStart)}`;

      if (!grouped[key]) {
        grouped[key] = {
          id: key,
          contractorId: entry.contractorId,
          contractorName: entry.contractorName,
          weekStart: weekStart,
          totalHours: 0,
          status: 'APPROVED', // Default, will downgrade if any pending/rejected
          entryCount: 0
        };
      }

      grouped[key].totalHours += entry.hours;
      grouped[key].entryCount += 1;

      // Status Precedence: REJECTED > PENDING (Submitted) > APPROVED
      // However, usually "Pending" takes precedence for action. 
      // Let's say: If any Submitted -> PENDING. Else if any Rejected -> REJECTED. Else Approved.
      if (entry.status === Status.SUBMITTED) {
        grouped[key].status = 'PENDING';
      } else if (entry.status === Status.REJECTED && grouped[key].status !== 'PENDING') {
        grouped[key].status = 'REJECTED';
      }
    });

    return Object.values(grouped).sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime());
  }, [entries]);

  const pendingSheets = sheets.filter(s => s.status === 'PENDING');
  const approvedSheets = sheets.filter(s => s.status === 'APPROVED');
  const rejectedSheets = sheets.filter(s => s.status === 'REJECTED');

  const Section = ({ title, items, icon: Icon, colorClass }: any) => (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
        <Icon className={`w-5 h-5 mr-2 ${colorClass}`} />
        {title} <span className="ml-2 text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{items.length}</span>
      </h3>
      {items.length === 0 ? (
        <div className="text-sm text-slate-400 italic pl-7">No timesheets in this category.</div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100 shadow-sm">
          {items.map((sheet: TimesheetSummary) => (
            <div 
              key={sheet.id} 
              onClick={() => onSelectSheet(sheet.contractorId, sheet.weekStart)}
              className="p-4 hover:bg-slate-50 cursor-pointer flex items-center justify-between group transition-colors"
            >
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold mr-4">
                  {sheet.contractorName.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{sheet.contractorName}</p>
                  <p className="text-xs text-slate-500">
                    Week of {sheet.weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                 <div className="text-right">
                    <p className="text-sm font-bold text-slate-700">{formatDuration(sheet.totalHours)} hrs</p>
                    <p className="text-xs text-slate-400">{sheet.entryCount} entries</p>
                 </div>
                 <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Manager Overview</h1>
      
      <Section 
        title="Pending Approval" 
        items={pendingSheets} 
        icon={AlertCircle} 
        colorClass="text-amber-500" 
      />
      
      <Section 
        title="Approved" 
        items={approvedSheets} 
        icon={CheckCircle} 
        colorClass="text-green-500" 
      />

      <Section 
        title="Rejected" 
        items={rejectedSheets} 
        icon={XCircle} 
        colorClass="text-red-500" 
      />
    </div>
  );
};

export default ManagerTimesheetList;