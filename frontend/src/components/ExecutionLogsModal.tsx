import { X, Play, Trash2, Terminal } from 'lucide-react';
import { useWorkflowStore } from '../store/workflowStore';

interface ExecutionLogsModalProps {
  onClose: () => void;
}

const ExecutionLogsModal = ({ onClose }: ExecutionLogsModalProps) => {
  const { logs, clearLogs, executeWorkflow, isExecuting } = useWorkflowStore();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-7xl h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Terminal className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Execution Logs</h2>
            {logs.length > 0 && (
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                {logs.length} {logs.length === 1 ? 'log' : 'logs'}
              </span>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
          {logs.length === 0 ? (
            <div className="text-center py-20">
              <Terminal className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-6" />
              <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-3">
                No execution logs yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Run a workflow to see execution logs here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className={`p-5 rounded-lg border shadow-sm ${
                    log.type === 'error' 
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
                      : log.type === 'info'
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                      : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`text-sm font-semibold px-2 py-1 rounded ${
                          log.type === 'error' 
                            ? 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200' 
                            : log.type === 'info'
                            ? 'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                            : 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200'
                        }`}>
                          {log.nodeId}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <span className={`text-xs uppercase font-medium px-2 py-1 rounded-full ${
                          log.type === 'error' 
                            ? 'bg-red-200 dark:bg-red-700 text-red-800 dark:text-red-200' 
                            : log.type === 'info'
                            ? 'bg-blue-200 dark:bg-blue-700 text-blue-800 dark:text-blue-200'
                            : 'bg-green-200 dark:bg-green-700 text-green-800 dark:text-green-200'
                        }`}>
                          {log.type}
                        </span>
                      </div>
                      <p className={`text-base leading-relaxed ${
                        log.type === 'error' 
                          ? 'text-red-700 dark:text-red-300' 
                          : log.type === 'info'
                          ? 'text-blue-700 dark:text-blue-300'
                          : 'text-green-700 dark:text-green-300'
                      }`}>
                        {log.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center space-x-4">
            <button
              onClick={clearLogs}
              disabled={logs.length === 0}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              <Trash2 size={16} />
              <span>Clear Logs</span>
            </button>
            {logs.length > 0 && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Total: {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
              </span>
            )}
          </div>
          <button
            onClick={executeWorkflow}
            disabled={isExecuting}
            className="flex items-center space-x-2 px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-green-400 focus:ring-2 focus:ring-green-500 transition-colors"
          >
            <Play size={16} />
            <span>{isExecuting ? 'Executing...' : 'Run Workflow'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExecutionLogsModal;