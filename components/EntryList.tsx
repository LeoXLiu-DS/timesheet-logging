import React from 'react';
import { TimeEntry, Status, Role } from '../types';
import { AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';

interface EntryListProps {
  entries: TimeEntry[];
  role: Role;
}

const StatusBadge: React.FC<{ status: Status }> = ({ status }) => {
  const styles = {
    [Status.DRAFT]: 'bg-slate-100 text-slate-800',
    [Status.SUBMITTED]: 'bg-blue-100 text-blue-800',
    [Status.APPROVED]: 'bg-green-100 text-green-800',
    [Status.REJECTED]: 'bg-red-100 text-red-800',
  };

  const Icons = {
    [Status.DRAFT]: Clock,
    [Status.SUBMITTED]: Clock,
    [Status.APPROVED]: CheckCircle,
    [Status.REJECTED]: XCircle,
  };

  const Icon = Icons[status];

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      <Icon className="w-3 h-3 mr-1" />
      {status}
    </span>
  );
};

const EntryList: React.FC<EntryListProps> = ({ entries, role }) => {
  if (entries.length === 0) {
    return <div className="text-center text-slate-500 py-8">No records found.</div>;
  }

  return (
    <div className="flex flex-col">
      <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
          <div className="shadow overflow-hidden border-b border-slate-200 sm:rounded-lg">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Project
                  </th>
                  {role === Role.MANAGER && (
                     <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                     Contractor
                   </th>
                  )}
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Hours
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {entry.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {entry.projectName}
                    </td>
                    {role === Role.MANAGER && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {entry.contractorName}
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate" title={entry.description}>
                      {entry.description}
                      {entry.status === Status.REJECTED && entry.rejectionReason && (
                        <div className="text-red-600 text-xs mt-1 flex items-center">
                          <AlertTriangle className="w-3 h-3 mr-1"/> 
                          Reason: {entry.rejectionReason}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-semibold">
                      {entry.hours}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={entry.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EntryList;