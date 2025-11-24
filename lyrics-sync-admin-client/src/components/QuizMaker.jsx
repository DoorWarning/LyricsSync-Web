import React, { useState } from 'react';
import axios from 'axios';

const QuizMaker = ({ user, token, setFormData, apiUrl }) => {
  const [original, setOriginal] = useState('');
  const [translated, setTranslated] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${apiUrl}/generate-translation`, 
        { originalLyrics: original },
        { 
          headers: { 
            // ⭐ [수정] 'Bearer ' 접두사를 붙여서 토큰 전송
            'Authorization': `Bearer ${token}` 
          }
        }
      );
      setTranslated(response.data.translatedLyrics);
    } catch (err) {
      // 에러 메시지 상세 표시
      const msg = err.response?.data?.message || err.message;
      alert(`번역 실패: ${msg}`);
    }
    setIsLoading(false);
  };
  
  const useTranslation = () => {
    setFormData(prev => ({ ...prev, translated_lyrics: translated, original_lyrics: original }));
  };
  
  return (
    <div className="form-panel">
      <h3>엉뚱한 번역 (Gemini)</h3>
      <textarea 
        value={original} 
        onChange={(e) => setOriginal(e.target.value)} 
        placeholder="여기에 번역할 원본 가사 부분을 입력하세요..." 
      />
      <button 
        onClick={handleGenerate} 
        disabled={isLoading || !original} 
        className="btn-blue" 
        style={{ width: '100%', marginTop: '10px' }}
      >
        {isLoading ? '번역 중...' : '번역 생성'}
      </button>
      {translated && (
        <>
          <textarea 
            value={translated} 
            readOnly 
            style={{ height: '100px', backgroundColor: '#1A2036', marginTop: '10px' }} 
          />
          <button 
            onClick={useTranslation} 
            className="btn-primary" 
            style={{ width: '100%', marginTop: '10px' }}
          >
            이 번역 사용하기
          </button>
        </>
      )}
    </div>
  );
};

export default QuizMaker;