/** Shared, statically discoverable Tailwind utilities. Marker classes are retained only for focus/navigation hooks. */
const button = "inline-flex! min-h-control! items-center! justify-center! gap-2! rounded-lg! border! border-line! bg-white! px-4! py-2! text-sm! text-ink! transition-colors! hover:border-brand! hover:bg-brand-soft! disabled:cursor-not-allowed! disabled:opacity-50!";
const primary = "border-brand! bg-brand! text-white! shadow-sm! hover:bg-brand-hover!";
const input = "min-h-control! w-full! rounded-lg! border! border-line! bg-white! px-3! py-2! text-sm! text-ink! outline-none! placeholder:text-slate-400! focus:border-brand! focus:ring-3! focus:ring-brand-soft! disabled:bg-slate-50! disabled:text-slate-400!";
const card = "rounded-2xl! border! border-line! bg-white! shadow-[0_4px_20px_#23375003]!";
const modal = "flex! max-h-[calc(100dvh-48px)]! w-full! max-w-3xl! flex-col! overflow-hidden! rounded-2xl! border-0! bg-white! shadow-2xl! max-sm:max-h-[calc(100dvh-16px)]! [&_form]:flex! [&_form]:min-h-0! [&_form]:flex-1! [&_form]:flex-col!";
const overlay = "fixed! inset-0! z-1000! flex! items-start! justify-center! overflow-y-auto! bg-slate-900/35! p-6! backdrop-blur-sm! max-sm:p-2!";
const grid = "grid! grid-cols-2! gap-x-7! gap-y-5! max-sm:grid-cols-1!";
const status = "inline-flex! items-center! gap-1.5! rounded-md! px-2.5! py-1! text-xs! [&>span]:size-1.5! [&>span]:rounded-full! [&>span]:bg-current!";
const UI: Record<string, string> = {
  'form-control': input,
  'app-shell': "flex! h-dvh! overflow-hidden! bg-canvas! font-sans! text-ink!",
  'app-main': "flex! min-w-0! flex-1! flex-col!",
  'app-content': "min-h-0! flex-1! overflow-auto! p-page!",
  'skip-link': "fixed! -top-24! left-4! z-[2000]! rounded-lg! bg-white! px-5! py-3! text-brand! focus:top-3!",
  'topbar-root': "relative! z-30! flex! h-[82px]! shrink-0! items-center! gap-5! border-b! border-line! bg-white! px-page! max-md:h-[68px]! max-md:gap-3!",
  'mobile-menu': '[&]:hidden! [&]:max-md:flex!',
  'shell-icon-button': "inline-flex! size-10! shrink-0! items-center! justify-center! rounded-full! border-0! bg-slate-50! text-slate-500! transition-colors! hover:bg-brand-soft! hover:text-brand!",
  'shell-breadcrumb': "flex! min-w-0! items-center! gap-3! text-xs! text-muted! [&>strong]:truncate! [&>strong]:text-slate-600! max-md:hidden! [&>span]:max-lg:hidden! [&>svg]:max-lg:hidden!",
  'workspace-search': "relative! ml-auto! flex! w-80! items-center! gap-2.5! rounded-full! bg-slate-50! px-4! text-slate-400! focus-within:ring-2! focus-within:ring-brand-soft! max-md:w-auto! max-md:flex-1! [&>input]:h-10! [&>input]:min-w-0! [&>input]:w-full! [&>input]:border-0! [&>input]:bg-transparent! [&>input]:text-xs! [&>input]:text-ink! [&>input]:outline-none! [&>kbd]:whitespace-nowrap! [&>kbd]:rounded! [&>kbd]:border! [&>kbd]:border-line! [&>kbd]:bg-white! [&>kbd]:px-1! [&>kbd]:text-[9px]! [&>kbd]:max-md:hidden!",
  'workspace-search-results': "absolute! top-[calc(100%+10px)]! right-0! w-[340px]! max-w-[calc(100vw-32px)]! rounded-2xl! border! border-line! bg-white! p-3! shadow-xl! [&>a]:flex! [&>a]:items-center! [&>a]:gap-2.5! [&>a]:rounded-lg! [&>a]:px-3! [&>a]:py-2.5! [&>a]:text-sm! [&>a:hover]:bg-brand-soft! [&>a:hover]:text-brand! [&>a>svg:last-child]:ml-auto! [&>p]:p-3! [&>p]:text-sm!",
  'ui-eyebrow': "text-[10px]! tracking-widest! text-muted! uppercase!",
  'page-heading': "mb-7! flex! items-center! gap-4! [&_h1]:my-1.5! [&_h1]:text-3xl! [&_h1]:leading-tight! [&_h1]:tracking-tight! [&_p]:max-w-xl! [&_p]:text-sm! [&_p]:text-muted! max-sm:gap-3! [&_h1]:max-sm:text-2xl!",
  'page-title-mark': "grid! size-15! shrink-0! place-items-center! rounded-2xl! border! border-brand/10! bg-brand-soft! text-brand! max-sm:size-12!",
  'ui-button': button,
  'ui-error': "mb-5! flex! items-center! justify-between! gap-3! rounded-xl! border! border-rose-200! bg-rose-50! px-5! py-4! text-sm! text-rose-800!",
  'sidebar-root': "flex! h-dvh! w-[248px]! shrink-0! flex-col! border-r! border-line! bg-white! text-slate-500! transition-[width]!",
  'sidebar-desktop': "max-md:hidden!",
  'sidebar-drawer-content': "max-w-[min(300px,88vw)]!",
  'sidebar-brand': "flex! h-[82px]! shrink-0! items-center! gap-2.5! border-b! border-line! px-5! py-4!",
  'sidebar-brand-mark': "grid! size-[38px]! shrink-0! place-items-center! rounded-xl! border! border-brand/10! bg-brand-soft! text-brand!",
  'sidebar-brand-copy': "min-w-0! [&>strong]:block! [&>strong]:text-lg! [&>strong]:tracking-tight! [&>strong>span]:ml-1! [&>strong>span]:text-brand! [&>small]:text-[7px]! [&>small]:tracking-widest! [&>small]:text-muted!",
  'sidebar-toggle': "ml-auto! grid! h-8! w-7! shrink-0! place-items-center! rounded-md! border-0! bg-transparent! text-slate-400! hover:bg-slate-50! hover:text-brand!",
  'sidebar-nav': "flex-1! overflow-x-hidden! overflow-y-auto! px-3.5! py-5! [scrollbar-width:thin]!",
  'sidebar-section-label': "block! px-3! pb-3! text-[9px]! tracking-widest! text-muted! uppercase!",
  'sidebar-nav-link': "mb-1! flex! min-h-10! items-center! gap-3! rounded-lg! px-3! py-2.5! text-sm! text-muted! no-underline! hover:bg-slate-50! hover:text-brand!",
  'sidebar-group': "mt-3.5!",
  'sidebar-group-btn': "mb-1! flex! min-h-10! w-full! items-center! gap-3! rounded-lg! border-0! bg-transparent! px-3! py-2.5! text-left! text-sm! text-muted! hover:bg-slate-50! hover:text-brand! [&>span]:flex-1! [&>svg]:shrink-0! [&>svg:first-child]:size-[19px]! [&>svg:nth-child(3)]:size-3!",
  'sidebar-children': "mt-1! mr-0! mb-2! ml-6! border-l! border-slate-100! pl-1.5!",
  'sidebar-child': "my-0.5! flex! items-center! gap-2! rounded-lg! px-3! py-2! text-sm! text-muted! no-underline! hover:bg-slate-50! hover:text-brand!",
  'sidebar-child-dot': "size-[3px]! shrink-0! rounded-full! bg-current! opacity-50!",
  'sidebar-flyout': "z-50! w-[248px]! max-w-[calc(100vw-110px)]! rounded-xl! border! border-line! bg-white! p-3! shadow-xl! outline-none!",
  'sidebar-flyout-title': "mb-2! border-b! border-line! px-3! py-3! text-sm! text-ink!",
  'sidebar-collapsed-group': "[&>svg]:size-[19px]!",
  'sidebar-footer': "shrink-0! border-t! border-line! p-4!",
  'sidebar-user-card': "flex! items-center! gap-2.5! rounded-xl! border! border-line! bg-slate-50! p-2.5!",
  'sidebar-avatar': "grid! size-9! shrink-0! place-items-center! rounded-full! bg-brand-soft! text-xs! text-brand!",
  'sidebar-user-info': "min-w-0! flex-1! [&>strong]:block! [&>strong]:truncate! [&>strong]:text-xs! [&>small]:block! [&>small]:truncate! [&>small]:text-[10px]! [&>small]:text-muted!",
  'sidebar-logout-btn': "grid! h-8! w-7! shrink-0! place-items-center! rounded-lg! border-0! bg-transparent! text-slate-400! hover:bg-rose-50! hover:text-rose-600!",
  'rotated': "rotate-180!",
  'appearance-root': "relative!",
  'appearance-panel': "absolute! top-[calc(100%+12px)]! right-0! w-80! max-w-[calc(100vw-32px)]! rounded-2xl! border! border-line! bg-white! p-6! shadow-xl! [&_fieldset]:my-5! [&_legend]:mb-2.5! [&_legend]:text-xs! [&_legend]:text-muted!",
  'appearance-heading': "flex! items-start! justify-between! gap-3! [&_strong]:text-lg! [&_p]:mt-1! [&_p]:text-xs! [&_p]:text-muted!",
  'appearance-presets': "grid! grid-cols-4! gap-2!",
  'appearance-swatch': "grid! justify-items-center! gap-2! rounded-lg! border! border-line! bg-white! px-1! py-2! text-xs! text-muted! aria-pressed:border-brand! aria-pressed:bg-brand-soft! aria-pressed:text-brand! [&>span]:grid! [&>span]:size-7! [&>span]:place-items-center! [&>span]:rounded-full! [&>span]:text-white!",
  'appearance-segments': "flex! gap-1! rounded-xl! bg-slate-100! p-1! [&>button]:flex-1! [&>button]:rounded-lg! [&>button]:border-0! [&>button]:bg-transparent! [&>button]:p-2! [&>button]:text-xs! [&>button]:text-muted! [&>button[aria-pressed=true]]:bg-white! [&>button[aria-pressed=true]]:text-brand! [&>button[aria-pressed=true]]:shadow-sm!",
  'appearance-reset': "flex! items-center! gap-2! border-0! bg-transparent! py-1! text-xs! text-muted! hover:text-brand!",
  'appearance-note': "mt-4! border-t! border-line! pt-3! text-xs! text-muted!",
  'dashboard-welcome': "mb-6! flex! items-center! justify-between! gap-6! overflow-hidden! rounded-2xl! border! border-line! bg-linear-to-r! from-white! to-brand-soft! p-8! [&_h1]:my-2! [&_h1]:text-3xl! [&_h1]:leading-tight! [&_h1]:tracking-tight! [&_p]:text-sm! [&_p]:text-muted! max-lg:flex-col! max-lg:items-start! max-sm:p-6! [&_h1]:max-sm:text-2xl!",
  'dashboard-welcome-actions': "flex! shrink-0! flex-wrap! gap-2.5!",
  'dashboard-stats': "mb-7! grid! grid-cols-4! gap-4! max-lg:grid-cols-2! max-sm:gap-3!",
  'stat-card': `${card} p-6! max-sm:p-4! [&>strong]:my-3! [&>strong]:block! [&>strong]:text-3xl! [&>strong]:leading-none! [&>p]:text-xs! [&>p]:text-muted!`,
  'stat-top': "flex! items-center! justify-between! gap-2! text-xs! text-muted!",
  'stat-icon': "grid! size-9! shrink-0! place-items-center! rounded-xl!",
  'dashboard-layout': "grid! grid-cols-[minmax(0,1fr)_260px]! items-start! gap-6! max-xl:grid-cols-1!",
  'dashboard-aside': "grid! gap-5! max-xl:grid-cols-2! max-md:grid-cols-1!",
  'dashboard-work': "min-w-0!",
  'dashboard-section-heading': "mb-4! flex! flex-wrap! items-center! justify-between! gap-4! [&_h2]:mb-1! [&_h2]:text-lg! [&_h2]:tracking-tight! [&_p]:text-xs! [&_p]:text-muted!",
  'task-filters': "flex! max-w-full! gap-1! overflow-x-auto! rounded-lg! border! border-line! bg-white! p-1! [&>button]:whitespace-nowrap! [&>button]:rounded-md! [&>button]:border-0! [&>button]:bg-transparent! [&>button]:px-3! [&>button]:py-2! [&>button]:text-xs! [&>button]:text-muted! [&>button[aria-pressed=true]]:bg-brand-soft! [&>button[aria-pressed=true]]:text-brand!",
  'ticket-number': "text-brand!",
  'task-status': status,
  'workload-card': `${card} p-6! [&>h2]:text-lg! [&>p]:mt-1! [&>p]:text-xs! [&>p]:text-muted! [&>progress]:block! [&>progress]:h-2! [&>progress]:w-full! [&>progress]:overflow-hidden! [&>progress]:rounded! [&>progress]:accent-brand! [&>progress::-webkit-progress-bar]:bg-slate-100! [&>progress::-webkit-progress-value]:rounded! [&>progress::-webkit-progress-value]:bg-brand!`,
  'workload-value': "mt-6! mb-2! flex! items-baseline! gap-1! text-brand! [&>strong]:text-4xl! [&>strong]:tracking-tight! [&>span]:text-lg! [&>span]:text-muted!",
  'workload-breakdown': "mt-5! grid! gap-3! border-t! border-line! pt-5! [&>div]:flex! [&>div]:items-center! [&>div]:gap-2! [&>div]:text-xs! [&>div]:text-muted! [&_strong]:ml-auto! [&_strong]:text-slate-600! [&_i]:size-1.5! [&_i]:rounded-full! [&_i]:bg-amber-400! [&>div:nth-child(2)_i]:bg-blue-400! [&>div:nth-child(3)_i]:bg-emerald-400!",
  'shortcut-card': `${card} p-6! [&>h2]:text-lg! [&>p]:mt-1! [&>p]:text-xs! [&>p]:text-muted! [&>a]:flex! [&>a]:items-center! [&>a]:justify-between! [&>a]:border-b! [&>a]:border-slate-100! [&>a]:py-3! [&>a]:text-sm! [&>a]:text-muted! [&>a:last-child]:border-0! [&>a:hover]:text-brand!`,
  'dashboard-footer': "mt-6! flex! justify-between! gap-3! text-xs! text-muted! max-sm:flex-col! [&>span:first-child]:flex! [&>span:first-child]:items-center! [&>span:first-child]:gap-2!",
  'dashboard-footer-dot': "size-1.5! rounded-full! bg-green-600!",
  'refresh-spinning': "animate-spin! motion-reduce:animate-none!",
  'session-loading': "grid! min-h-dvh! place-items-center! bg-canvas! text-sm! text-muted!",
  'login-page': "grid! min-h-dvh! grid-cols-2! bg-white! max-md:block!",
  'login-story': "relative! flex! min-h-dvh! flex-col! overflow-hidden! bg-[radial-gradient(ellipse_at_0%_100%,#244784,transparent_65%)]! bg-sidebar! p-[clamp(32px,5vw,76px)]! text-white! max-md:hidden!",
  'login-brand': "flex! items-center! gap-3! [&>span]:grid! [&>span]:size-11! [&>span]:place-items-center! [&>span]:rounded-xl! [&>span]:bg-brand! [&>strong]:text-xl! [&>strong]:tracking-tight! [&_em]:text-blue-200! [&_em]:not-italic!",
  'login-story-content': "relative! z-1! my-auto! py-20! [&>h1]:mb-6! [&>h1]:text-[clamp(34px,3.8vw,56px)]! [&>h1]:leading-[1.12]! [&>h1]:tracking-tight! [&>p]:max-w-sm! [&>p]:text-sm! [&>p]:leading-8! [&>p]:text-blue-100/80!",
  'login-story-tag': "mb-6! text-[10px]! tracking-widest! text-blue-200!",
  'login-features': "mt-9! grid! gap-4! text-sm! text-blue-100! [&>span]:flex! [&>span]:items-center! [&>span]:gap-3! [&_svg]:text-blue-300!",
  'login-story-footer': "text-xs! text-blue-200/70!",
  'login-form-side': "relative! flex! min-h-dvh! flex-col! items-center! justify-center! px-10! py-12! max-md:px-7!",
  'login-card': "w-full! max-w-[370px]! [&>h2]:mt-3! [&>h2]:mb-2! [&>h2]:text-3xl! [&>h2]:tracking-tight!",
  'login-mobile-brand': "mb-11! hidden! items-center! gap-2.5! text-lg! text-brand! max-md:flex!",
  'login-intro': "mb-8! text-sm! leading-7! text-muted!",
  'login-field': "mb-5! [&>label]:mb-2! [&>label]:block! [&>label]:text-xs! [&>label]:text-muted! [&_input]:h-12! [&_input]:w-full! [&_input]:rounded-lg! [&_input]:border! [&_input]:border-line! [&_input]:bg-white! [&_input]:px-3.5! [&_input]:text-sm! [&_input]:outline-none! [&_input:focus]:border-brand! [&_input:focus]:ring-3! [&_input:focus]:ring-brand-soft!",
  'login-password-wrap': "relative! [&>input]:pr-12! [&>button]:absolute! [&>button]:top-1.5! [&>button]:right-1.5! [&>button]:grid! [&>button]:size-9! [&>button]:place-items-center! [&>button]:rounded-md! [&>button]:border-0! [&>button]:bg-transparent! [&>button]:text-muted!",
  'login-submit': `${button}  ${primary} mt-7! h-12! w-full!`,
  'login-help': "mt-6! text-center! text-xs! leading-7! text-muted!",
  'login-error': "rounded-lg! bg-rose-50! px-3! py-2.5! text-sm! text-rose-700!",
  'login-copyright': "absolute! bottom-7! text-[10px]! text-muted!",
  'data-table-card': `${card} flex! min-h-80! flex-col! overflow-hidden! font-sans!`,
  'table-toolbar': "flex! flex-wrap! items-center! justify-between! gap-4! border-b! border-line! px-5! py-5!",
  'table-title-group': "flex! min-w-0! flex-1! flex-wrap! items-center! gap-2.5! [&>p]:text-base! [&>div]:ml-auto! max-sm:w-full! [&>div]:max-sm:ml-0! [&>div]:max-sm:w-full!",
  'table-record-count': "rounded! bg-slate-50! px-2! py-1! text-[10px]! text-muted!",
  'ct-table': "w-full! border-collapse!",
  'ct-th': "sticky! top-0! z-0! border-b! border-line! bg-slate-50/70! px-5! py-3.5! text-left! text-xs! tracking-wide! text-muted! uppercase! whitespace-nowrap!",
  'ct-td': "border-t! border-slate-100! px-5! py-row! align-middle! text-sm! whitespace-nowrap! text-slate-600!",
  'ct-tr': "hover:bg-slate-50!",
  'ct-actions-btn': "mr-1! inline-flex! size-8! items-center! justify-center! rounded-lg! border! border-line! bg-white! text-slate-400! transition-colors! hover:border-brand-soft! hover:bg-brand-soft! hover:text-brand!",
  'ct-page-btn': "inline-flex! h-7! min-w-7! items-center! justify-center! rounded-md! border! border-transparent! bg-transparent! px-1.5! text-xs! text-muted! hover:bg-slate-50! disabled:cursor-not-allowed! disabled:opacity-30!",
  'ct-search': `${input} h-9! min-h-9! w-[220px]! max-w-full! bg-slate-50/50! pl-8! text-xs! max-sm:w-full!`,
  'ct-size-select': "rounded-md! border! border-line! bg-white! px-2! py-1! text-xs! text-muted!",
  'workspace-modal': modal,
  'workspace-modal-overlay': overlay,
  'workspace-form-grid': grid,
  'workspace-filterbar': `${card} mb-5! flex! flex-wrap! items-end! justify-between! gap-4! p-5! [&_label]:text-xs! [&_label]:text-muted! [&>div]:max-w-full!`,
  'role-workspace': "font-normal! [&_table]:w-full! [&_table]:border-collapse! [&_th]:bg-slate-50! [&_th]:px-3.5! [&_th]:py-row! [&_th]:text-xs! [&_th]:tracking-wide! [&_th]:text-muted! [&_th]:uppercase! [&_td]:border-b! [&_td]:border-slate-100! [&_td]:px-3.5! [&_td]:py-row! [&_td]:text-sm! [&_tbody_tr:hover]:bg-brand-soft! [&_button]:min-h-9! [&_button]:rounded-lg! [&_[role=tab]]:min-h-11! [&_[role=tab][data-selected]]:bg-brand-soft! [&_[role=tab][data-selected]]:text-brand!",
  'role-panel': `${card} items-stretch! p-6! max-sm:p-4!`,
  'role-panel-heading': "mb-4! w-full! text-lg! tracking-tight! text-ink!",
  'role-panel-caption': "-mt-2! mb-4! text-xs! text-muted!",
  'module-columns': "flex! items-start! gap-6! max-lg:flex-col! max-lg:items-stretch!",
  'module-form-panel': "w-[340px]! max-w-full! shrink-0! max-lg:w-full!",
  'module-list-panel': `${card} min-w-0! flex-1! overflow-hidden!`,
  'module-tab-strip': "mb-4! max-w-full! overflow-x-auto! rounded-xl! border! border-line! bg-white! p-1.5! [&_button]:flex-1! [&_button]:justify-center! [&_button]:border-0! [&_button]:bg-transparent! [&_button]:px-4! [&_button]:py-2.5! [&_button[aria-selected=true]]:bg-brand-soft! [&_button[aria-selected=true]]:text-brand! [&_button]:max-sm:shrink-0! [&_button]:max-sm:whitespace-nowrap!",
  'legacy-data-table': "overflow-hidden! rounded-xl! border! border-line! [&_table]:w-full! [&_table]:border-collapse! [&_th]:bg-slate-50! [&_th]:px-3.5! [&_th]:py-row! [&_th]:text-xs! [&_th]:text-muted! [&_td]:px-3.5! [&_td]:py-row! [&_td]:text-sm!",
  'query-error-notice': "mb-5! flex! flex-wrap! items-center! gap-3! rounded-xl! border! border-amber-200! bg-amber-50! px-5! py-4! text-amber-800! [&>svg]:shrink-0! [&>div]:flex-1! [&_strong]:text-sm! [&_p]:mt-1! [&_p]:text-xs!",
  'workspace-error-state': "mx-auto! flex! max-w-xl! flex-col! items-center! px-6! py-20! text-center! [&>span]:mb-6! [&>span]:grid! [&>span]:size-18! [&>span]:place-items-center! [&>span]:rounded-2xl! [&>span]:bg-rose-50! [&>span]:text-rose-600! [&>h2]:mb-3! [&>h2]:text-2xl! [&>p]:mb-7! [&>p]:text-sm! [&>p]:leading-8! [&>p]:text-muted! [&>div]:flex! [&>div]:flex-wrap! [&>div]:justify-center! [&>div]:gap-3!",
  'cv-input-field': "flex! w-full! flex-col! gap-2!",
  'cv-input-label': "text-sm! text-ink!",
  'cv-required': "ml-1! text-rose-600!",
  'cv-filter-input': input,
  'cv-input-error': "text-xs! text-rose-600!",
  'um-page': "min-w-0!",
  'um-layout': "grid! min-w-0! grid-cols-[minmax(300px,350px)_minmax(0,1fr)]! items-start! gap-6! max-xl:grid-cols-1!",
  'um-card': `${card} min-w-0! overflow-hidden!`,
  'um-card-head': "border-b! border-line! bg-white! px-5! py-5! [&>p:first-child]:text-lg! [&>p:last-child]:mt-1! [&>p:last-child]:text-xs! [&>p:last-child]:text-muted!",
  'um-card-body': "p-5!",
  'um-fields': "flex! w-full! flex-col! items-stretch! gap-4!",
  'um-field-row': "grid! min-w-0! w-full! grid-cols-[110px_minmax(0,1fr)]! items-center! gap-x-3! gap-y-1.5! [&>label]:col-start-1! [&>label]:row-start-1! [&>div]:col-start-2! [&>div]:row-start-1! [&>div]:min-w-0! max-sm:grid-cols-[100px_minmax(0,1fr)]! max-sm:gap-x-2!",
  'um-field-label': "block! text-sm! leading-5! text-muted!",
  'um-field-error': "col-start-2! text-xs! text-rose-600!",
  'um-table-wrap': "min-w-0!",
  'csm-filters': "flex! flex-wrap! items-end! gap-2!",
  'cd-overlay': "fixed! inset-0! z-1000! flex! items-center! justify-center! bg-slate-900/35! p-4! backdrop-blur-sm!",
  'cd-box': "w-full! max-w-sm! rounded-2xl! bg-white! p-7! shadow-2xl!",
  'cd-icon': "mb-4! grid! size-11! place-items-center! rounded-full! bg-rose-50! text-rose-600!",
  'cd-title': "mb-2! text-lg! tracking-tight!",
  'cd-message': "mb-6! text-sm! leading-7! text-muted!",
  'cd-actions': "flex! justify-end! gap-2.5!",
  'cd-btn-cancel': button,
  'cd-btn-confirm': `${button} border-rose-600! bg-rose-600! text-white! hover:bg-rose-700!`,
  'nf-wrap': "flex! min-h-[65vh]! flex-col! items-center! justify-center! gap-4! p-6! text-center!",
  'nf-icon': "mb-2! grid! size-18! place-items-center! rounded-2xl! bg-rose-50! text-rose-600!",
  'nf-code': "text-5xl! tracking-tight!",
  'nf-title': "text-xl!",
  'nf-sub': "max-w-sm! text-sm! leading-7! text-muted!",
  'nf-btn': `${button}  ${primary} mt-3!`
};
function formUtilities(token: string): string {
  if (/-modal-overlay$/.test(token) || token === 'cs-overlay') return overlay;
  if (/-modal-box$/.test(token)) return modal;
  if (/-modal-head$/.test(token) || token === 'callstatus-head') return "flex! shrink-0! items-center! justify-between! gap-4! border-b! border-line! bg-slate-50/60! px-7! py-6! max-sm:px-5!";
  if (/-modal-title$/.test(token)) return "text-2xl! tracking-tight! text-ink!";
  if (/-modal-sub$/.test(token)) return "mt-1! text-xs! text-muted!";
  if (/-modal-body$/.test(token)) return "min-h-0! flex-1! overflow-y-auto! p-7! max-sm:p-5!";
  if (/-modal-footer$/.test(token) || token === 'callstatus-modal-footer') return "flex! shrink-0! justify-end! gap-2.5! border-t! border-line! bg-white! px-7! py-5! max-sm:px-5!";
  if (/-section-label$/.test(token)) return "mt-6! mb-4! border-b! border-line! pb-3! text-xs! tracking-widest! text-muted! uppercase! first:mt-0!";
  if (/-grid(?:-2)?$/.test(token) && !/media/.test(token)) return grid;
  if (/-field-row-full$/.test(token)) return "col-span-full!";
  if (/-field-row$/.test(token)) return "flex! min-w-0! flex-col! gap-2!";
  if (/-field-label$/.test(token) || /-filter-label$/.test(token)) return "text-sm! text-muted!";
  if (/-field-error$/.test(token)) return "mt-1! text-xs! text-rose-600!";
  if (/-btn-primary$/.test(token) || token === 'btn-primary') return `${button}  ${primary}`;
  if (/-btn-secondary$/.test(token) || token === 'btn-secondary') return button;
  if (/-close-btn$/.test(token)) return "grid! size-8! place-items-center! rounded-lg! border! border-line! bg-white! text-muted! hover:bg-rose-50! hover:text-rose-600!";
  if (/-filter-field$/.test(token)) return "flex! min-w-0! flex-col! gap-2!";
  if (/-back-btn$/.test(token)) return button;
  if (/-detail-wrap$/.test(token) || token === 'cs-wrap') return `${card} overflow-hidden!`;
  if (/-detail-head$/.test(token) || token === 'cs-head') return "flex! flex-wrap! items-center! justify-between! gap-4! border-b! border-line! bg-white! px-6! py-5!";
  if (/-detail-title$/.test(token) || token === 'cs-title') return "text-xl! tracking-tight!";
  if (/-detail-sub$/.test(token) || token === 'cs-sub') return "mt-1! text-sm! text-muted!";
  if (/-detail-body$/.test(token) || token === 'cs-body') return "p-6!";
  if (/-detail-row$/.test(token) || token === 'cs-row') return "flex! flex-col! items-start! gap-2!";
  if (/-detail-label$/.test(token) || token === 'cs-label') return "text-xs! text-muted!";
  if (/-detail-val$/.test(token) || token === 'cs-val') return "text-sm! break-words! text-ink!";
  if (token === 'cs-head-actions') return "flex! flex-wrap! items-center! gap-2!";
  if (token === 'cs-summary-grid' || token === 'cb-detail-grid') return `${grid} rounded-xl! border! border-line! bg-slate-50! p-5!`;
  if (token === 'cs-history-card') return "rounded-xl! border! border-line! border-l-3! border-l-brand! bg-white! p-5!";
  if (/-media-grid$/.test(token) || token === 'cv-existing-media') return "flex! flex-wrap! gap-3!";
  if (/-media-tile$/.test(token) || token === 'cv-existing-media-item') return "size-20! overflow-hidden! rounded-lg! border! border-line! bg-slate-50! [&_img]:size-full! [&_img]:object-cover! [&_video]:size-full! [&_video]:object-cover!";
  return '';
}
const tones: Record<string, string> = {
  blue: "bg-brand-soft! text-brand!",
  amber: "bg-amber-50! text-amber-700!",
  violet: "bg-violet-50! text-violet-700!",
  green: "bg-emerald-50! text-emerald-700!",
  open: "bg-amber-50! text-amber-700!",
  progress: "bg-blue-50! text-blue-700!",
  complete: "bg-emerald-50! text-emerald-700!",
  cancelled: "bg-rose-50! text-rose-700!",
  neutral: "bg-slate-100! text-slate-500!"
};
/** Returns literal utility sets so Tailwind can scan them at build time; no runtime-generated utility names. */
export function ui(value: string): string {
  const names = value.split(/\s+/).filter(Boolean);
  const classes = names.flatMap(name => {
    const utilities = UI[name] || formUtilities(name);
    return utilities ? [name, utilities] : [name];
  });
  if (names.includes('primary')) classes.push(names.includes('ui-button') ? primary : "text-ink!");
  if (names.includes('active')) classes.push(names.includes('ct-page-btn') ? 'border-brand! bg-brand! text-white!' : 'bg-brand-soft! text-brand!');
  if (names.includes('current-group')) classes.push('text-ink!');
  if (names.includes('sortable')) classes.push("cursor-pointer! select-none! hover:text-brand!");
  if (names.includes('delete')) classes.push('hover:bg-rose-50! hover:text-rose-600!');
  if (names.includes('collapsed')) classes.push("w-[84px]! [&_.sidebar-brand]:h-[82px]! [&_.sidebar-brand]:flex-col! [&_.sidebar-brand]:gap-1! [&_.sidebar-brand]:py-2! [&_.sidebar-brand-mark]:size-7! [&_.sidebar-brand-mark>svg]:size-4! [&_.sidebar-toggle]:h-6! [&_.sidebar-brand]:justify-center! [&_.sidebar-brand]:px-2! [&_.sidebar-toggle]:m-0! [&_.sidebar-brand-copy]:hidden! [&_.sidebar-section-label]:hidden! [&_.sidebar-nav-link>span]:hidden! [&_.sidebar-group-btn>span]:hidden! [&_.sidebar-nav-link]:justify-center! [&_.sidebar-group-btn]:justify-center! [&_.sidebar-user-info]:hidden! [&_.sidebar-avatar]:hidden! [&_.sidebar-user-card]:justify-center!");
  if (names.includes('stat-icon') || names.includes('task-status')) for (const name of names) if (tones[name]) classes.push(tones[name]);
  // A primary button replaces the neutral palette; conflicting utility names
  // must be removed because CSS generation order is independent of class order.
  const resolved = classes.join(' ').split(/\s+/);
  const neutral = new Set(['bg-white!', 'text-ink!', 'border-line!', 'hover:bg-brand-soft!', 'hover:border-brand!']);
  return resolved.filter(name => !(resolved.includes('bg-brand!') && resolved.includes('text-white!') && neutral.has(name)) && !(names.includes('collapsed') && name === 'w-[248px]!')).join(' ');
}
