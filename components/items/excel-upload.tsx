'use client';

import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ExcelUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<{ rows: Record<string, unknown>[]; total: number } | null>(null);
  const [status, setStatus] = useState<'idle' | 'parsing' | 'ready' | 'importing' | 'done'>('idle');
  const [result, setResult] = useState<{ imported: number; errors: string[] } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = async (f: File) => {
    setFile(f);
    setStatus('parsing');
    const fd = new FormData();
    fd.append('file', f);
    const res = await fetch('/api/items/import', { method: 'POST', body: fd });
    const data = await res.json();
    setPreview({ rows: data.preview ?? [], total: data.total ?? 0 });
    setStatus('ready');
  };

  const handleImport = async () => {
    if (!file) return;
    setStatus('importing');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('mode', 'confirm');
    const res = await fetch('/api/items/import', { method: 'POST', body: fd });
    const data = await res.json();
    setResult(data);
    setStatus('done');
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <p className="text-sm text-muted-foreground">
        Upload an Excel or CSV file. Columns detected: <strong>name, category, unit, qty, price</strong>
      </p>

      {/* Drop zone */}
      <div
        className={cn(
          'relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 transition-colors cursor-pointer',
          dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
        )}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files[0];
          if (f) handleFile(f);
        }}
      >
        <FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
        <div className="text-center">
          <p className="font-medium text-sm">Drop your file here or click to browse</p>
          <p className="text-xs text-muted-foreground mt-1">.xlsx, .xls, .csv</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".xlsx,.xls,.csv"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </div>

      {status === 'parsing' && (
        <p className="text-sm text-muted-foreground animate-pulse">Parsing file…</p>
      )}

      {status === 'ready' && preview && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              Found <strong>{preview.total}</strong> rows
            </p>
            <Button onClick={handleImport}>
              <Upload className="h-4 w-4 mr-2" />
              Import All
            </Button>
          </div>
          <div className="rounded-md border overflow-auto max-h-48">
            <table className="w-full text-xs">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  {Object.keys(preview.rows[0] ?? {}).map(k => (
                    <th key={k} className="px-3 py-2 text-left font-medium">
                      {k}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row, i) => (
                  <tr key={i} className="border-t">
                    {Object.values(row).map((val, j) => (
                      <td key={j} className="px-3 py-1.5">
                        {String(val ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">Showing first 5 rows preview</p>
        </div>
      )}

      {status === 'importing' && (
        <p className="text-sm text-muted-foreground animate-pulse">Importing items…</p>
      )}

      {status === 'done' && result && (
        <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-800">
              Successfully imported {result.imported} items
            </p>
            {result.errors.length > 0 && (
              <p className="text-xs text-amber-700 mt-1">
                {result.errors.length} rows skipped
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
