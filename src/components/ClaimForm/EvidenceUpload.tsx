import { useCallback, useState } from 'react';
import { Upload, X, FileText, Image, AlertCircle } from 'lucide-react';
import { formatFileSize } from '../../utils/helpers';
import clsx from 'clsx';

interface EvidenceUploadProps {
  files: File[];
  onChange: (files: File[]) => void;
}

const ACCEPTED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp',
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

const evidenceCategories = [
  { label: 'Commercial Invoice', hint: 'Invoice showing value of goods' },
  { label: 'Bill of Lading', hint: 'Shipping document from carrier' },
  { label: 'Packing List', hint: 'Detailed list of items packed' },
  { label: 'Damage Photos', hint: 'Clear photos of damaged packaging/goods' },
  { label: 'Survey Report', hint: 'Independent survey or inspection report' },
  { label: 'Customer Email', hint: 'Email correspondence about the issue' },
];

export default function EvidenceUpload({ files, onChange }: EvidenceUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const addFiles = useCallback((incoming: File[]) => {
    const newErrors: string[] = [];
    const valid: File[] = [];

    for (const f of incoming) {
      if (!ACCEPTED_TYPES.includes(f.type)) {
        newErrors.push(`${f.name}: unsupported file type`);
        continue;
      }
      if (f.size > MAX_FILE_SIZE) {
        newErrors.push(`${f.name}: exceeds 20 MB limit`);
        continue;
      }
      if (files.some(existing => existing.name === f.name)) {
        newErrors.push(`${f.name}: already added`);
        continue;
      }
      valid.push(f);
    }

    setErrors(newErrors);
    if (valid.length) onChange([...files, ...valid]);
  }, [files, onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    addFiles(Array.from(e.dataTransfer.files));
  }, [addFiles]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files));
    e.target.value = '';
  };

  const remove = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="w-4 h-4 text-blue-500" />;
    return <FileText className="w-4 h-4 text-red-500" />;
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-maersk-navy">Evidence & Documentation</h2>
        <p className="text-sm text-gray-500 mt-1">Upload supporting documents to strengthen your claim. Accepted: PDF, JPG, PNG, XLSX. Max 20 MB per file.</p>
      </div>

      {/* Required documents guide */}
      <div className="bg-maersk-pale border border-maersk-sky/30 rounded-xl p-4">
        <p className="text-xs font-semibold text-maersk-navy mb-3">Recommended Evidence Checklist</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {evidenceCategories.map(({ label, hint }) => {
            const uploaded = files.some(f => f.name.toLowerCase().includes(label.toLowerCase().split(' ')[0]));
            return (
              <div key={label} className={clsx(
                'flex items-start gap-2 p-2 rounded-lg border text-xs',
                uploaded ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
              )}>
                <span className={uploaded ? 'text-green-500' : 'text-gray-300'}>
                  {uploaded ? '✓' : '○'}
                </span>
                <div>
                  <p className={clsx('font-medium leading-tight', uploaded ? 'text-green-700' : 'text-gray-600')}>{label}</p>
                  <p className="text-gray-400 mt-0.5 leading-tight">{hint}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragEnter={() => setDragActive(true)}
        onDragLeave={() => setDragActive(false)}
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
        className={clsx(
          'relative border-2 border-dashed rounded-xl p-8 text-center transition-all',
          dragActive
            ? 'border-maersk-blue bg-maersk-light'
            : 'border-gray-200 hover:border-maersk-sky hover:bg-gray-50'
        )}
      >
        <input
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.webp,.xlsx,.xls"
          onChange={handleInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <Upload className={clsx('w-8 h-8 mx-auto mb-3', dragActive ? 'text-maersk-blue' : 'text-gray-300')} />
        <p className="text-sm font-medium text-gray-600">
          {dragActive ? 'Drop files here' : 'Drag & drop files or click to browse'}
        </p>
        <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG, XLSX — up to 20 MB each</p>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
          {errors.map((err, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-red-600">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {err}
            </div>
          ))}
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500">{files.length} file{files.length !== 1 ? 's' : ''} attached</p>
          {files.map((file, index) => (
            <div key={index} className="flex items-center gap-3 bg-white border border-gray-100 rounded-lg px-3 py-2.5">
              {getFileIcon(file)}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-700 truncate">{file.name}</p>
                <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => remove(index)}
                className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
