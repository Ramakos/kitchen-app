import { useState, useEffect } from 'react';
import { X, Send, Calendar, ClipboardList } from 'lucide-react';
import { supabase, KitchenNote } from '../lib/supabase';
import { useToast } from './Toast';

type EndOfDayModalProps = {
  isOpen: boolean;
  onClose: () => void;
  staffId: string;
};

export function EndOfDayModal({ isOpen, onClose, staffId }: EndOfDayModalProps) {
  const [itemsNeeded, setItemsNeeded] = useState('');
  const [previousNote, setPreviousNote] = useState<KitchenNote | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadPreviousNote();
      setItemsNeeded('');
      setSuccess(false);
    }
  }, [isOpen]);

  const loadPreviousNote = async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const { data } = await supabase
      .from('kitchen_notes')
      .select('*')
      .eq('date', yesterdayStr)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setPreviousNote(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemsNeeded.trim()) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('kitchen_notes')
        .insert({
          notes: itemsNeeded,
          date: new Date().toISOString().split('T')[0],
          submitted_by: staffId,
        });

      if (error) throw error;

      setSuccess(true);
      showToast('End of day list submitted to admin', 'success');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error submitting note:', err);
      showToast('Failed to submit. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-5 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-brand rounded-xl flex items-center justify-center shadow-brand">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">End of Day List</h2>
              <p className="text-xs text-slate-500">Items needed for tomorrow</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {success ? (
            <div className="text-center py-12 animate-fade-in">
              <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Submitted Successfully</h3>
              <p className="text-slate-500 text-sm">Your list has been sent to admin.</p>
            </div>
          ) : (
            <>
              {previousNote && (
                <div className="mb-5 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <h3 className="font-semibold text-slate-900 mb-2 text-sm flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-slate-400" />
                    Previous List (Yesterday)
                  </h3>
                  <div className="text-sm text-slate-600 whitespace-pre-wrap font-mono">
                    {previousNote.items_needed}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Items Needed for Tomorrow
                  </label>
                  <textarea
                    value={itemsNeeded}
                    onChange={(e) => setItemsNeeded(e.target.value)}
                    placeholder={'Example:\n5kg Tomatoes\n2kg Rice\n1 Crate Eggs\n3L Cooking Oil'}
                    className="w-full h-56 px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-brand focus:outline-none text-slate-900 resize-none font-mono text-sm transition-colors"
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-6 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !itemsNeeded.trim()}
                    className="flex-1 px-6 py-3 bg-gradient-brand hover:opacity-90 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-brand active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Send className="w-5 h-5" />
                    {loading ? 'Sending...' : 'Send to Admin'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
