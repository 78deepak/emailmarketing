import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Monitor,
  Smartphone,
  Code2,
  Eye,
  Tag,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

import {
  useTemplate,
  useCreateTemplate,
  useUpdateTemplate,
  useTemplateCategories,
} from '@/features/templates/use-templates';
import { normalizeAxiosError } from '@/lib/api';
import type { BuilderType } from '@/types/templates';

const STARTER_TEMPLATES: Record<string, { name: string; html: string }> = {
  welcome: {
    name: 'Welcome & Onboarding',
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to our community</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f4f6f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #333333; }
    .wrapper { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 40px 30px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px; }
    .content { padding: 36px 30px; line-height: 1.6; font-size: 15px; color: #4b5563; }
    .button-container { text-align: center; margin: 30px 0; }
    .button { background-color: #4f46e5; color: #ffffff !important; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; }
    .footer { background-color: #f9fafb; padding: 24px 30px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6; }
    .footer a { color: #6b7280; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Welcome aboard, {{firstName}}! 🚀</h1>
    </div>
    <div class="content">
      <p>Hi {{firstName}},</p>
      <p>We're thrilled to have you with us. Your account is fully set up and ready to go.</p>
      <p>Here are a few quick tips to get the most out of your experience:</p>
      <ul>
        <li>Import your existing subscriber audience</li>
        <li>Set up your sender domain SPF & DKIM keys</li>
        <li>Launch your first automated welcome workflow</li>
      </ul>
      <div class="button-container">
        <a href="https://example.com/get-started" class="button">Get Started Now</a>
      </div>
      <p>Need any help? Just reply to this email directly.</p>
      <p>Best regards,<br><strong>The {{companyName}} Team</strong></p>
    </div>
    <div class="footer">
      <p>You received this email because you registered on our platform.</p>
      <p><a href="{{unsubscribeUrl}}">Unsubscribe</a> from these updates.</p>
    </div>
  </div>
</body>
</html>`,
  },
  newsletter: {
    name: 'Weekly Newsletter Digest',
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Digest</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; }
    .hero { padding: 32px; border-bottom: 2px solid #6366f1; }
    .hero h2 { margin: 0 0 8px 0; color: #1e293b; font-size: 24px; }
    .badge { display: inline-block; background-color: #e0e7ff; color: #4338ca; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 12px; }
    .article { padding: 24px 32px; border-bottom: 1px solid #f1f5f9; }
    .article h3 { margin: 0 0 8px 0; color: #0f172a; font-size: 18px; }
    .article p { margin: 0; color: #64748b; line-height: 1.5; font-size: 14px; }
    .read-more { display: inline-block; margin-top: 10px; color: #6366f1; text-decoration: none; font-weight: 600; font-size: 13px; }
    .footer { padding: 24px 32px; background: #f8fafc; text-align: center; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="hero">
      <span class="badge">Weekly Edition</span>
      <h2>The Product Dispatch 📰</h2>
      <p style="color: #64748b; margin: 0; font-size: 14px;">Curated news, product updates, and growth stories for {{firstName}}.</p>
    </div>
    <div class="article">
      <h3>1. Boosting Email Deliverability in 2026</h3>
      <p>Learn how modern inbox providers grade your sender reputation and how setting up SPF, DKIM, and DMARC stops delivery failures.</p>
      <a href="https://example.com/article-1" class="read-more">Read full story &rarr;</a>
    </div>
    <div class="article">
      <h3>2. Segmenting Audiences for 4x Higher Engagement</h3>
      <p>Targeted campaigns consistently outperform blanket blasts. Here is how leading teams organize tags and custom lists.</p>
      <a href="https://example.com/article-2" class="read-more">Read guide &rarr;</a>
    </div>
    <div class="footer">
      <p>&copy; 2026 {{companyName}}. All rights reserved.</p>
      <p><a href="{{unsubscribeUrl}}" style="color: #94a3b8;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`,
  },
  promo: {
    name: 'Special Promotion / Discount',
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Special Offer</title>
  <style>
    body { margin: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, sans-serif; color: #f8fafc; }
    .box { max-width: 580px; margin: 40px auto; background-color: #1e293b; border-radius: 12px; text-align: center; padding: 40px 30px; border: 1px solid #334155; }
    .tag { background: #10b981; color: #ffffff; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; display: inline-block; margin-bottom: 20px; }
    h1 { font-size: 32px; margin: 0 0 16px 0; color: #ffffff; }
    p { color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; }
    .code-box { background: #0f172a; border: 2px dashed #475569; padding: 14px; border-radius: 8px; font-family: monospace; font-size: 20px; color: #38bdf8; letter-spacing: 2px; margin-bottom: 24px; }
    .cta { background-color: #3b82f6; color: #ffffff !important; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 700; display: inline-block; font-size: 16px; }
    .foot { margin-top: 32px; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="box">
    <div class="tag">EXCLUSIVE OFFER</div>
    <h1>30% Off Everything This Week</h1>
    <p>Hi {{firstName}}, enjoy an exclusive upgrade discount available only for our loyal subscribers.</p>
    <div class="code-box">VIPSPRING30</div>
    <div>
      <a href="https://example.com/claim" class="cta">Claim Your Discount &rarr;</a>
    </div>
    <div class="foot">
      <p>Offer expires in 48 hours. Terms apply.</p>
      <a href="{{unsubscribeUrl}}" style="color: #64748b;">Unsubscribe</a>
    </div>
  </div>
</body>
</html>`,
  },
};

const MERGE_TAGS = [
  { label: 'First Name', tag: '{{firstName}}' },
  { label: 'Last Name', tag: '{{lastName}}' },
  { label: 'Email', tag: '{{email}}' },
  { label: 'Unsubscribe Link', tag: '{{unsubscribeUrl}}' },
  { label: 'Company Name', tag: '{{companyName}}' },
];

export default function TemplateEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  // Queries
  const { data: existingTemplate, isLoading: isTemplateLoading } = useTemplate(id);
  const { data: rawCategories } = useTemplateCategories();
  const categories = Array.isArray(rawCategories) ? rawCategories : [];

  // Form State
  const [name, setName] = useState('New Template');
  const [categoryId, setCategoryId] = useState<string>('');
  const [builderType, setBuilderType] = useState<BuilderType>('classic');
  const [htmlContent, setHtmlContent] = useState(STARTER_TEMPLATES.welcome.html);
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const createMutation = useCreateTemplate();
  const updateMutation = useUpdateTemplate();

  // Prepopulate if editing
  useEffect(() => {
    if (existingTemplate) {
      setName(existingTemplate.name);
      setCategoryId(existingTemplate.categoryId || '');
      setBuilderType(existingTemplate.builderType || 'classic');
      setHtmlContent(existingTemplate.renderedHtml || '');
    }
  }, [existingTemplate]);

  // Insert merge tag at cursor
  const insertMergeTag = (tag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = htmlContent;
    const updated = current.substring(0, start) + tag + current.substring(end);
    setHtmlContent(updated);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, start + tag.length);
    }, 0);
    toast.success(`Inserted ${tag}`);
  };

  const handleSelectStarter = (key: string) => {
    if (STARTER_TEMPLATES[key]) {
      setHtmlContent(STARTER_TEMPLATES[key].html);
      toast.success(`Loaded "${STARTER_TEMPLATES[key].name}" starter layout`);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Template name is required');
      return;
    }

    try {
      if (isEditing && id) {
        await updateMutation.mutateAsync({
          id,
          payload: {
            name: name.trim(),
            categoryId: categoryId || undefined,
            builderType,
            renderedHtml: htmlContent,
          },
        });
        toast.success('Template updated successfully');
      } else {
        await createMutation.mutateAsync({
          name: name.trim(),
          categoryId: categoryId || undefined,
          builderType,
          renderedHtml: htmlContent,
        });
        toast.success('Template created successfully');
        navigate('/app/templates');
      }
    } catch (err) {
      toast.error(normalizeAxiosError(err).message);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (isEditing && isTemplateLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground animate-pulse text-sm">Loading template...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] -m-4 sm:-m-6">
      {/* Top Bar Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-border bg-card px-4 py-3 gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="h-8 w-8">
            <Link to="/app/templates">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>

          <div className="flex items-center gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Template Name"
              className="h-8 font-semibold text-sm max-w-[240px] sm:max-w-[320px]"
            />
            {existingTemplate?.isGallery && (
              <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 text-[10px]">
                Gallery Starter
              </Badge>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Category Selector */}
          <select
            aria-label="Template Category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">No Category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Builder Type Selector */}
          <select
            aria-label="Builder Type"
            value={builderType}
            onChange={(e) => setBuilderType(e.target.value as BuilderType)}
            className="h-8 rounded-md border border-input bg-background px-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="classic">Classic HTML</option>
            <option value="pro">Pro Builder</option>
          </select>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={isSaving}
            size="sm"
            className="gap-1.5 h-8"
          >
            <Save className="h-3.5 w-3.5" />
            {isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Save Template'}
          </Button>
        </div>
      </div>

      {/* Main Split Layout: Editor on left, Preview on right */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-background">
        {/* Left Panel: HTML Code Editor & Helper Tools */}
        <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-border bg-card/40 overflow-hidden">
          {/* Editor Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between border-b border-border/80 bg-muted/30 px-3 py-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5 font-medium text-muted-foreground">
              <Code2 className="h-4 w-4 text-primary" />
              <span>HTML Source</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Starter layout selector */}
              <select
                aria-label="Load starter layout"
                onChange={(e) => e.target.value && handleSelectStarter(e.target.value)}
                defaultValue=""
                className="h-7 rounded border border-border bg-background px-2 text-[11px] font-medium text-foreground"
              >
                <option value="" disabled>
                  Load Starter Layout...
                </option>
                <option value="welcome">Welcome & Onboarding</option>
                <option value="newsletter">Weekly Digest</option>
                <option value="promo">Special Promotion</option>
              </select>

              {/* Merge Tag Helpers */}
              <div className="hidden sm:flex items-center gap-1">
                <span className="text-[11px] text-muted-foreground mr-1">Insert:</span>
                {MERGE_TAGS.slice(0, 3).map((item) => (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => insertMergeTag(item.tag)}
                    className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono hover:bg-primary/20 hover:text-primary transition-colors"
                  >
                    {item.tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Code Textarea */}
          <div className="flex-1 p-3 overflow-hidden flex flex-col">
            <textarea
              ref={textareaRef}
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              placeholder="Paste or write responsive email HTML here..."
              spellCheck={false}
              className="flex-1 w-full resize-none font-mono text-xs leading-relaxed rounded-md border border-border bg-card p-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
            />

            {/* Quick Merge Tags Bar at bottom */}
            <div className="pt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <Tag className="h-3 w-3 text-primary" />
              <span className="text-[11px] font-medium">Available tags:</span>
              {MERGE_TAGS.map((item) => (
                <button
                  key={item.tag}
                  type="button"
                  onClick={() => insertMergeTag(item.tag)}
                  className="rounded bg-muted/60 border border-border/60 px-1.5 py-0.5 text-[10px] font-mono hover:bg-muted hover:border-primary/40 transition-colors"
                >
                  {item.label} ({item.tag})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel: Live Responsive Preview */}
        <div className="flex-1 flex flex-col bg-muted/20 overflow-hidden">
          {/* Preview Toolbar */}
          <div className="flex items-center justify-between border-b border-border/80 bg-muted/30 px-3 py-2 text-xs">
            <div className="flex items-center gap-1.5 font-medium text-muted-foreground">
              <Eye className="h-4 w-4 text-primary" />
              <span>Live Preview</span>
            </div>

            {/* Viewport switch */}
            <div className="flex rounded-md border border-border bg-card p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setViewport('desktop')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-sm text-xs font-medium transition-all ${
                  viewport === 'desktop'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Monitor className="h-3 w-3" />
                Desktop
              </button>
              <button
                type="button"
                onClick={() => setViewport('mobile')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-sm text-xs font-medium transition-all ${
                  viewport === 'mobile'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Smartphone className="h-3 w-3" />
                Mobile
              </button>
            </div>
          </div>

          {/* Sandboxed Iframe Container */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto flex items-center justify-center bg-slate-900/5 dark:bg-black/30">
            <div
              className={`transition-all duration-200 bg-white rounded-lg shadow-lg border border-border overflow-hidden h-[95%] ${
                viewport === 'desktop' ? 'w-full max-w-[640px]' : 'w-[375px]'
              }`}
            >
              <iframe
                srcDoc={htmlContent}
                title="Live Email Preview"
                className="w-full h-full border-0"
                sandbox="allow-same-origin allow-scripts"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
