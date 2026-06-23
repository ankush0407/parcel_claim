import { Upload, Database, CheckCircle2, AlertTriangle } from 'lucide-react';
import Header from '../components/Layout/Header';

export default function AdminTrackingPage() {
  return (
    <div>
      <Header
        title="Tracking Event Upload"
        subtitle="Admin-only area to ingest tracking feeds used by claim automation"
      />

      <div className="px-4 md:px-8 py-4 md:py-6 space-y-5">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-maersk-navy mb-1">Upload carrier tracking file</h2>
          <p className="text-xs text-gray-500 mb-4">Supported format: CSV with tracking_number, event_code, event_status, event_time, event_location.</p>

          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-maersk-sky transition-colors">
            <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Drag and drop CSV, or click to browse</p>
            <p className="text-xs text-gray-400 mt-1">This is a demo UI. Backend upload processing can be wired next.</p>
            <button className="mt-4 px-4 py-2 bg-maersk-blue text-white rounded-lg text-sm font-medium hover:bg-maersk-navy transition-colors">
              Select CSV File
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-maersk-blue">
            <div className="flex items-center gap-2 mb-1">
              <Database className="w-4 h-4 text-maersk-blue" />
              <p className="text-xs text-gray-500">Batches Processed</p>
            </div>
            <p className="text-2xl font-bold text-maersk-navy">38</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-green-500">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <p className="text-xs text-gray-500">Accepted Rows</p>
            </div>
            <p className="text-2xl font-bold text-maersk-navy">124,880</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-red-500">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <p className="text-xs text-gray-500">Rejected Rows</p>
            </div>
            <p className="text-2xl font-bold text-maersk-navy">112</p>
          </div>
        </div>
      </div>
    </div>
  );
}
