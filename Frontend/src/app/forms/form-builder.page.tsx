import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Eye,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

import {
  useForm,
  useCreateForm,
  useUpdateForm,
} from '@/features/forms/use-forms';
import { useLists } from '@/features/lists/use-lists';
import { normalizeAxiosError } from '@/lib/api';
import type { FieldInputType, FormField, FormSettings, FormType } from '@/types/forms';

const FIELD_TYPES: Array<{ type: FieldInputType; label: string }> = [
  { type: 'text', label: 'Single Line Text' },
  { type: 'email', label: 'Email Address' },
  { type: 'tel', label: 'Phone Number' },
  { type: 'number', label: 'Number' },
  { type: 'textarea', label: 'Multi-line Paragraph' },
  { type: 'checkbox', label: 'Consent Checkbox' },
];

export default function FormBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const { data: existingForm, isLoading: isFormLoading } = useForm(id);
  const { data: rawLists } = useLists();
  const lists = Array.isArray(rawLists) ? rawLists : [];

  // Form State
  const [name, setName] = useState('New Opt-in Form');
  const [type, setType] = useState<FormType>('embedded');
  const [listId, setListId] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);

  const [activeTab, setActiveTab] = useState<'fields' | 'copy' | 'general'>('fields');

  const [settings, setSettings] = useState<FormSettings>({
    title: 'Join Our Newsletter',
    description: 'Get the latest articles, product news, and exclusive updates sent directly to your inbox.',
    buttonText: 'Subscribe Now',
    successMessage: 'Thank you for subscribing! Please check your email inbox to confirm.',
    redirectUrl: '',
  });

  const [fields, setFields] = useState<FormField[]>([
    {
      id: 'f-email',
      name: 'email',
      label: 'Email Address',
      type: 'email',
      required: true,
      placeholder: 'you@example.com',
    },
    {
      id: 'f-first-name',
      name: 'firstName',
      label: 'First Name',
      type: 'text',
      required: false,
      placeholder: 'Jane',
    },
  ]);

  const createMutation = useCreateForm();
  const updateMutation = useUpdateForm();

  useEffect(() => {
    if (existingForm) {
      setName(existingForm.name);
      setType(existingForm.type || 'embedded');
      setListId(existingForm.listId || '');
      setIsActive(existingForm.isActive);
      if (existingForm.fields?.length) {
        setFields(existingForm.fields);
      }
      if (existingForm.settings) {
        setSettings({
          title: existingForm.settings.title || 'Join Our Newsletter',
          description: existingForm.settings.description || '',
          buttonText: existingForm.settings.buttonText || 'Subscribe Now',
          successMessage: existingForm.settings.successMessage || 'Thank you for subscribing!',
          redirectUrl: existingForm.settings.redirectUrl || '',
        });
      }
    }
  }, [existingForm]);

  const handleAddField = (fieldType: FieldInputType) => {
    const fieldId = `field_${Date.now()}`;
    const newField: FormField = {
      id: fieldId,
      name: fieldType === 'tel' ? 'phone' : `custom_${fields.length}`,
      label: fieldType === 'tel' ? 'Phone Number' : `New ${fieldType} Field`,
      type: fieldType,
      required: false,
      placeholder: '',
    };
    setFields([...fields, newField]);
    toast.success(`Added ${newField.label}`);
  };

  const handleRemoveField = (index: number) => {
    if (fields[index].name === 'email') {
      toast.error('Email field is required for subscription forms and cannot be removed');
      return;
    }
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleMoveField = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= fields.length) return;
    const reordered = [...fields];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    setFields(reordered);
  };

  const handleUpdateField = (index: number, updates: Partial<FormField>) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], ...updates };
    setFields(updated);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Form name is required');
      return;
    }

    try {
      if (isEditing && id) {
        await updateMutation.mutateAsync({
          id,
          payload: {
            name: name.trim(),
            type,
            listId: listId || null,
            fields,
            settings,
            isActive,
          },
        });
        toast.success('Form updated successfully');
      } else {
        const created = await createMutation.mutateAsync({
          name: name.trim(),
          type,
          listId: listId || undefined,
          fields,
          settings,
          isActive,
        });
        toast.success('Form created successfully');
        navigate(`/app/forms/${created.id}`);
      }
    } catch (err) {
      toast.error(normalizeAxiosError(err).message);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (isEditing && isFormLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground animate-pulse text-sm">Loading form editor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="h-8 w-8">
            <Link to="/app/forms">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>

          <div className="flex items-center gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 font-semibold text-base max-w-[260px] sm:max-w-[340px]"
            />
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium border transition-colors ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-muted text-muted-foreground border-border'
              }`}
            >
              {isActive ? '● Active' : '○ Inactive'}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEditing && id && (
            <Button variant="outline" size="sm" asChild>
              <Link to={`/app/forms/${id}`}>Submissions</Link>
            </Button>
          )}

          <Button size="sm" onClick={handleSave} disabled={isSaving} className="gap-1.5">
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Form'}
          </Button>
        </div>
      </div>

      {/* Main Split Layout: Editor on left, Live Form Preview on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Editor controls */}
        <div className="lg:col-span-7 space-y-4">
          {/* Subtabs */}
          <div className="flex rounded-md border border-border bg-muted/40 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('fields')}
              className={`flex-1 py-1.5 rounded-sm font-medium transition-all ${
                activeTab === 'fields'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Fields ({fields.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('copy')}
              className={`flex-1 py-1.5 rounded-sm font-medium transition-all ${
                activeTab === 'copy'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Copy & Messaging
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('general')}
              className={`flex-1 py-1.5 rounded-sm font-medium transition-all ${
                activeTab === 'general'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Format & List Link
            </button>
          </div>

          {/* Tab 1: Fields Editor */}
          {activeTab === 'fields' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <h3 className="font-semibold text-foreground text-xs uppercase tracking-wider">
                    Form Fields
                  </h3>
                  <span className="text-[11px] text-muted-foreground">Email is mandatory</span>
                </div>

                <div className="space-y-3">
                  {fields.map((f, idx) => (
                    <div
                      key={f.id || idx}
                      className="rounded-lg border border-border bg-muted/20 p-3 space-y-2.5 text-xs transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] font-mono capitalize">
                            {f.type}
                          </Badge>
                          <span className="font-semibold text-foreground">{f.label}</span>
                          {f.required && (
                            <span className="text-rose-500 font-bold">*</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={idx === 0}
                            onClick={() => handleMoveField(idx, idx - 1)}
                            className="h-6 w-6 text-muted-foreground"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={idx === fields.length - 1}
                            onClick={() => handleMoveField(idx, idx + 1)}
                            className="h-6 w-6 text-muted-foreground"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                          {f.name !== 'email' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveField(idx)}
                              className="h-6 w-6 text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        <div className="space-y-1">
                          <span className="text-[10px] text-muted-foreground">Field Label</span>
                          <Input
                            value={f.label}
                            onChange={(e) => handleUpdateField(idx, { label: e.target.value })}
                            className="h-7 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-muted-foreground">Placeholder Text</span>
                          <Input
                            value={f.placeholder || ''}
                            onChange={(e) =>
                              handleUpdateField(idx, { placeholder: e.target.value })
                            }
                            className="h-7 text-xs"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-4 pt-1">
                        <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-muted-foreground">
                          <input
                            type="checkbox"
                            checked={f.required || false}
                            disabled={f.name === 'email'}
                            onChange={(e) =>
                              handleUpdateField(idx, { required: e.target.checked })
                            }
                            className="rounded border-input text-primary focus:ring-primary"
                          />
                          Required Field
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Field Toolbar */}
              <div className="rounded-lg border border-border bg-card p-4 space-y-2">
                <span className="text-xs font-semibold text-foreground block">
                  Add Additional Field:
                </span>
                <div className="flex flex-wrap gap-2">
                  {FIELD_TYPES.filter((t) => t.type !== 'email').map((t) => (
                    <Button
                      key={t.type}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddField(t.type)}
                      className="text-xs gap-1.5 h-8"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {t.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Copy & Messaging */}
          {activeTab === 'copy' && (
            <div className="rounded-lg border border-border bg-card p-5 space-y-4 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="form-title">Headline / Title</Label>
                <Input
                  id="form-title"
                  value={settings.title || ''}
                  onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                  placeholder="e.g. Subscribe to our newsletter"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="form-desc">Intro Description</Label>
                <textarea
                  id="form-desc"
                  rows={3}
                  value={settings.description || ''}
                  onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                  className="w-full rounded-md border border-input bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Explain why visitors should subscribe..."
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="form-btn">Submit Button Text</Label>
                <Input
                  id="form-btn"
                  value={settings.buttonText || 'Subscribe Now'}
                  onChange={(e) => setSettings({ ...settings, buttonText: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="form-success">Success Confirmation Message</Label>
                <Input
                  id="form-success"
                  value={settings.successMessage || ''}
                  onChange={(e) =>
                    setSettings({ ...settings, successMessage: e.target.value })
                  }
                  placeholder="e.g. Thanks for subscribing! Please check your inbox."
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="form-redirect">Optional Redirect URL</Label>
                <Input
                  id="form-redirect"
                  type="url"
                  value={settings.redirectUrl || ''}
                  onChange={(e) => setSettings({ ...settings, redirectUrl: e.target.value })}
                  placeholder="https://yourwebsite.com/welcome"
                />
                <p className="text-[11px] text-muted-foreground">
                  If set, visitors will be redirected to this URL upon successful submission.
                </p>
              </div>
            </div>
          )}

          {/* Tab 3: General & List */}
          {activeTab === 'general' && (
            <div className="rounded-lg border border-border bg-card p-5 space-y-4 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="general-type">Form Format</Label>
                <select
                  id="general-type"
                  aria-label="Form Format"
                  value={type}
                  onChange={(e) => setType(e.target.value as FormType)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="embedded">Embedded (Inline in website)</option>
                  <option value="popup">Popup Modal</option>
                  <option value="hosted">Hosted Standalone Page</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="general-list">Connected Audience List</Label>
                <select
                  id="general-list"
                  aria-label="Connected Audience List"
                  value={listId}
                  onChange={(e) => setListId(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">No list (contacts created standalone)</option>
                  {lists.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground">
                  New submissions will automatically be added to this list.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Interactive Form Preview */}
        <div className="lg:col-span-5 sticky top-6 space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span className="flex items-center gap-1.5 font-medium">
              <Eye className="h-3.5 w-3.5 text-primary" />
              Interactive Live Preview
            </span>
            <Badge variant="outline" className="text-[10px] capitalize">
              {type} preview
            </Badge>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
            {settings.title && (
              <div className="space-y-1 text-center">
                <h3 className="text-lg font-bold tracking-tight text-foreground">
                  {settings.title}
                </h3>
                {settings.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {settings.description}
                  </p>
                )}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                toast.success('Preview submit successful! ' + (settings.successMessage || ''));
              }}
              className="space-y-3.5"
            >
              {fields.map((f) => (
                <div key={f.id} className="space-y-1">
                  <Label className="text-xs">
                    {f.label} {f.required && <span className="text-rose-500">*</span>}
                  </Label>

                  {f.type === 'textarea' ? (
                    <textarea
                      placeholder={f.placeholder}
                      rows={3}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground"
                    />
                  ) : f.type === 'checkbox' ? (
                    <label className="flex items-center gap-2 text-xs cursor-pointer text-muted-foreground">
                      <input type="checkbox" required={f.required} className="rounded" />
                      <span>{f.placeholder || f.label}</span>
                    </label>
                  ) : (
                    <Input
                      type={f.type}
                      placeholder={f.placeholder}
                      required={f.required}
                      className="h-9 text-xs"
                    />
                  )}
                </div>
              ))}

              <Button type="submit" className="w-full h-9 text-xs font-semibold gap-1.5">
                {settings.buttonText || 'Subscribe Now'}
              </Button>
            </form>

            <p className="text-[10px] text-center text-muted-foreground">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
