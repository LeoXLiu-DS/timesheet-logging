import React, { useState, useEffect, useMemo } from 'react';
import { TimeEntry, Project, Status, Task } from '../types';
import { MOCK_PROJECTS, MOCK_TASKS } from '../constants';
import { getWeekStart, getWeekDays, formatDateKey, formatDuration, parseDuration, isSameDay, getDayName, getDayNumberAndMonth } from '../utils/dateUtils';
import { ChevronLeft, ChevronRight, Play, Plus, Search, Sparkles, AlertCircle, Save, Send, CheckCircle, XCircle, MessageSquare, Pencil, RotateCcw, AlertTriangle } from 'lucide-react';
import { enhanceDescription } from '../services/geminiService';

interface WeeklyTimesheetProps {
  contractorId: string;
  contractorName: string;
  entries: TimeEntry[];
  onUpsertEntry?: (entry: Partial<TimeEntry>) => void;
  onSubmitWeek?: (entryIds: string[]) => void;
  readOnly?: boolean;
  initialDate?: Date;
  onApproveWeek?: (entryIds: string[], comment?: string) => void;
  onRejectWeek?: (entryIds: string[], reason: string) => void;
  onRevertDecision?: (entryIds: string[]) => void;
  onUpdateComment?: (entryIds: string[], comment: string) => void;
  onBack?: () => void;
}

interface GridRow {
  key: string; // Composite key: projectId + taskId
  projectId: string;
  taskId: string;
  description: string;
  entries: { [dateKey: string]: TimeEntry };
  isDraft: boolean; // True if this is a newly added row with no saved entries
}

const WeeklyTimesheet: React.FC<WeeklyTimesheetProps> = ({ 
  contractorId, 
  contractorName, 
  entries, 
  onUpsertEntry,
  onSubmitWeek,
  readOnly = false,
  initialDate,
  onApproveWeek,
  onRejectWeek,
  onRevertDecision,
  onUpdateComment,
  onBack
}) => {
  const [currentDate, setCurrentDate] = useState(initialDate || new Date());
  const [draftRows, setDraftRows] = useState<GridRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingAI, setLoadingAI] = useState<string | null>(null);
  
  // Rejection State for Pending
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  // Approval State for Pending
  const [approveComment, setApproveComment] = useState('');
  const [showApproveInput, setShowApproveInput] = useState(false);

  // Edit Existing Comment State
  const [isEditingComment, setIsEditingComment] = useState(false);
  const [editCommentValue, setEditCommentValue] = useState('');

  // Policy Validation State
  const [showPolicyWarning, setShowPolicyWarning] = useState(false);
  const [warningMessages, setWarningMessages] = useState<string[]>([]);
  const [pendingSubmitIds, setPendingSubmitIds] = useState<string[]>([]);

  // Sync internal date if initialDate changes (e.g. switching sheets in manager view)
  useEffect(() => {
    if (initialDate) {
      setCurrentDate(initialDate);
    }
  }, [initialDate]);

  const weekStart = useMemo(() => getWeekStart(currentDate), [currentDate]);
  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const today = new Date();

  // Group existing entries into rows by Project + Task
  const rows = useMemo(() => {
    const grouped: { [key: string]: GridRow } = {};
    
    // 1. Process existing entries for this week
    entries.forEach(entry => {
      const entryDate = new Date(entry.date);
      if (entryDate < weekStart || entryDate > weekDays[6]) return;

      const taskId = entry.taskId || 'unknown';
      const key = `${entry.projectId}||${taskId}`;
      
      if (!grouped[key]) {
        grouped[key] = {
          key,
          projectId: entry.projectId,
          taskId: taskId,
          description: entry.description,
          entries: {},
          isDraft: false
        };
      }
      grouped[key].entries[entry.date] = entry;
      
      if (!grouped[key].description && entry.description) {
        grouped[key].description = entry.description;
      }
    });

    // 2. Convert to array and combine with manual draft rows (only if not readOnly)
    const existingRows = Object.values(grouped);
    
    if (readOnly) {
      return existingRows;
    }

    const effectiveDrafts = draftRows.filter(draft => 
      !existingRows.some(r => r.projectId === draft.projectId && r.taskId === draft.taskId)
    );

    return [...existingRows, ...effectiveDrafts];
  }, [entries, weekStart, weekDays, draftRows, readOnly]);

  // Determine Sheet Status
  const allEntries = useMemo(() => rows.flatMap(r => Object.values(r.entries) as TimeEntry[]), [rows]);
  
  const sheetStatus = useMemo(() => {
    if (allEntries.length === 0) return 'EMPTY';
    if (allEntries.some(e => e.status === Status.REJECTED)) return 'REJECTED';
    if (allEntries.some(e => e.status === Status.SUBMITTED)) return 'PENDING';
    if (allEntries.length > 0 && allEntries.every(e => e.status === Status.APPROVED)) return 'APPROVED';
    return 'DRAFT';
  }, [allEntries]);

  // Look for existing comments/reasons to populate edit field
  const activeCommentOrReason = useMemo(() => {
    if (!readOnly) return '';
    const entry = allEntries.find(e => e.managerComment || e.rejectionReason);
    return entry?.rejectionReason || entry?.managerComment || '';
  }, [allEntries, readOnly]);

  // Filter rows by search
  const filteredRows = rows.filter(r => 
    r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    MOCK_PROJECTS.find(p => p.id === r.projectId)?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    MOCK_TASKS.find(t => t.id === r.taskId)?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePrevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };

  const handleNextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleAddLine = () => {
    if (readOnly) return;
    const defaultProject = MOCK_PROJECTS[0];
    const defaultTasks = MOCK_TASKS.filter(t => t.projectId === defaultProject.id);
    const defaultTask = defaultTasks.length > 0 ? defaultTasks[0] : { id: 't_new', name: 'General', projectId: defaultProject.id };

    const newRow: GridRow = {
      key: `draft-${Date.now()}`,
      projectId: defaultProject.id,
      taskId: defaultTask.id,
      description: '',
      entries: {},
      isDraft: true
    };
    setDraftRows([...draftRows, newRow]);
  };

  const handleTimeChange = (row: GridRow, date: Date, val: string) => {
    if (readOnly || !onUpsertEntry) return;
    const hours = parseDuration(val);
    const dateKey = formatDateKey(date);
    
    const existingEntry = row.entries[dateKey];
    if (hours === 0 && !existingEntry) return;

    onUpsertEntry({
      id: existingEntry?.id, 
      contractorId,
      contractorName,
      projectId: row.projectId,
      projectName: MOCK_PROJECTS.find(p => p.id === row.projectId)?.name || 'Unknown',
      taskId: row.taskId !== 'unknown' && !row.taskId.startsWith('t_new') ? row.taskId : undefined,
      taskName: MOCK_TASKS.find(t => t.id === row.taskId)?.name,
      description: row.description,
      date: dateKey,
      hours: hours,
      status: Status.DRAFT // Auto-revert to draft on edit
    });
  };

  const handleRowProjectChange = (row: GridRow, newProjectId: string) => {
    if (readOnly || !onUpsertEntry) return;
    const newTasks = MOCK_TASKS.filter(t => t.projectId === newProjectId);
    const newTaskId = newTasks.length > 0 ? newTasks[0].id : `t_new_${Date.now()}`;

    if (row.isDraft) {
      setDraftRows(prev => prev.map(r => r.key === row.key ? { ...r, projectId: newProjectId, taskId: newTaskId } : r));
    } else {
      Object.values(row.entries).forEach(entry => {
         onUpsertEntry({ 
           ...entry, 
           projectId: newProjectId, 
           projectName: MOCK_PROJECTS.find(p => p.id === newProjectId)?.name,
           taskId: newTaskId,
           taskName: MOCK_TASKS.find(t => t.id === newTaskId)?.name,
           status: Status.DRAFT // Auto-revert to draft on edit
         });
      });
    }
  };

  const handleRowTaskChange = (row: GridRow, newTaskId: string) => {
    if (readOnly || !onUpsertEntry) return;
    if (row.isDraft) {
      setDraftRows(prev => prev.map(r => r.key === row.key ? { ...r, taskId: newTaskId } : r));
    } else {
      Object.values(row.entries).forEach(entry => {
         onUpsertEntry({ 
           ...entry, 
           taskId: newTaskId,
           taskName: MOCK_TASKS.find(t => t.id === newTaskId)?.name,
           status: Status.DRAFT // Auto-revert to draft on edit
         });
      });
    }
  };

  const handleRowDescriptionChange = (row: GridRow, newDesc: string) => {
    if (readOnly || !onUpsertEntry) return;
    if (row.isDraft) {
      setDraftRows(prev => prev.map(r => r.key === row.key ? { ...r, description: newDesc } : r));
    } else {
      Object.values(row.entries).forEach(entry => {
        onUpsertEntry({ ...entry, description: newDesc, status: Status.DRAFT }); // Auto-revert to draft on edit
      });
    }
  };

  const handleAIEnhance = async (row: GridRow) => {
    if (readOnly || !row.description) return;
    setLoadingAI(row.key);
    const enhanced = await enhanceDescription(row.description);
    handleRowDescriptionChange(row, enhanced);
    setLoadingAI(null);
  };

  const confirmSubmit = () => {
    if (onSubmitWeek && pendingSubmitIds.length > 0) {
      onSubmitWeek(pendingSubmitIds);
      setShowPolicyWarning(false);
      setPendingSubmitIds([]);
    }
  };

  const handleSubmitWeek = () => {
    if (readOnly || !onSubmitWeek) return;
    const idsToSubmit = allEntries
      .filter(e => e.status === Status.DRAFT)
      .map(e => e.id);
    
    if (idsToSubmit.length === 0) {
      alert("No draft entries to submit for this week.");
      return;
    }

    // Policy Validation Logic
    const messages: string[] = [];
    
    // Check 1: Weekends (Sat=6, Sun=0)
    const hasWeekendHours = weekDays.some(day => {
       const d = day.getDay();
       const isWeekend = d === 0 || d === 6;
       if (!isWeekend) return false;
       const dateKey = formatDateKey(day);
       // Calculate total hours for this weekend day across all rows
       const dailyTotal = rows.reduce((sum, row) => sum + (row.entries[dateKey]?.hours || 0), 0);
       return dailyTotal > 0;
    });

    if (hasWeekendHours) {
      messages.push("You have logged hours on a weekend (Saturday or Sunday).");
    }

    // Check 2: > 8 Hours per day
    const hasOvertime = weekDays.some(day => {
       const dateKey = formatDateKey(day);
       const dailyTotal = rows.reduce((sum, row) => sum + (row.entries[dateKey]?.hours || 0), 0);
       return dailyTotal > 8;
    });

    if (hasOvertime) {
      messages.push("You have logged more than 8 hours in a single day.");
    }

    if (messages.length > 0) {
      setWarningMessages(messages);
      setPendingSubmitIds(idsToSubmit);
      setShowPolicyWarning(true);
    } else {
      onSubmitWeek(idsToSubmit);
    }
  };

  // Manager Actions
  const getAllIds = () => allEntries.map(e => e.id);
  
  const handleManagerApprove = () => {
    if (onApproveWeek) {
      onApproveWeek(getAllIds(), approveComment);
      setShowApproveInput(false);
      setApproveComment('');
    }
  };

  const handleManagerReject = () => {
    if (onRejectWeek && rejectReason) {
      onRejectWeek(getAllIds(), rejectReason);
      setShowRejectInput(false);
      setRejectReason('');
    }
  };

  const startEditingComment = () => {
    setEditCommentValue(activeCommentOrReason);
    setIsEditingComment(true);
  };

  const saveEditedComment = () => {
    if (onUpdateComment) {
      onUpdateComment(getAllIds(), editCommentValue);
    }
    setIsEditingComment(false);
  };

  const revertDecision = () => {
    if (onRevertDecision) {
      onRevertDecision(getAllIds());
    }
  };

  // Calculate totals
  const dayTotals = weekDays.map(day => {
    const dateKey = formatDateKey(day);
    return rows.reduce((sum, row) => sum + (row.entries[dateKey]?.hours || 0), 0);
  });
  const weekTotal = dayTotals.reduce((a, b) => a + b, 0);

  const hasDrafts = allEntries.some(e => e.status === Status.DRAFT);
  
  return (
    <div className="flex flex-col h-full bg-white relative">
      
      {/* Policy Warning Modal */}
      {showPolicyWarning && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 border border-slate-200">
             <div className="flex items-start mb-4">
                <div className="flex-shrink-0 bg-amber-100 rounded-full p-2 mr-3">
                   <AlertTriangle className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Policy Warning</h3>
                  <p className="text-sm text-slate-500 mt-1">Your timesheet triggers the following policy flags:</p>
                </div>
             </div>
             
             <ul className="list-disc list-inside text-sm text-slate-700 space-y-1 mb-6 pl-4 bg-slate-50 py-3 rounded-md">
                {warningMessages.map((msg, idx) => (
                  <li key={idx}>{msg}</li>
                ))}
             </ul>

             <div className="flex justify-end space-x-3">
               <button 
                 onClick={() => { setShowPolicyWarning(false); setPendingSubmitIds([]); }}
                 className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
               >
                 Cancel
               </button>
               <button 
                 onClick={confirmSubmit}
                 className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm"
               >
                 Confirm & Submit
               </button>
             </div>
          </div>
        </div>
      )}

      {/* Top Controls */}
      <div className="border-b border-slate-200 p-4 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            {readOnly && onBack && (
              <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full mr-2">
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
            )}
            <div className="flex flex-col">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-slate-800">
                  {readOnly ? `Timesheet: ${contractorName}` : 'My Timesheets'}
                </h1>
                
                {/* Status Badges for ReadOnly View */}
                {readOnly && sheetStatus === 'APPROVED' && (
                  <span className="ml-3 px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                    APPROVED
                  </span>
                )}
                {readOnly && sheetStatus === 'REJECTED' && (
                  <span className="ml-3 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                    REJECTED
                  </span>
                )}
              </div>

              {/* Comment Display & Edit Controls for Approved/Rejected Sheets */}
              {readOnly && (sheetStatus === 'APPROVED' || sheetStatus === 'REJECTED') && (
                <div className="mt-2 min-h-[24px]">
                  {isEditingComment ? (
                     <div className="flex items-center space-x-2 animate-in fade-in">
                       <input 
                         type="text" 
                         value={editCommentValue}
                         onChange={(e) => setEditCommentValue(e.target.value)}
                         className="text-sm border-slate-300 rounded px-2 py-1 w-64 focus:ring-2 focus:ring-indigo-500"
                         autoFocus
                       />
                       <button onClick={saveEditedComment} className="text-green-600 hover:text-green-800 text-xs font-medium px-2">Save</button>
                       <button onClick={() => setIsEditingComment(false)} className="text-slate-500 hover:text-slate-700 text-xs px-1">Cancel</button>
                     </div>
                  ) : (
                     <div className="flex items-center space-x-3">
                        <p className={`text-sm flex items-center ${sheetStatus === 'REJECTED' ? 'text-red-700' : 'text-green-700'}`}>
                           {sheetStatus === 'REJECTED' ? <AlertCircle className="w-3 h-3 mr-1" /> : <MessageSquare className="w-3 h-3 mr-1" />}
                           {activeCommentOrReason ? activeCommentOrReason : <span className="italic opacity-70">No comment provided</span>}
                        </p>
                        
                        {/* Edit Comment Button */}
                        <button 
                           onClick={startEditingComment}
                           className="text-slate-400 hover:text-indigo-600 transition-colors"
                           title="Edit Comment"
                        >
                           <Pencil className="w-3 h-3" />
                        </button>
                     </div>
                  )}
                </div>
              )}
            </div>

            {!readOnly && (
              <div className="relative hidden sm:block">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                   <Search className="h-4 w-4 text-slate-400" />
                 </div>
                 <input
                   type="text"
                   placeholder="Search..."
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="pl-10 pr-4 py-1.5 border border-slate-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 w-64"
                 />
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
             <div className="bg-slate-100 rounded-lg p-1 flex items-center">
                <button onClick={handleToday} className="px-3 py-1 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white shadow-sm rounded-md mr-2">Today</button>
                <button onClick={handlePrevWeek} className="p-1 hover:bg-slate-200 rounded-md"><ChevronLeft className="w-4 h-4 text-slate-600" /></button>
                <span className="px-3 text-sm font-medium text-slate-600">Week</span>
                <button onClick={handleNextWeek} className="p-1 hover:bg-slate-200 rounded-md"><ChevronRight className="w-4 h-4 text-slate-600" /></button>
             </div>
             
             {/* Action Buttons */}
             {!readOnly ? (
               <button 
                 onClick={handleSubmitWeek}
                 disabled={!hasDrafts}
                 className={`flex items-center space-x-2 px-4 py-2 rounded-md shadow-sm transition-colors ${hasDrafts ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
               >
                  <Send className="w-4 h-4" />
                  <span className="font-semibold text-sm">Submit</span>
               </button>
             ) : (
                <>
                  {/* Only show Approve/Reject controls if status is PENDING */}
                  {sheetStatus === 'PENDING' && (
                    <div className="flex items-center space-x-2">
                      {/* Reject Flow */}
                      {!showApproveInput && (
                        showRejectInput ? (
                          <div className="flex items-center space-x-1 animate-in slide-in-from-right">
                            <input 
                               type="text" 
                               value={rejectReason}
                               onChange={e => setRejectReason(e.target.value)}
                               placeholder="Reason..."
                               className="border border-slate-300 rounded px-2 py-1 text-sm w-32 focus:ring-2 focus:ring-red-500"
                            />
                            <button onClick={handleManagerReject} className="bg-red-600 text-white p-1 rounded hover:bg-red-700 text-xs">Confirm</button>
                            <button onClick={() => setShowRejectInput(false)} className="text-slate-500 p-1 hover:text-slate-700">
                               <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setShowRejectInput(true)}
                            className="flex items-center space-x-1 px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                            <span className="font-semibold text-sm">Reject</span>
                          </button>
                        )
                      )}
                      
                      {/* Approve Flow */}
                      {!showRejectInput && (
                        showApproveInput ? (
                          <div className="flex items-center space-x-1 animate-in slide-in-from-right">
                            <input 
                               type="text" 
                               value={approveComment}
                               onChange={e => setApproveComment(e.target.value)}
                               placeholder="Optional comment..."
                               className="border border-slate-300 rounded px-2 py-1 text-sm w-32 focus:ring-2 focus:ring-green-500"
                            />
                            <button onClick={handleManagerApprove} className="bg-green-600 text-white p-1 rounded hover:bg-green-700 text-xs">Confirm</button>
                            <button onClick={() => setShowApproveInput(false)} className="text-slate-500 p-1 hover:text-slate-700">
                               <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setShowApproveInput(true)}
                            className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 shadow-sm transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span className="font-semibold text-sm">Approve</span>
                          </button>
                        )
                      )}
                    </div>
                  )}

                  {/* Revert To Pending Action */}
                  {(sheetStatus === 'APPROVED' || sheetStatus === 'REJECTED') && (
                    <button 
                      type="button"
                      onClick={revertDecision}
                      className="cursor-pointer flex items-center space-x-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 border border-slate-300 transition-colors shadow-sm"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span className="font-semibold text-sm">Revert to Pending</span>
                    </button>
                  )}
                </>
             )}

             <div className="h-8 w-px bg-slate-300 mx-2"></div>
             <div className="text-right">
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Total</p>
                <p className="text-lg font-bold text-slate-800">{formatDuration(weekTotal)}</p>
             </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto">
        <table className="min-w-full divide-y divide-slate-200 border-separate border-spacing-0">
          <thead className="bg-slate-50 sticky top-0 z-10">
            <tr>
               <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-[20%] border-b border-slate-200 bg-slate-50">
                 Client
               </th>
               <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-[20%] border-b border-slate-200 bg-slate-50">
                 Project
               </th>
               <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-[20%] border-b border-slate-200 bg-slate-50">
                 Description
               </th>
               {weekDays.map((day, idx) => {
                 const isTodayCol = isSameDay(day, today);
                 return (
                   <th key={idx} className={`px-2 py-3 text-center text-xs font-medium uppercase tracking-wider w-20 border-b border-slate-200 ${isTodayCol ? 'bg-teal-50 text-teal-900 border-teal-100' : 'text-slate-500 bg-slate-50'}`}>
                     <div className="flex flex-col">
                       <span>{getDayName(day)}</span>
                       <span className="font-bold">{getDayNumberAndMonth(day)}</span>
                     </div>
                   </th>
                 );
               })}
               <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider w-20 border-b border-slate-200 bg-slate-100">
                 Total
               </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
             {filteredRows.map((row) => {
               // Lock row metadata (Project/Task/Desc) if ANY entry in row is approved (or manager mode)
               // This prevents changing the task of an approved line item.
               const hasApprovedEntries = (Object.values(row.entries) as TimeEntry[]).some(e => e.status === Status.APPROVED);
               const isRowLocked = readOnly || hasApprovedEntries;

               return (
               <tr key={row.key} className="group hover:bg-slate-50">
                 {/* Project Select (Now Client) */}
                 <td className="px-4 py-3 whitespace-nowrap border-r border-slate-100 align-top">
                      <select 
                        value={row.projectId}
                        disabled={isRowLocked}
                        onChange={(e) => handleRowProjectChange(row, e.target.value)}
                        className={`block w-full text-sm font-medium border-slate-200 rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${isRowLocked ? 'bg-transparent border-none appearance-none p-0 text-slate-700' : 'cursor-pointer'}`}
                      >
                         {MOCK_PROJECTS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                 </td>
                 
                 {/* Task Select (Now Project) */}
                 <td className="px-4 py-3 whitespace-nowrap border-r border-slate-100 align-top">
                      <select 
                        value={row.taskId}
                        disabled={isRowLocked}
                        onChange={(e) => handleRowTaskChange(row, e.target.value)}
                        className={`block w-full text-sm text-slate-700 border-slate-200 rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${isRowLocked ? 'bg-transparent border-none appearance-none p-0' : 'cursor-pointer'}`}
                      >
                         {MOCK_TASKS.filter(t => t.projectId === row.projectId).length > 0 ? (
                           MOCK_TASKS.filter(t => t.projectId === row.projectId).map(t => (
                             <option key={t.id} value={t.id}>{t.name}</option>
                           ))
                         ) : (
                           <option value={`t_new_${row.projectId}`}>General</option>
                         )}
                      </select>
                 </td>

                 {/* Description Input */}
                 <td className="px-4 py-3 border-r border-slate-100 align-top">
                    <div className="flex items-start">
                         <textarea 
                           rows={1}
                           readOnly={isRowLocked}
                           value={row.description}
                           onChange={(e) => handleRowDescriptionChange(row, e.target.value)}
                           placeholder={isRowLocked ? "" : "Details..."}
                           className="block w-full text-sm text-slate-600 border-none bg-transparent p-1 focus:ring-0 placeholder-slate-300 resize-none overflow-hidden"
                           style={{ minHeight: '38px' }}
                         />
                         {!isRowLocked && (
                           <button 
                              onClick={() => handleAIEnhance(row)}
                              className={`ml-1 mt-2 text-slate-400 hover:text-indigo-600 ${loadingAI === row.key ? 'animate-spin text-indigo-600' : 'opacity-0 group-hover:opacity-100'}`}
                              title="Enhance with AI"
                           >
                              <Sparkles className="w-3 h-3" />
                           </button>
                         )}
                    </div>
                 </td>

                 {/* Days */}
                 {weekDays.map((day, idx) => {
                   const dateKey = formatDateKey(day);
                   const entry = row.entries[dateKey] as TimeEntry | undefined;
                   const isTodayCol = isSameDay(day, today);
                   // Lock if APPROVED or if ReadOnly (Manager). Allow editing SUBMITTED/REJECTED.
                   const isLocked = readOnly || (entry && entry.status === Status.APPROVED);
                   
                   return (
                     <td key={idx} className={`p-0 border-b border-slate-100 align-top ${isTodayCol ? 'bg-teal-50/30' : ''}`}>
                       <input
                         type="text"
                         value={formatDuration(entry?.hours || 0)}
                         onChange={(e) => handleTimeChange(row, day, e.target.value)}
                         disabled={isLocked}
                         className={`w-full h-[50px] text-center bg-transparent border-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 text-sm ${entry?.hours ? 'font-medium text-slate-900' : 'text-slate-300'} ${isLocked ? 'cursor-default' : ''}`}
                         onFocus={(e) => !isLocked && e.target.select()}
                       />
                     </td>
                   );
                 })}
                 
                 {/* Row Total */}
                 <td className="px-4 py-3 text-center text-sm font-bold text-slate-700 bg-slate-50/50 border-l border-slate-100 align-middle">
                    {formatDuration((Object.values(row.entries) as TimeEntry[]).reduce((sum, e) => sum + e.hours, 0))}
                 </td>
               </tr>
               );
             })}
             
             {/* Add Line Row */}
             {!readOnly && (
               <tr>
                 <td colSpan={11} className="px-4 py-3">
                   <button 
                     onClick={handleAddLine}
                     className="flex items-center text-teal-700 hover:text-teal-900 font-medium text-sm transition-colors"
                   >
                     <Plus className="w-4 h-4 mr-1" />
                     Add a line
                   </button>
                 </td>
               </tr>
             )}

             {/* Footer Totals */}
             <tr className="bg-slate-100 font-semibold border-t-2 border-slate-300">
                <td colSpan={3} className="px-4 py-3 text-right text-sm text-slate-600">Total</td>
                {dayTotals.map((total, idx) => (
                   <td key={idx} className={`px-2 py-3 text-center text-sm text-slate-800 ${isSameDay(weekDays[idx], today) ? 'bg-teal-100' : ''}`}>
                     {formatDuration(total)}
                   </td>
                ))}
                <td className="px-4 py-3 text-center text-sm text-white bg-red-500">
                   {formatDuration(weekTotal)}
                </td>
             </tr>
          </tbody>
        </table>
      </div>
      
      {/* Bottom info */}
      {!readOnly && (
        <div className="p-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-400 text-center">
           Changes are saved locally as drafts. Click "Submit" in the header to send for approval.
        </div>
      )}
    </div>
  );
};

export default WeeklyTimesheet;