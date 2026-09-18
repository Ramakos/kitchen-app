import { useState, useEffect } from 'react';
import { X, Send, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase, KitchenNeed } from '../lib/supabase';
import { useToast } from './Toast';

type ShortageModalProps = {
  isOpen: boolean;
  onClose: () => void;
  staffId: string;
};

export function ShortageModal({ isOpen, onClose, staffId }: ShortageModalProps) {
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [notes, setNotes] = useState('');
  const [recentRequests, setRecentRequests] = useState<KitchenNeed[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadRecentRequests();
      setItemName('');
      setQuantity('');
      setUnit('');
      setNotes('');
      setSuccess(false);
    }
  }, [isOpen]);

  const loadRecentRequests = async () => {
    const { data } = await supabase
      .from('kitchen_needs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (data) {
      setRecentRequests(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !quantity.trim()) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('kitchen_needs')
        .insert({
          item_name: itemName,
          quantity: parseFloat(quantity) || null,
          unit: unit || null,
          notes: notes || null,
          requested_by: staffId,
          date: new Date().toISOString().split('T')[0],
        });

      if (error) throw error;

      setSuccess(true);
      showToast('Shortage reported to management', 'success');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error submitting shortage:', err);
      showToast('Failed to submit. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'approved': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ordered': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'received': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-5 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center shadow-sm">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Report Shortage (86)</h2>
              <p className="text-xs text-slate-500">Notify management of missing items</p>
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
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Shortage Reported</h3>
              <p className="text-slate-500 text-sm">Your request has been sent to management.</p>
            </div>
          ) : (
            <>
              {recentRequests.length > 0 && (
                <div className="mb-5 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <h3 className="font-semibold text-slate-900 mb-3 text-sm">Recent Requests</h3>
                  <div className="space-y-2">
                    {recentRequests.map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <div>
                          <span className="font-medium text-slate-900">{request.item_name}</span>
                          {request.quantity != null && (
                            <span className="text-slate-500 ml-1.5">
                              ({request.quantity}{request.unit ? ` ${request.unit}` : ''})
                            </span>
                          )}
                        </div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Item Name *
                    </label>
                    <input
                      type="text"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      placeholder="e.g., Tomatoes"
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-red-500 focus:outline-none text-slate-900 transition-colors"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Qty *
                      </label>
                      <input
                        type="text"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="5"
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-red-500 focus:outline-none text-slate-900 transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Unit
                      </label>
                      <input
                        type="text"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        placeholder="kg"
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-red-500 focus:outline-none text-slate-900 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional details..."
                    className="w-full h-20 px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-red-500 focus:outline-none text-slate-900 resize-none transition-colors"
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
                    disabled={loading || !itemName.trim() || !quantity.trim()}
                    className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Send className="w-5 h-5" />
                    {loading ? 'Sending...' : 'Report Shortage'}
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
