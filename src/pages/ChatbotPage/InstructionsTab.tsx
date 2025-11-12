import React, { useEffect, useState } from 'react';
import { instructionService } from '../../services/instructionService';
import { Instruction } from '../../types/instruction';
import { Save, RefreshCw } from 'lucide-react';

const InstructionsTab: React.FC = () => {
  const [items, setItems] = useState<Instruction[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await instructionService.list();
      setItems(data);
    } catch (e: any) {
      setError(e?.message || 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onChangeItem = (idx: number, value: string) => {
    const next = [...items];
    next[idx] = { ...next[idx], value };
    setItems(next);
  };

  const saveAll = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = { instructions: items.map((i: Instruction) => ({ key: i.key, value: i.value })) };
      const data = await instructionService.bulkUpdate(payload);
      setItems(data);
    } catch (e: any) {
      setError(e?.message || 'Lỗi lưu dữ liệu');
    } finally {
      setSaving(false);
    }
  };

  const saveOne = async (item: Instruction) => {
    setSaving(true);
    setError(null);
    try {
      const data = await instructionService.upsertByKey(item.key, item);
      setItems((prev: Instruction[]) => prev.map((x: Instruction) => (x.key === data.key ? data : x)));
    } catch (e: any) {
      setError(e?.message || 'Lỗi lưu');
    } finally {
      setSaving(false);
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">System Instructions</h2>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="inline-flex items-center px-3 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Tải lại
          </button>
          <button
            onClick={saveAll}
            className="inline-flex items-center px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
            disabled={saving || loading}
          >
            <Save className="h-4 w-4 mr-2" /> Lưu tất cả
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="divide-y divide-gray-200">
          {items.map((it: Instruction, idx: number) => (
            <div key={it.key} className="p-4 flex items-start gap-2">
              <div className="w-1/3">
                <div className="text-sm font-medium text-gray-700">{it.key}</div>
              </div>
              <div className="flex-1">
                <textarea
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[90px]"
                  value={it.value}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChangeItem(idx, e.target.value)}
                />
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => saveOne(items[idx])}
                    className="inline-flex items-center px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                    disabled={saving}
                  >
                    <Save className="h-4 w-4 mr-2" /> Lưu
                  </button>
                </div>
              </div>
            </div>
          ))}
          {items.length === 0 && !loading && (
            <div className="p-4 text-sm text-gray-500">Chưa có instruction nào.</div>
          )}
          {loading && (
            <div className="p-4 text-sm text-gray-500">Đang tải...</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstructionsTab;
