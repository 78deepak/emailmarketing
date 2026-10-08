import { useState, useId } from 'react';
import { toast } from 'sonner';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useImportContacts } from '@/features/contacts/use-contacts';
import { useLists } from '@/features/lists/use-lists';
import { normalizeAxiosError } from '@/lib/api';
import type { ImportContactItem, ImportContactsResponse } from '@/types/contacts';

export function ImportContactsDialog() {
  const [open, setOpen] = useState(false);
  const [selectedListId, setSelectedListId] = useState<string>('none');
  const [rawText, setRawText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedItems, setParsedItems] = useState<ImportContactItem[]>([]);
  const [result, setResult] = useState<ImportContactsResponse | null>(null);

  const fileInputId = useId();
  const importContacts = useImportContacts();
  const { data: lists } = useLists();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setRawText(text);
      parseCsvText(text);
    };
    reader.readAsText(file);
  };

  const parseCsvText = (text: string) => {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      setParsedItems([]);
      return;
    }

    // Check header
    const firstLine = lines[0].toLowerCase();
    const hasHeader =
      firstLine.includes('email') ||
      firstLine.includes('first') ||
      firstLine.includes('name');

    const dataLines = hasHeader ? lines.slice(1) : lines;

    const items: ImportContactItem[] = [];
    for (const line of dataLines) {
      const parts = line.split(/[,;\t]/).map((p) => p.trim().replace(/^["']|["']$/g, ''));
      if (parts.length >= 1 && parts[0]) {
        const email = parts[0];
        const firstName = parts[1] || undefined;
        const lastName = parts[2] || undefined;
        items.push({ email, firstName, lastName });
      }
    }

    setParsedItems(items);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setRawText(text);
    parseCsvText(text);
  };

  const handleImport = async () => {
    if (parsedItems.length === 0) {
      toast.error('No contacts to import.');
      return;
    }

    try {
      const res = await importContacts.mutateAsync({
        contacts: parsedItems,
        listId: selectedListId === 'none' ? undefined : selectedListId,
      });

      setResult(res);
      toast.success(`Import complete: ${res.imported} imported, ${res.skipped} skipped.`);
    } catch (err) {
      toast.error(normalizeAxiosError(err).message);
    }
  };

  const handleReset = () => {
    setFileName(null);
    setRawText('');
    setParsedItems([]);
    setResult(null);
    setSelectedListId('none');
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) handleReset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <UploadCloud className="h-4 w-4" />
          <span>Import CSV</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Import Contacts</DialogTitle>
          <DialogDescription>
            Upload a CSV file or paste email addresses (format: <code>email, firstName, lastName</code>).
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <div className="flex items-center gap-2 text-primary font-semibold">
                <CheckCircle2 className="h-5 w-5" />
                <span>Import Finished</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-2">
                <div className="rounded-md bg-primary/10 p-2">
                  <div className="text-xl font-bold text-primary">{result.imported}</div>
                  <div className="text-xs text-muted-foreground">Imported</div>
                </div>
                <div className="rounded-md bg-secondary p-2">
                  <div className="text-xl font-bold text-foreground">{result.skipped}</div>
                  <div className="text-xs text-muted-foreground">Duplicates Skipped</div>
                </div>
                <div className="rounded-md bg-destructive/10 p-2">
                  <div className="text-xl font-bold text-destructive">
                    {result.errors.length}
                  </div>
                  <div className="text-xs text-muted-foreground">Errors</div>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div className="mt-2 text-xs text-destructive space-y-1">
                  <div className="font-semibold flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" /> Invalid rows:
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 max-h-24 overflow-y-auto">
                    {result.errors.slice(0, 5).map((e, idx) => (
                      <li key={idx}>
                        {e.email}: {e.reason}
                      </li>
                    ))}
                    {result.errors.length > 5 && (
                      <li>...and {result.errors.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setOpen(false)}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Optional target list selection */}
            {lists && lists.length > 0 && (
              <div className="space-y-1.5">
                <Label htmlFor="import-target-list">Assign to List (optional)</Label>
                <Select value={selectedListId} onValueChange={setSelectedListId}>
                  <SelectTrigger id="import-target-list">
                    <SelectValue placeholder="Choose a list" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- No list assignment --</SelectItem>
                    {lists.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name} ({l.contactCount} contacts)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* File dropzone / selector */}
            <div className="rounded-lg border border-dashed border-border p-4 text-center hover:bg-accent/40 transition-colors">
              <input
                type="file"
                id={fileInputId}
                accept=".csv,.txt"
                className="hidden"
                onChange={handleFileUpload}
              />
              <label
                htmlFor={fileInputId}
                className="cursor-pointer flex flex-col items-center gap-1 text-sm text-muted-foreground"
              >
                <FileText className="h-8 w-8 text-primary/70 mb-1" />
                {fileName ? (
                  <span className="font-medium text-foreground">{fileName}</span>
                ) : (
                  <>
                    <span className="font-medium text-foreground">Click to upload CSV</span>
                    <span className="text-xs">Comma or tab separated values</span>
                  </>
                )}
              </label>
            </div>

            {/* Paste box */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <Label htmlFor="import-raw-text">Or paste CSV content directly</Label>
                {parsedItems.length > 0 && (
                  <span className="font-medium text-primary">
                    {parsedItems.length} contact{parsedItems.length === 1 ? '' : 's'} detected
                  </span>
                )}
              </div>
              <textarea
                id="import-raw-text"
                rows={4}
                value={rawText}
                onChange={handleTextChange}
                placeholder="sarah@company.com, Sarah, Connor&#10;john@domain.com, John, Doe"
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs font-mono shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleImport}
                disabled={parsedItems.length === 0 || importContacts.isPending}
              >
                {importContacts.isPending
                  ? 'Importing...'
                  : `Import ${parsedItems.length} Contacts`}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
