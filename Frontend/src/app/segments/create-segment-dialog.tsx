import { useState } from 'react';
import { toast } from 'sonner';
import { Layers, Plus, Trash2 } from 'lucide-react';

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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useCreateSegment } from '@/features/segments/use-segments';
import { normalizeAxiosError } from '@/lib/api';
import type { SegmentCondition, SegmentOperator } from '@/types/segments';

export function CreateSegmentDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [match, setMatch] = useState<'all' | 'any'>('all');
  const [conditions, setConditions] = useState<SegmentCondition[]>([
    { field: 'status', op: 'eq', value: 'subscribed' },
  ]);

  const createSegment = useCreateSegment();

  const handleAddCondition = () => {
    setConditions((prev) => [...prev, { field: 'status', op: 'eq', value: 'subscribed' }]);
  };

  const handleRemoveCondition = (index: number) => {
    setConditions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConditionChange = (
    index: number,
    field: keyof SegmentCondition,
    value: string,
  ) => {
    setConditions((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Segment name is required');
      return;
    }
    if (conditions.length === 0) {
      toast.error('At least one condition rule is required');
      return;
    }

    try {
      await createSegment.mutateAsync({
        name: name.trim(),
        rules: {
          match,
          conditions,
        },
      });
      toast.success('Segment created');
      setName('');
      setConditions([{ field: 'status', op: 'eq', value: 'subscribed' }]);
      setOpen(false);
    } catch (err) {
      toast.error(normalizeAxiosError(err).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Layers className="h-4 w-4" />
          <span>Create Segment</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create Dynamic Segment</DialogTitle>
          <DialogDescription>
            Target subscribers automatically based on matching criteria rules.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="segment-name">Segment Name</Label>
            <Input
              id="segment-name"
              placeholder="e.g. Active VIP Customers"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Matching Rules</Label>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Match:</span>
                <select
                  value={match}
                  onChange={(e) => setMatch(e.target.value as 'all' | 'any')}
                  className="rounded border border-input bg-transparent px-2 py-1 font-medium text-xs text-foreground"
                >
                  <option value="all">ALL conditions (AND)</option>
                  <option value="any">ANY condition (OR)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {conditions.map((cond, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded-md border border-border bg-card p-2 text-xs"
                >
                  {/* Field */}
                  <div className="w-1/3">
                    <Select
                      value={cond.field}
                      onValueChange={(val) => handleConditionChange(idx, 'field', val)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="status">Status</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="firstName">First Name</SelectItem>
                        <SelectItem value="lastName">Last Name</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Operator */}
                  <div className="w-28">
                    <Select
                      value={cond.op}
                      onValueChange={(val) =>
                        handleConditionChange(idx, 'op', val as SegmentOperator)
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="eq">Equals (=)</SelectItem>
                        <SelectItem value="neq">Not Equals (≠)</SelectItem>
                        <SelectItem value="contains">Contains</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Value */}
                  <div className="flex-1">
                    {cond.field === 'status' ? (
                      <Select
                        value={cond.value}
                        onValueChange={(val) => handleConditionChange(idx, 'value', val)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="subscribed">subscribed</SelectItem>
                          <SelectItem value="unsubscribed">unsubscribed</SelectItem>
                          <SelectItem value="bounced">bounced</SelectItem>
                          <SelectItem value="complained">complained</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={cond.value}
                        onChange={(e) => handleConditionChange(idx, 'value', e.target.value)}
                        placeholder="Value..."
                        className="h-8 text-xs"
                      />
                    )}
                  </div>

                  {conditions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCondition(idx)}
                      className="p-1 text-muted-foreground hover:text-destructive"
                      title="Remove condition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddCondition}
              className="gap-1 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Condition</span>
            </Button>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createSegment.isPending}>
              {createSegment.isPending ? 'Saving...' : 'Save Segment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
