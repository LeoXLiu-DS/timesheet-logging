import React, { useState, useMemo } from 'react';
import { TimeEntry, Status } from '../types';
import { Download, Calendar, FileSpreadsheet, FileText } from 'lucide-react';
import { formatDuration } from '../utils/dateUtils';

interface ManagerExportProps {
  entries: TimeEntry[];
}

const ManagerExport: React.FC<ManagerExportProps> = ({ entries }) => {
  // Default to first day of current month and today
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split('T')[0];
  });
  
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const filteredEntries = useMemo(() => {
    const start = new Date(startDate);
    // Reset time for start date
    start.setHours(0,0,0,0);
    
    const end = new Date(endDate);
    // Set end date to end of day
    end.setHours(23,59,59,999);

    return entries.filter(e => {
      const entryDate = new Date(e.date);
      return (
        e.status === Status.APPROVED &&
        entryDate >= start &&
        entryDate <= end
      );
    });
  }, [entries, startDate, endDate]);

  const totalHours = filteredEntries.reduce((sum, e) => sum + e.hours, 0);

  const downloadFile = (format: 'csv' | 'xlsx') => {
    // Note: MOCK_PROJECTS mapped to 'Clients' and MOCK_TASKS mapped to 'Projects' in current context
    // Per requirements: Client, Project, Description, Date, Hours, Employee
    
    // Header Row
    const headers = ['Client', 'Project', 'Description', 'Date', 'Hours', 'Employee'];
    
    // Data Rows
    const rows = filteredEntries.map(e => [
      `"${e.projectName.replace(/"/g, '""')}"`, // Client
      `"${(e.taskName || '').replace(/"/g, '""')}"`, // Project
      `"${e.description.replace(/"/g, '""')}"`, // Description
      e.date,
      e.hours.toFixed(2),
      `"${e.contractorName.replace(/"/g, '""')}"` // Employee
    ]);

    // Construct CSV String
    const csvContent = [
        headers.join(','),
        ...rows.map(r => r.join(','))
    ].join('\r\n');

    // Create Blob
    // For "fake" XLSX compatibility (opening in Excel cleanly), we use a standard CSV with BOM
    // Standard CSV is text/csv
    const blobType = format === 'csv' ? 'text/csv;charset=utf-8;' : 'application/vnd.ms-excel;charset=utf-8;';
    const bom = '\uFEFF'; // Byte Order Mark for Excel utf-8 compatibility
    const blob = new Blob([bom + csvContent], { type: blobType });
    
    // Trigger Download
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const extension = format;
    
    link.setAttribute('href', url);
    link.setAttribute('download', `timesheet_export_${startDate}_to_${endDate}.${extension}`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Export Approved Timesheets</h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
          
          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pl-10 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">End Date</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="pl-10 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border"
              />
            </div>
          </div>

          {/* Summary Stat */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-col justify-center">
             <span className="text-xs font-medium text-slate-500 uppercase">Records to Export</span>
             <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-bold text-indigo-600">{filteredEntries.length}</span>
                <span className="text-sm text-slate-600">entries ({formatDuration(totalHours)} hrs)</span>
             </div>
          </div>
        </div>
      </div>

      {/* Preview Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-slate-700">Preview ({filteredEntries.length} rows)</h3>
        </div>
        
        {filteredEntries.length === 0 ? (
          <div className="p-12 text-center text-slate-500 italic">
            No approved records found for the selected date range.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-96">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Project</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Employee</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredEntries.map(entry => (
                  <tr key={entry.id} className="hover:bg-slate-50">
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-slate-900">{entry.projectName}</td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-slate-600">{entry.taskName}</td>
                    <td className="px-6 py-2 text-sm text-slate-500 max-w-xs truncate">{entry.description}</td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-slate-600">{entry.date}</td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-slate-900 font-mono">{entry.hours.toFixed(2)}</td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-slate-600">{entry.contractorName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => downloadFile('csv')}
          disabled={filteredEntries.length === 0}
          className="flex items-center justify-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileText className="mr-2 h-4 w-4 text-slate-500" />
          Download .csv
        </button>
        <button
          onClick={() => downloadFile('xlsx')}
          disabled={filteredEntries.length === 0}
          className="flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Download .xlsx (Compatible)
        </button>
      </div>
    </div>
  );
};

export default ManagerExport;