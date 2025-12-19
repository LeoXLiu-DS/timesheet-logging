import React, { useState } from 'react';
import { TimeEntry, Status } from '../types';
import { CheckCircle, Clock } from 'lucide-react';

interface ApprovalQueueProps {
  entries: TimeEntry[];
  onUpdateStatus: (id: string, status: Status, reason?: string) => void;
  currentManagerId: string;
}

const ApprovalQueue: React.FC<ApprovalQueueProps> = ({ entries, onUpdateStatus, currentManagerId }) => {
  const submittedEntries = entries.filter(e => e.status === Status.SUBMITTED);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const handleApprove = async (entry: TimeEntry) => {
    setProcessingId(entry.id);
    // Simulate network delay for UX
    await new Promise(resolve => setTimeout(resolve, 500));
    onUpdateStatus(entry.id, Status.APPROVED);
    setProcessingId(null);
  };

  const confirmReject = () => {
    if (rejectingId && rejectReason) {
      onUpdateStatus(rejectingId, Status.REJECTED, rejectReason);
      setRejectingId(null);
      setRejectReason('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Pending Approvals</h2>
        <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
          {submittedEntries.length} Pending
        </span>
      </div>

      {submittedEntries.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center border border-slate-200 border-dashed">
          <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
          <h3 className="mt-2 text-sm font-medium text-slate-900">All caught up!</h3>
          <p className="mt-1 text-sm text-slate-500">No time reports waiting for review.</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md border border-slate-200">
          <ul className="divide-y divide-slate-200">
            {submittedEntries.map((entry) => (
              <li key={entry.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                          {entry.contractorName.charAt(0)}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-indigo-600 truncate">{entry.contractorName}</div>
                        <div className="flex items-center text-sm text-slate-500">
                          <Clock className="flex-shrink-0 mr-1.5 h-4 w-4 text-slate-400" />
                          <p>{entry.hours} hours on <span className="font-semibold text-slate-700">{entry.projectName}</span></p>
                        </div>
                      </div>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex space-x-2">
                       {rejectingId === entry.id ? (
                         <div className="flex items-center space-x-2 animate-in fade-in slide-in-from-right-4 duration-300">
                           <input 
                              type="text" 
                              placeholder="Reason for rejection..."
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              className="text-sm border-red-300 focus:ring-red-500 focus:border-red-500 rounded-md border p-1 w-48"
                              autoFocus
                           />
                           <button 
                              onClick={confirmReject}
                              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                           >Confirm</button>
                           <button 
                              onClick={() => { setRejectingId(null); setRejectReason(''); }}
                              className="text-slate-500 hover:text-slate-700 text-sm"
                           >Cancel</button>
                         </div>
                       ) : (
                         <>
                           <button
                            onClick={() => handleApprove(entry)}
                            disabled={!!processingId}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                          >
                            {processingId === entry.id ? 'Approving...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => setRejectingId(entry.id)}
                            disabled={!!processingId}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                          >
                            Reject
                          </button>
                         </>
                       )}
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-slate-500">
                        {entry.description}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-slate-500 sm:mt-0">
                      <p>
                        Submitted on <time dateTime={entry.date}>{entry.date}</time>
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ApprovalQueue;