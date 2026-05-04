import { useHotkeys } from 'react-hotkeys-hook';
import { useProjectStore } from '../../store/projectStore';

export function useGlobalShortcuts() {
  const undo = useProjectStore(s => s.undo);
  const redo = useProjectStore(s => s.redo);
  const setCommandOpen = useProjectStore(s => s.setCommandOpen);
  const setCheatsheetOpen = useProjectStore(s => s.setCheatsheetOpen);
  const toggleCriticalPath = useProjectStore(s => s.toggleCriticalPath);
  const setZoom = useProjectStore(s => s.setZoom);
  const clearSelection = useProjectStore(s => s.clearSelection);
  const deleteTask = useProjectStore(s => s.deleteTask);
  const indent = useProjectStore(s => s.indentTask);
  const outdent = useProjectStore(s => s.outdentTask);
  const moveTask = useProjectStore(s => s.moveTask);
  const insertTask = useProjectStore(s => s.insertTask);
  const setSelection = useProjectStore(s => s.setSelection);

  useHotkeys('mod+k', e => { e.preventDefault(); setCommandOpen(true); }, { enableOnFormTags: true });
  useHotkeys('shift+/', () => setCheatsheetOpen(true));
  useHotkeys('mod+z', e => { e.preventDefault(); undo(); });
  useHotkeys('mod+shift+z', e => { e.preventDefault(); redo(); });
  useHotkeys('mod+y', e => { e.preventDefault(); redo(); });
  useHotkeys('c', () => toggleCriticalPath());
  useHotkeys('1', () => setZoom('day'));
  useHotkeys('2', () => setZoom('week'));
  useHotkeys('3', () => setZoom('month'));
  useHotkeys('4', () => setZoom('quarter'));
  useHotkeys('escape', () => { clearSelection(); useProjectStore.getState().setInspectorOpen(false); });
  useHotkeys('delete,backspace', () => {
    const sel = [...useProjectStore.getState().selection];
    for (const id of sel) deleteTask(id);
  }, { preventDefault: true });
  useHotkeys('tab', e => {
    e.preventDefault();
    const sel = [...useProjectStore.getState().selection];
    for (const id of sel) indent(id);
  });
  useHotkeys('shift+tab', e => {
    e.preventDefault();
    const sel = [...useProjectStore.getState().selection];
    for (const id of sel) outdent(id);
  });

  useHotkeys('alt+up', e => {
    e.preventDefault();
    const sel = [...useProjectStore.getState().selection];
    for (const id of sel) moveTask(id, 'up');
  });
  useHotkeys('alt+down', e => {
    e.preventDefault();
    const sel = [...useProjectStore.getState().selection];
    for (const id of sel) moveTask(id, 'down');
  });

  useHotkeys('mod+enter', e => {
    e.preventDefault();
    const sel = [...useProjectStore.getState().selection];
    const anchor = sel[0];
    const newId = anchor
      ? insertTask({ id: anchor, placement: 'after' })
      : insertTask(null);
    setSelection([newId]);
  }, { enableOnFormTags: true });

  useHotkeys('mod+shift+enter', e => {
    e.preventDefault();
    const sel = [...useProjectStore.getState().selection];
    const anchor = sel[0];
    const newId = anchor
      ? insertTask({ id: anchor, placement: 'before' })
      : insertTask(null);
    setSelection([newId]);
  }, { enableOnFormTags: true });

  useHotkeys('mod+alt+enter', e => {
    e.preventDefault();
    const sel = [...useProjectStore.getState().selection];
    const anchor = sel[0];
    const newId = anchor
      ? insertTask({ id: anchor, placement: 'child' })
      : insertTask(null);
    setSelection([newId]);
  }, { enableOnFormTags: true });
}
