import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  Search,
  Copy,
  Pencil,
  Trash2,
  Eye,
  FolderPlus,
  Smartphone,
  Monitor,
  MoreHorizontal,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import {
  useTemplates,
  useTemplateCategories,
  useCreateCategory,
  useDeleteCategory,
  useDuplicateTemplate,
  useDeleteTemplate,
} from '@/features/templates/use-templates';
import { normalizeAxiosError } from '@/lib/api';
import type { BuilderType, Template, TemplateCategory } from '@/types/templates';

export default function TemplatesPage() {
  const navigate = useNavigate();

  // Filters state
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [builderFilter, setBuilderFilter] = useState<'all' | BuilderType>('all');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'mine' | 'gallery'>('all');
  const [page, setPage] = useState(1);

  // Categories query
  const { data: rawCategories } = useTemplateCategories();
  const categories = Array.isArray(rawCategories) ? rawCategories : [];

  // Templates query
  const queryParams = {
    page,
    limit: 12,
    search: search.trim() || undefined,
    categoryId: selectedCategory !== 'all' ? selectedCategory : undefined,
    builderType: builderFilter !== 'all' ? builderFilter : undefined,
    gallery: scopeFilter === 'gallery' ? ('true' as const) : undefined,
  };

  const { data: templatesRes, isLoading } = useTemplates(queryParams);
  const templates = Array.isArray(templatesRes)
    ? templatesRes
    : (templatesRes?.data ?? []);
  const meta = !Array.isArray(templatesRes) ? templatesRes?.meta : undefined;

  // Filter out gallery if scope is 'mine'
  const filteredTemplates = templates.filter((t) => {
    if (scopeFilter === 'mine') return !t.isGallery;
    return true;
  });

  // Modal states
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [deletingTemplate, setDeletingTemplate] = useState<Template | null>(null);

  const duplicateMutation = useDuplicateTemplate();
  const deleteMutation = useDeleteTemplate();

  const handleDuplicate = async (tmpl: Template) => {
    try {
      const duplicated = await duplicateMutation.mutateAsync(tmpl.id);
      toast.success(`Created copy "${duplicated.name}"`);
    } catch (err) {
      toast.error(normalizeAxiosError(err).message);
    }
  };

  const handleDelete = async () => {
    if (!deletingTemplate) return;
    try {
      await deleteMutation.mutateAsync(deletingTemplate.id);
      toast.success('Template deleted');
      setDeletingTemplate(null);
    } catch (err) {
      toast.error(normalizeAxiosError(err).message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Email Templates</h1>
          <p className="text-sm text-muted-foreground">
            Create, preview, and organize responsive HTML email templates for your campaigns.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCategoriesOpen(true)}
            className="gap-2"
          >
            <FolderPlus className="h-4 w-4" />
            Categories
          </Button>
          <Button asChild className="gap-2">
            <Link to="/app/templates/new">
              <Plus className="h-4 w-4" />
              New Template
            </Link>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search templates by name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Scope tabs */}
            <div className="flex rounded-md border border-border bg-muted/30 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => {
                  setScopeFilter('all');
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-sm font-medium transition-all ${
                  scopeFilter === 'all'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => {
                  setScopeFilter('mine');
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-sm font-medium transition-all ${
                  scopeFilter === 'mine'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Custom
              </button>
              <button
                type="button"
                onClick={() => {
                  setScopeFilter('gallery');
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-sm font-medium transition-all ${
                  scopeFilter === 'gallery'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Gallery
              </button>
            </div>

            {/* Category select */}
            <select
              aria-label="Filter by category"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="h-9 rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Builder select */}
            <select
              aria-label="Filter by builder"
              value={builderFilter}
              onChange={(e) => {
                setBuilderFilter(e.target.value as 'all' | BuilderType);
                setPage(1);
              }}
              className="h-9 rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="all">All Builders</option>
              <option value="classic">Classic HTML</option>
              <option value="pro">Pro Builder</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-border bg-card p-4 animate-pulse space-y-3"
            >
              <div className="h-40 rounded-md bg-muted" />
              <div className="h-5 w-32 rounded bg-muted" />
              <div className="h-4 w-20 rounded bg-muted/60" />
            </div>
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card/60 p-12 text-center">
          <div className="flex flex-col items-center justify-center gap-2 max-w-md mx-auto text-muted-foreground">
            <FileText className="h-10 w-10 stroke-1 text-primary/70 mb-1" />
            <h2 className="text-lg font-semibold text-foreground">No templates found</h2>
            <p className="text-sm">
              {search || selectedCategory !== 'all' || scopeFilter !== 'all'
                ? 'Try adjusting your filters or search keyword.'
                : 'Get started by creating your first email template or picking from the starter gallery.'}
            </p>
            <div className="pt-3">
              <Button asChild className="gap-2">
                <Link to="/app/templates/new">
                  <Plus className="h-4 w-4" />
                  Create Template
                </Link>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredTemplates.map((tmpl) => {
            const cat = categories.find((c) => c.id === tmpl.categoryId);
            return (
              <div
                key={tmpl.id}
                className="group flex flex-col justify-between overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-primary/50 hover:shadow-md"
              >
                {/* Visual Thumbnail / Preview Header */}
                <div className="relative h-44 w-full bg-muted/30 border-b border-border/80 overflow-hidden flex items-center justify-center">
                  {tmpl.renderedHtml ? (
                    <div className="relative h-full w-full pointer-events-none select-none overflow-hidden bg-white">
                      <iframe
                        srcDoc={tmpl.renderedHtml}
                        title={tmpl.name}
                        className="h-[380px] w-[500px] origin-top-left transform scale-[0.44] border-0"
                        sandbox="allow-same-origin"
                        tabIndex={-1}
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
                      <FileText className="h-8 w-8 stroke-1 mb-2 opacity-50" />
                      <span className="text-xs">No HTML Content</span>
                    </div>
                  )}

                  {/* Hover Overlay with Quick Preview Action */}
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setPreviewTemplate(tmpl)}
                      className="gap-1.5 shadow-sm text-xs"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Preview
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => navigate(`/app/templates/${tmpl.id}/edit`)}
                      className="gap-1.5 shadow-sm text-xs"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                  </div>

                  {/* Corner Badges */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 pointer-events-none">
                    {tmpl.isGallery ? (
                      <Badge className="bg-blue-500/90 text-white text-[10px] px-1.5 py-0 shadow-sm border-0 gap-1">
                        <Sparkles className="h-2.5 w-2.5" />
                        Gallery
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-background/90 backdrop-blur text-[10px] px-1.5 py-0 border-border">
                        Custom
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Card Info Footer */}
                <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-1.5">
                      <h3 className="font-semibold text-foreground text-sm truncate" title={tmpl.name}>
                        {tmpl.name}
                      </h3>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground -mr-1"
                          >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setPreviewTemplate(tmpl)} className="gap-2">
                            <Eye className="h-4 w-4" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => navigate(`/app/templates/${tmpl.id}/edit`)}
                            className="gap-2"
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(tmpl)} className="gap-2">
                            <Copy className="h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          {!tmpl.isGallery && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeletingTemplate(tmpl)}
                                className="gap-2 text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {cat && (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {cat.name}
                        </span>
                      )}
                      <span className="rounded bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground uppercase">
                        {tmpl.builderType}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-muted-foreground pt-2 border-t border-border/50 flex items-center justify-between">
                    <span>Updated {new Date(tmpl.updatedAt).toLocaleDateString()}</span>
                    <button
                      type="button"
                      onClick={() => handleDuplicate(tmpl)}
                      className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                    >
                      <Copy className="h-3 w-3" />
                      Clone
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.pages > 1 && (
        <div className="flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
          <span>
            Page {meta.page} of {meta.pages} ({meta.total} total)
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page >= meta.pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Template Preview Modal */}
      {previewTemplate && (
        <TemplatePreviewDialog
          template={previewTemplate}
          open={!!previewTemplate}
          onOpenChange={(open) => !open && setPreviewTemplate(null)}
          onEdit={() => {
            navigate(`/app/templates/${previewTemplate.id}/edit`);
            setPreviewTemplate(null);
          }}
          onDuplicate={() => {
            handleDuplicate(previewTemplate);
            setPreviewTemplate(null);
          }}
        />
      )}

      {/* Category Management Modal */}
      <CategoriesDialog
        open={categoriesOpen}
        onOpenChange={setCategoriesOpen}
        categories={categories}
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deletingTemplate} onOpenChange={(open) => !open && setDeletingTemplate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Email Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete template{' '}
              <strong className="text-foreground">{deletingTemplate?.name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeletingTemplate(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TemplatePreviewDialog({
  template,
  open,
  onOpenChange,
  onEdit,
  onDuplicate,
}: {
  template: Template;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onDuplicate: () => void;
}) {
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5 bg-card">
          <div className="space-y-0.5">
            <h3 className="font-semibold text-foreground text-base">{template.name}</h3>
            <p className="text-xs text-muted-foreground">
              Interactive responsive preview
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Viewport switcher */}
            <div className="flex rounded-md border border-border bg-muted/40 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setViewport('desktop')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-sm font-medium transition-all ${
                  viewport === 'desktop'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Monitor className="h-3.5 w-3.5" />
                Desktop
              </button>
              <button
                type="button"
                onClick={() => setViewport('mobile')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-sm font-medium transition-all ${
                  viewport === 'mobile'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" />
                Mobile
              </button>
            </div>

            <Button variant="outline" size="sm" onClick={onDuplicate} className="gap-1.5 text-xs">
              <Copy className="h-3.5 w-3.5" />
              Duplicate
            </Button>
            <Button size="sm" onClick={onEdit} className="gap-1.5 text-xs">
              <Pencil className="h-3.5 w-3.5" />
              Edit Template
            </Button>
          </div>
        </div>

        {/* Viewport Frame */}
        <div className="flex-1 bg-muted/30 p-6 overflow-y-auto flex items-center justify-center">
          <div
            className={`transition-all duration-200 bg-white rounded-lg shadow-md border border-border/70 overflow-hidden ${
              viewport === 'desktop' ? 'w-full max-w-[680px] h-[600px]' : 'w-[375px] h-[620px]'
            }`}
          >
            {template.renderedHtml ? (
              <iframe
                srcDoc={template.renderedHtml}
                title="Preview"
                className="w-full h-full border-0"
                sandbox="allow-same-origin allow-scripts"
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                <FileText className="h-10 w-10 stroke-1 mb-2 opacity-50" />
                <p className="text-sm">This template does not have any rendered HTML yet.</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CategoriesDialog({
  open,
  onOpenChange,
  categories,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: TemplateCategory[];
}) {
  const [name, setName] = useState('');
  const createMutation = useCreateCategory();
  const deleteMutation = useDeleteCategory();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await createMutation.mutateAsync({ name: name.trim() });
      toast.success('Category added');
      setName('');
    } catch (err) {
      toast.error(normalizeAxiosError(err).message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Category deleted');
    } catch (err) {
      toast.error(normalizeAxiosError(err).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Template Categories</DialogTitle>
          <DialogDescription>
            Organize email templates into clean folders and classifications.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreate} className="flex gap-2 pt-2">
          <Input
            placeholder="New category name (e.g. Onboarding, Promos)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={createMutation.isPending || !name.trim()}>
            {createMutation.isPending ? 'Adding...' : 'Add'}
          </Button>
        </form>

        <div className="space-y-1.5 max-h-60 overflow-y-auto py-2">
          {categories.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No categories yet.</p>
          ) : (
            categories.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-md border border-border bg-muted/20 px-3 py-2 text-xs"
              >
                <span className="font-medium text-foreground">{c.name}</span>
                {c.tenantId !== null && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(c.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
