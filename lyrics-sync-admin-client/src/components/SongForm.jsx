import React, { useState, useEffect } from 'react';
import api from '../lib/api';

// ⭐ [수정] userRole props 추가
export default function SongForm({ onSubmit, initialData, onCancel, userRole }) {
  const safeData = initialData || {};
  const [basicInfo, setBasicInfo] = useState({ title: '', artist: '', collectionNames: '' });
  const [quizzes, setQuizzes] = useState([{ original_lyrics: '', translated_lyrics: '', hint: '' }]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(null); 

  useEffect(() => {
    if (safeData._id) {
      setBasicInfo({
        title: safeData.title || '',
        artist: safeData.artist || '',
        collectionNames: Array.isArray(safeData.collectionNames) ? safeData.collectionNames.join(', ') : (safeData.collectionNames || '')
      });
      if (safeData.quizzes?.length > 0) setQuizzes(safeData.quizzes);
      else if (safeData.original_lyrics) setQuizzes([{ original_lyrics: safeData.original_lyrics, translated_lyrics: safeData.translated_lyrics || '', hint: safeData.hint || '' }]);
    } else {
      setBasicInfo({ title: '', artist: '', collectionNames: '' });
      setQuizzes([{ original_lyrics: '', translated_lyrics: '', hint: '' }]);
    }
  }, [initialData]);

  const handleInfoChange = (e) => setBasicInfo({ ...basicInfo, [e.target.name]: e.target.value });
  const handleQuizChange = (idx, field, val) => { const newQ = [...quizzes]; newQ[idx][field] = val; setQuizzes(newQ); };
  
  const handleAiTranslate = async (idx) => {
    if (!quizzes[idx].original_lyrics.trim()) return alert('원본 가사를 입력해주세요.');
    setAiLoading(idx);
    try {
      const res = await api.post('/api/admin/generate-translation', { originalLyrics: quizzes[idx].original_lyrics });
      if (res.data.success) handleQuizChange(idx, 'translated_lyrics', res.data.translatedLyrics);
    } catch (err) { alert('번역 실패: ' + err.message); } 
    finally { setAiLoading(null); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!basicInfo.title.trim()) return alert("제목을 입력해주세요.");
    if (!basicInfo.artist.trim()) return alert("가수를 입력해주세요.");
    for (let i = 0; i < quizzes.length; i++) {
        const q = quizzes[i];
        if (!q.original_lyrics.trim()) return alert(`문제 ${i + 1}의 '원본 가사'를 입력해주세요.`);
        if (!q.translated_lyrics.trim()) return alert(`문제 ${i + 1}의 '번역 가사'를 입력해주세요.`);
        if (!q.hint.trim()) return alert(`문제 ${i + 1}의 '초성 힌트'를 입력해주세요.`);
    }
    setLoading(true);
    await onSubmit({ ...basicInfo, quizzes });
    setLoading(false);
  };

  // ⭐ [추가] 버튼 텍스트 결정 로직
  const getButtonText = () => {
    if (loading) return '저장 중...';
    if (safeData._id) {
        return userRole === 'admin' ? '수정 완료' : '수정 요청';
    }
    return userRole === 'admin' ? '추가 완료' : '추가 요청';
  };

  return (
    <div className="bg-panel p-4 md:p-6 h-full flex flex-col overflow-hidden">
      
      <div className="md:hidden flex justify-end mb-2">
        <button onClick={onCancel} className="text-text-sub text-sm">✕ 닫기</button>
      </div>

      <h2 className="text-lg md:text-xl font-bold mb-4 pb-2 border-b border-brand-blue/30 shrink-0 text-white flex items-center gap-2">
        {/* 헤더 텍스트도 역할에 따라 살짝 바꿔주면 좋습니다 (선택사항) */}
        {safeData._id 
            ? <><span className="text-brand-blue">✏️</span> {userRole === 'admin' ? '노래 수정' : '수정 요청'}</> 
            : <><span className="text-brand-blue">➕</span> {userRole === 'admin' ? '노래 추가' : '추가 요청'}</>
        }
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
        <div className="flex-1 overflow-y-auto pr-1 md:pr-2 custom-scrollbar">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-6">
                <div>
                    <label className="block text-text-sub text-xs md:text-sm mb-1 font-bold">제목 <span className="text-brand-pink">*</span></label>
                    <input type="text" name="title" required value={basicInfo.title} onChange={handleInfoChange} className="w-full bg-input border border-gray-600 rounded p-2 text-white focus:border-brand-blue outline-none transition-all shadow-inner" />
                </div>
                <div>
                    <label className="block text-text-sub text-xs md:text-sm mb-1 font-bold">가수 <span className="text-brand-pink">*</span></label>
                    <input type="text" name="artist" required value={basicInfo.artist} onChange={handleInfoChange} className="w-full bg-input border border-gray-600 rounded p-2 text-white focus:border-brand-blue outline-none transition-all shadow-inner" />
                </div>
                <div className="col-span-1 md:col-span-2">
                    <label className="block text-text-sub text-xs md:text-sm mb-1 font-bold">모음집 태그 (쉼표 구분)</label>
                    <input type="text" name="collectionNames" placeholder="예: kpop-2023, ballad" value={basicInfo.collectionNames} onChange={handleInfoChange} className="w-full bg-input border border-gray-600 rounded p-2 text-white focus:border-brand-blue outline-none transition-all shadow-inner" />
                </div>
            </div>

            <div className="border-t border-gray-700/50 pt-4 pb-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-base md:text-lg font-bold text-brand-blue">퀴즈 목록 ({quizzes.length})</h3>
                    <button type="button" onClick={() => setQuizzes([...quizzes, { original_lyrics: '', translated_lyrics: '', hint: '' }])} className="bg-brand-dark hover:bg-brand-blue hover:text-black text-white px-3 py-1.5 rounded-lg text-xs md:text-sm transition font-bold shadow-md">
                        + 문제 추가
                    </button>
                </div>

                <div className="space-y-4">
                    {quizzes.map((quiz, idx) => (
                    <div key={idx} className="bg-input/30 p-4 rounded-lg border border-gray-700 relative hover:border-brand-blue/50 transition-colors shadow-sm">
                        <div className="flex justify-between items-center mb-3 border-b border-gray-700/50 pb-2">
                            <span className="text-gray-300 font-bold text-sm">문제 {idx + 1}</span>
                            {quizzes.length > 1 && (
                                <button type="button" onClick={() => setQuizzes(quizzes.filter((_, i) => i !== idx))} className="text-brand-pink hover:text-white hover:bg-brand-pink/20 px-2 py-1 rounded text-xs font-bold transition-colors">
                                삭제
                                </button>
                            )}
                        </div>
                        <div className="mb-4">
                            <label className="block text-xs text-text-sub mb-1 font-bold ml-1">원본 가사</label>
                            <textarea rows="2" placeholder="원본 가사를 입력하세요" value={quiz.original_lyrics} onChange={e => handleQuizChange(idx, 'original_lyrics', e.target.value)} className="w-full bg-input border border-gray-600 rounded p-3 text-white text-sm focus:border-brand-blue outline-none transition-colors resize-none shadow-inner" required />
                        </div>
                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-1 ml-1">
                                <label className="block text-xs text-text-sub font-bold">번역 가사</label>
                                <button type="button" onClick={() => handleAiTranslate(idx)} disabled={aiLoading === idx} className="bg-brand-dark hover:bg-brand-blue hover:text-black text-white text-[10px] md:text-xs px-2 py-1 rounded shadow-sm disabled:bg-gray-600 transition-all flex items-center gap-1 font-bold">
                                    {aiLoading === idx ? <>⏳ 생성 중...</> : <>✨ AI 번역</>}
                                </button>
                            </div>
                            <textarea rows="2" placeholder="번역된 가사 (문제로 출제됨)" value={quiz.translated_lyrics} onChange={e => handleQuizChange(idx, 'translated_lyrics', e.target.value)} className="w-full bg-input border border-gray-600 rounded p-3 text-white text-sm focus:border-brand-blue outline-none transition-colors resize-none shadow-inner" required />
                        </div>
                        <div>
                            <label className="block text-xs text-text-sub mb-1 font-bold ml-1">초성 힌트 입력</label>
                            <input type="text" placeholder="초성 힌트(필수)" value={quiz.hint} onChange={e => handleQuizChange(idx, 'hint', e.target.value)} className="w-full bg-input border border-gray-600 rounded p-3 text-white text-sm focus:border-brand-blue outline-none transition-colors shadow-inner" required />
                        </div>
                    </div>
                    ))}
                </div>
            </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-700/50 shrink-0 mt-2 bg-panel z-10">
          <button type="button" onClick={onCancel} className="px-4 py-2.5 bg-gray-700/50 rounded-lg hover:bg-gray-600 text-gray-300 font-bold transition-colors text-sm">
            취소
          </button>
          
          {/* ⭐ [수정] 텍스트 동적 변경 */}
          <button type="submit" disabled={loading} className="px-4 py-2.5 bg-brand-blue text-black rounded-lg hover:bg-white hover:shadow-[0_0_15px_rgba(77,255,255,0.6)] font-bold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm">
            {getButtonText()}
          </button>
        </div>
      </form>
    </div>
  );
}