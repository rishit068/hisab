import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useSnackbar } from '../../context/SnackbarContext';
import { en } from '../../i18n/en';
import type { Category } from '../../types/database';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

interface CategoriesAdminModalProps {
  onClose: () => void;
}

export function CategoriesAdminModal({ onClose }: CategoriesAdminModalProps) {
  const { showSnackbar } = useSnackbar();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [newName, setNewName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort', { ascending: true });

      if (error) throw error;
      setCategories(data ?? []);
    } catch {
      showSnackbar(en.errorGeneric);
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleToggleActive = async (cat: Category) => {
    setBusy(true);
    try {
      const { error } = await supabase
        .from('categories')
        .update({ active: !cat.active })
        .eq('id', cat.id);

      if (error) throw error;
      await fetchCategories();
    } catch {
      showSnackbar(en.errorGeneric);
    } finally {
      setBusy(false);
    }
  };

  const handleAddCategory = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      const maxSort = categories.reduce((max, c) => Math.max(max, c.sort), 0);
      const { error } = await supabase
        .from('categories')
        .insert({ name: trimmed, sort: maxSort + 1, active: true });

      if (error) throw error;
      setNewName('');
      await fetchCategories();
    } catch {
      showSnackbar(en.errorGeneric);
    } finally {
      setBusy(false);
    }
  };

  const handleStartRename = (cat: Category) => {
    setRenamingId(cat.id);
    setRenameValue(cat.name);
  };

  const handleSaveRename = async () => {
    if (!renamingId || !renameValue.trim()) return;
    setBusy(true);
    try {
      const { error } = await supabase
        .from('categories')
        .update({ name: renameValue.trim() })
        .eq('id', renamingId);

      if (error) throw error;
      setRenamingId(null);
      await fetchCategories();
    } catch {
      showSnackbar(en.errorGeneric);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="categories-admin-heading"
      className="fixed inset-0 bg-black/60 z-50 overflow-y-auto flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div className="bg-[var(--bg)] w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)] bg-[var(--surface)]">
          <h2 id="categories-admin-heading" className="text-2xl font-bold text-[var(--text)]">
            {en.menuCategories}
          </h2>
          <button
            onClick={onClose}
            className="min-h-[44px] px-3 py-1 text-lg font-semibold text-[var(--muted)] hover:text-[var(--text)]"
            aria-label="Close"
          >
            Done
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <p className="text-lg text-[var(--muted)] text-center py-8">Loading…</p>
          ) : (
            <>
              {/* Category list */}
              <Card className="!p-0 overflow-hidden">
                {categories.map((cat, idx) => (
                  <div
                    key={cat.id}
                    className={
                      'flex items-center gap-3 px-4 py-3 min-h-[56px] ' +
                      (idx < categories.length - 1 ? 'border-b border-[var(--border)]' : '')
                    }
                  >
                    {renamingId === cat.id ? (
                      <>
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename();
                            if (e.key === 'Escape') setRenamingId(null);
                          }}
                          className="flex-1 px-3 py-2 bg-[var(--surface)] border-2 border-[var(--primary)] rounded-xl text-lg text-[var(--text)] focus:outline-none"
                          autoFocus
                          aria-label="New category name"
                        />
                        <button
                          onClick={handleSaveRename}
                          disabled={busy || !renameValue.trim()}
                          className="min-h-[44px] px-4 rounded-xl bg-[var(--primary)] text-white font-semibold text-base disabled:opacity-40"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setRenamingId(null)}
                          className="min-h-[44px] px-3 rounded-xl border border-[var(--border)] text-[var(--muted)] text-base"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Toggle hide/show */}
                        <button
                          onClick={() => handleToggleActive(cat)}
                          disabled={busy}
                          aria-pressed={cat.active}
                          aria-label={cat.active ? `Hide ${cat.name}` : `Show ${cat.name}`}
                          className={
                            'w-12 h-7 rounded-full transition-colors flex-shrink-0 ' +
                            (cat.active ? 'bg-[var(--primary)]' : 'bg-[var(--border)]')
                          }
                        >
                          <span
                            className={
                              'block w-5 h-5 rounded-full bg-white shadow transition-transform mx-1 ' +
                              (cat.active ? 'translate-x-5' : 'translate-x-0')
                            }
                          />
                        </button>

                        <span
                          className={
                            'flex-1 text-lg ' +
                            (cat.active ? 'text-[var(--text)]' : 'text-[var(--muted)] line-through')
                          }
                        >
                          {cat.name}
                        </span>

                        <button
                          onClick={() => handleStartRename(cat)}
                          className="min-h-[44px] px-3 text-base font-semibold text-[var(--primary)] hover:bg-gray-50 rounded-xl"
                          aria-label={`Rename ${cat.name}`}
                        >
                          Rename
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </Card>

              {/* Add new category */}
              <div>
                <h3 className="text-base font-semibold text-[var(--muted)] uppercase tracking-wide mb-3">
                  Add new category
                </h3>
                <Card className="!p-4 flex gap-3">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddCategory();
                    }}
                    placeholder="Category name"
                    className="flex-1 px-3 py-3 bg-[var(--surface)] border-2 border-[var(--border)] rounded-xl text-lg text-[var(--text)] focus:border-[var(--primary)] focus:outline-none placeholder-[var(--muted)]"
                    aria-label="New category name"
                  />
                  <Button
                    onClick={handleAddCategory}
                    disabled={busy || !newName.trim()}
                    aria-label="Add category"
                  >
                    Add
                  </Button>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
