import type { ReactNode } from 'react';

type PageShellProps = {
  /** Preferred – single sticky chrome (`PageChrome`). */
  header?: ReactNode;
  /** @deprecated Prefer `header={<PageChrome …/>}`. */
  topBar?: ReactNode;
  /** @deprecated Prefer `header={<PageChrome …/>}`. */
  pageHeader?: ReactNode;
  /** @deprecated Prefer `header={<PageChrome …/>}`. */
  toolbar?: ReactNode;
  /** Zone E – contenu. */
  children: ReactNode;
  /** Espace bas pour toast (WCAG 2.4.11). */
  reserveToastSpace?: boolean;
  className?: string;
};

/**
 * Coque de page Industrial Tech – chrome sticky + contenu (DL § 3.1).
 * Zone A (sidebar) et F (toast) restent dans Layout / Toast.
 */
export function PageShell({
  header,
  topBar,
  pageHeader,
  toolbar,
  children,
  reserveToastSpace = true,
  className = ''
}: PageShellProps) {
  return (
    <div className={`fiq-shell flex min-h-0 flex-col ${reserveToastSpace ? 'pb-24' : ''} ${className}`}>
      {header ?? (
        <>
          {topBar}
          {pageHeader}
          {toolbar}
        </>
      )}
      <div className="w-full min-w-0 flex-1 space-y-[26px] px-4 pb-12 pt-6 md:px-8">{children}</div>
    </div>
  );
}

type PageChromeProps = {
  title: string;
  date: string;
  dateLabel?: string;
  titleExtra?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  bell?: ReactNode;
  /** Filters / period chips – soft tools strip (omitted when empty). */
  tools?: ReactNode;
};

/**
 * Chrome sticky unifié – primary row + optional tools strip.
 * Remplace TopBar + PageHeader + PageToolbar.
 */
export function PageChrome({
  title,
  date,
  dateLabel = 'Aujourd’hui',
  titleExtra,
  meta,
  actions,
  bell,
  tools
}: PageChromeProps) {
  return (
    <header className="px-4 pt-7 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <h1 className="text-title text-text truncate min-w-0">{title}</h1>
          {titleExtra}
        </div>
        <div className="relative flex flex-wrap items-center gap-2.5">
          {meta}
          {actions}
          <span className="ml-1 inline-flex items-center gap-1.5 rounded-pill border border-border bg-surface px-3 py-1.5 text-mention text-text-muted">
            <span className="h-[7px] w-[7px] shrink-0 rounded-pill bg-[#10B981] shadow-[0_0_0_3px_#D1FAE5]" aria-hidden="true" />
            {dateLabel} <b className="font-semibold text-text tabular-nums">{date}</b>
          </span>
          {bell}
        </div>
      </div>
      {tools != null && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-card border border-border bg-surface px-2.5 py-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          {tools}
        </div>
      )}
    </header>
  );
}

/** @deprecated Prefer `PageChrome`. */
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
    <PageChrome title={title} titleExtra={titleExtra} dateLabel={dateLabel} date={date} actions={actions} bell={bell} />
  );
}

/** @deprecated Prefer `PageChrome`. */
export function PageHeader({
  mobileTitle,
  context,
  actions
}: {
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

/** @deprecated Prefer `PageChrome` tools row. */
export function PageToolbar({ children, note }: { children: ReactNode; note?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 md:px-6 py-2 bg-surface-muted/70 border-b border-border">
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
    <div className="col-span-12 flex flex-wrap items-baseline gap-2.5">
      <h2 id={id} className="text-section text-text">
        {title}
      </h2>
      {hint && <span className="text-[12.5px] text-text-muted">{hint}</span>}
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
    <Tag className={`bg-surface border border-border rounded-card shadow-card min-w-0 overflow-hidden ${className}`}>
      {hasHead && (
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-2 px-[18px] pt-4 pb-1">
          {title != null &&
            (typeof title === 'string' ? (
              <h3 className="min-w-0 truncate text-sm font-semibold text-text">{title}</h3>
            ) : (
              title
            ))}
          {hint != null && <span className="min-w-0 text-mention text-text-muted">{hint}</span>}
          {actions != null && <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={`min-w-0 ${bodyClassName}`}>{children}</div>
      {footer != null && (
        <div className="flex items-center gap-3 px-4 py-2 border-t border-border-subtle text-mention text-text-muted">{footer}</div>
      )}
    </Tag>
  );
}
