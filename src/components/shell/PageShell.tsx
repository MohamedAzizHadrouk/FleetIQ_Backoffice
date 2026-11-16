import type { ReactNode } from 'react';

type PageShellProps = {
  /** Zone B – barre du haut (desktop) : titre, date, cloche, extras. */
  topBar: ReactNode;
  /** Zone C – en-tête de page : contexte + actions. */
  pageHeader?: ReactNode;
  /** Zone D – barre d'outils (optionnelle). */
  toolbar?: ReactNode;
  /** Zone E – contenu. */
  children: ReactNode;
  /** Espace bas pour toast (WCAG 2.4.11). */
  reserveToastSpace?: boolean;
  className?: string;
};

/**
 * Coque de page Industrial Tech – zones B → E (DL § 3.1).
 * Zone A (sidebar) et F (toast) restent dans Layout / Toast.
 */
export function PageShell({
  topBar,
  pageHeader,
  toolbar,
  children,
  reserveToastSpace = true,
  className = ''
}: PageShellProps) {
  return (
    <div className={`fiq-shell flex min-h-0 flex-col ${reserveToastSpace ? 'pb-24' : ''} ${className}`}>
      {topBar}
      {pageHeader}
      {toolbar}
      <div className="flex-1 min-w-0 p-4 md:p-6 max-w-content w-full space-y-6">{children}</div>
    </div>
  );
}

/** Zone B – barre du haut bureau (masquée < 768 px : titre passe en zone C). */
export function TopBar({
  title,
  titleExtra,
  dateLabel = 'Aujourd’hui',
  date,
  actions,
  bell
}: {
  title: string;
  titleExtra?: ReactNode;
  dateLabel?: string;
  date: string;
  actions?: ReactNode;
  bell?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-topbar hidden md:flex h-topbar items-center gap-3 px-6 bg-surface border-b border-border">
      <h1 className="text-title text-text truncate">{title}</h1>
      {titleExtra}
      <div className="flex-1" />
      <span className="inline-flex items-center gap-2 text-small text-text-muted">
        <span className="h-2 w-2 rounded-[1px] bg-success" aria-hidden="true" />
        {dateLabel} <b className="text-text font-semibold">{date}</b>
      </span>
      {actions}
      {bell}
    </header>
  );
}

/** Zone C – en-tête de page. */
export function PageHeader({
  mobileTitle,
  context,
  actions
}: {
  /** Titre affiché sous 768 px (quand TopBar est masquée). */
  mobileTitle?: string;
  context?: ReactNode;
  actions?: ReactNode;
}) {
  if (!mobileTitle && !context && !actions) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 md:px-6 py-3 bg-surface border-b border-border">
      {mobileTitle && <h1 className="md:hidden text-title text-text w-full">{mobileTitle}</h1>}
      {context && (
        <div className="flex-1 basis-80 max-w-[80ch] text-small text-text-muted min-w-0">{context}</div>
      )}
      {actions && <div className="flex flex-wrap gap-2 ml-auto">{actions}</div>}
    </div>
  );
}

/** Zone D – barre d'outils. */
export function PageToolbar({ children, note }: { children: ReactNode; note?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 md:px-6 py-2 bg-surface border-b border-border">
      {children}
      {note && <p className="basis-full text-mention text-text-muted">{note}</p>}
    </div>
  );
}

/** Filet de section (DL § 9.5). */
export function SectionRule({
  id,
  title,
  hint,
  right
}: {
  id?: string;
  title: string;
  hint?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="col-span-12 flex items-baseline gap-3 mt-2 pb-1.5 border-b border-text">
      <h2 id={id} className="text-overline uppercase text-text">
        {title}
      </h2>
      {hint && <span className="text-mention text-text-muted">{hint}</span>}
      {right && <div className="ml-auto">{right}</div>}
    </div>
  );
}

/** Panneau Industrial Tech (DL § 9.7) – en-tête / corps / pied optionnels. */
export function Panel({
  title,
  hint,
  actions,
  footer,
  children,
  className = '',
  bodyClassName = 'p-4',
  as: Tag = 'section'
}: {
  title?: ReactNode;
  hint?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Sans rembourrage si le corps est un tableau pleine largeur. */
  bodyClassName?: string;
  as?: 'section' | 'div' | 'article';
}) {
  const hasHead = title != null || hint != null || actions != null;
  return (
    <Tag className={`bg-surface border border-border rounded-card min-w-0 ${className}`}>
      {hasHead && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 border-b border-border">
          {title != null && (typeof title === 'string' ? <h3 className="text-section text-text">{title}</h3> : title)}
          {hint != null && <span className="text-mention text-text-muted">{hint}</span>}
          {actions != null && <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
      {footer != null && (
        <div className="flex items-center gap-3 px-4 py-2 border-t border-border-subtle text-mention text-text-muted">{footer}</div>
      )}
    </Tag>
  );
}
