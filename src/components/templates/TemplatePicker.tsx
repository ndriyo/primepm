import { motion } from 'motion/react';
import { Dialog } from '../ui/Dialog';
import { useProjectStore } from '../../store/projectStore';
import { BLANK_TEMPLATE, TEMPLATES, type TemplateDefinition } from '../../templates';
import { ArrowRight } from 'lucide-react';

const accentClasses: Record<string, string> = {
  sky: 'from-sky-100 to-sky-50 ring-sky-300/60 group-hover:ring-sky-400 group-hover:from-sky-200',
  fuchsia: 'from-fuchsia-100 to-fuchsia-50 ring-fuchsia-300/60 group-hover:ring-fuchsia-400 group-hover:from-fuchsia-200',
  amber: 'from-amber-100 to-amber-50 ring-amber-300/60 group-hover:ring-amber-400 group-hover:from-amber-200',
  rose: 'from-rose-100 to-rose-50 ring-rose-300/60 group-hover:ring-rose-400 group-hover:from-rose-200',
  zinc: 'from-zinc-100 to-zinc-50 ring-zinc-300/60 group-hover:ring-zinc-400 group-hover:from-zinc-200',
};

export function TemplatePicker() {
  const open = useProjectStore(s => s.templatePickerOpen);
  const loadProject = useProjectStore(s => s.loadProject);
  const close = () => useProjectStore.getState().setTemplatePickerOpen(false);

  const pick = (tpl: TemplateDefinition) => {
    const start = new Date();
    // snap to next Monday
    const dow = start.getDay();
    const offset = dow === 0 ? 1 : dow === 6 ? 2 : dow === 1 ? 0 : 8 - dow;
    const monday = new Date(start.getFullYear(), start.getMonth(), start.getDate() + offset);
    const data = tpl.build(monday);
    // Preserve the existing project's id + name (so the user's chosen project
    // name is not overwritten by the template default). Start date comes from
    // the template since the user hasn't picked tasks yet.
    const existing = useProjectStore.getState().project;
    loadProject({
      ...data,
      project: { ...data.project, id: existing.id, name: existing.name },
    });
    close();
  };

  return (
    <Dialog open={open} onClose={close} modal className="w-[min(960px,92vw)] p-8">
      <div className="text-center mb-8">
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="text-[28px] font-semibold tracking-tight text-(--color-ink)"
        >
          Start a new project
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="mt-1 text-sm text-(--color-ink-muted)"
        >
          Pick a template — or start from a blank canvas.
        </motion.p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {[...TEMPLATES, BLANK_TEMPLATE].map((tpl, i) => (
          <motion.button
            key={tpl.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.05 + i * 0.04 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => pick(tpl)}
            className="group relative text-left rounded-xl ring-1 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-brand) focus-visible:ring-offset-2"
          >
            <div className={`h-full bg-gradient-to-br p-4 transition-all duration-200 ${accentClasses[tpl.accent] ?? accentClasses.zinc}`}>
              <div className="text-3xl mb-3">{tpl.emoji}</div>
              <div className="font-semibold text-[15px] text-(--color-ink) leading-tight">{tpl.title}</div>
              <div className="mt-1 text-[12px] text-(--color-ink-muted) leading-snug">{tpl.subtitle}</div>
              <div className="mt-3 flex items-center gap-1 text-[11px] font-medium text-(--color-ink-muted) opacity-0 group-hover:opacity-100 transition-opacity">
                Use this <ArrowRight size={11} />
              </div>
            </div>
          </motion.button>
        ))}
      </div>
      <div className="mt-6 text-center text-[12px] text-(--color-ink-subtle)">
        Tip: Press <kbd className="px-1 py-0.5 rounded bg-(--color-surface-2) font-mono text-[11px]">?</kbd> any time to see keyboard shortcuts.
      </div>
    </Dialog>
  );
}
