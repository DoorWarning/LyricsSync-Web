// src/components/QuizMaker.jsx
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
        { headers: { 'Authorization': token, 'x-user-email': user.email }}
      );
      setTranslated(response.data.translatedLyrics);
    } catch (err) {
      alert('번역 실패: ' + err.response?.data?.message);
    }
    setIsLoading(false);
  };
  
  const useTranslation = () => {
    setFormData(prev => ({ ...prev, translated_lyrics: translated, original_lyrics: original }));
  };
  
  return (
    <div className="form-panel">
      <h3>엉뚱한 번역 (Gemini)</h3>
      <textarea value={original} onChange={(e) => setOriginal(e.target.value)} placeholder="원본 가사 입력..." />
      <button onClick={handleGenerate} disabled={isLoading || !original} className="btn-blue" style={{ width: '100%', marginTop: '10px' }}>
        {isLoading ? '번역 중...' : '번역 생성'}
      </button>
      {translated && (
        <>
          <textarea value={translated} readOnly style={{ height: '100px', backgroundColor: '#1A2036', marginTop: '10px' }} />
          <button onClick={useTranslation} className="btn-primary" style={{ width: '100%', marginTop: '10px' }}>사용하기</button>
        </>
      )}
    </div>
  );
};

export default QuizMaker;