import React, { useState } from 'react';
import api from '../lib/api';

export default function QuizMaker() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTranslate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const res = await api.post('/api/admin/generate-translation', { originalLyrics: input });
      if (res.data.success) {
        setOutput(res.data.translatedLyrics);
      }
    } catch (err) {
      setOutput("오류 발생: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 shadow-xl border border-gray-700 h-full flex flex-col">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        🤖 AI 번역기 <span className="text-sm font-normal text-gray-400">(Gemini Pro)</span>
      </h2>
      
      <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
        {/* 입력창 */}
        <div className="flex-1 flex flex-col">
          <label className="text-gray-400 mb-2 font-medium">원본 텍스트</label>
          <textarea 
            className="flex-1 w-full bg-gray-900 border border-gray-600 rounded-lg p-4 text-white resize-none focus:border-indigo-500 outline-none custom-scrollbar"
            placeholder="번역할 가사나 문장을 입력하세요..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>

        {/* 컨트롤 */}
        <div className="flex md:flex-col justify-center items-center gap-4">
          <button 
            onClick={handleTranslate} 
            disabled={loading || !input}
            className="bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-110 active:scale-95"
            title="번역 실행"
          >
            {loading ? '⏳' : '▶️'}
          </button>
        </div>

        {/* 결과창 */}
        <div className="flex-1 flex flex-col">
          <label className="text-gray-400 mb-2 font-medium">AI 번역 결과</label>
          <div className="flex-1 w-full bg-gray-900 border border-gray-600 rounded-lg p-4 text-indigo-300 overflow-y-auto custom-scrollbar whitespace-pre-wrap">
            {output || <span className="text-gray-600">결과가 여기에 표시됩니다.</span>}
          </div>
        </div>
      </div>
    </div>
  );
}