// src/components/SongForm.jsx
import React, { useEffect } from 'react';
import axios from 'axios';

const SongForm = ({ user, token, editingSong, setEditingSong, refreshSongs, formData, setFormData, apiUrl, showAlert, showConfirm }) => {
  
  // ⭐ [수정] user가 null일 경우를 대비해 '?.' (Optional Chaining) 사용
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (editingSong) {
      setFormData({
        title: editingSong.title || '',
        artist: editingSong.artist || '',
        original_lyrics: editingSong.original_lyrics || '',
        translated_lyrics: editingSong.translated_lyrics || '',
        hint: editingSong.hint || '',
        collectionNames: (editingSong.collectionNames || []).join(', '), 
      });
    } else {
      setFormData(prev => ({
        title: '', artist: '', original_lyrics: '', translated_lyrics: '', hint: '', 
        collectionNames: prev.collectionNames 
      }));
    }
  }, [editingSong, setFormData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ⭐ [안전장치] 유저 정보가 없으면 실행 중단
    if (!user) return;

    // Authorization 헤더에 Bearer 토큰 사용
    const headers = { 'Authorization': `Bearer ${token}` };
    
    const action = async () => {
        try {
            if (isAdmin) {
                if (editingSong) {
                    await axios.put(`${apiUrl}/songs/${editingSong._id}`, formData, { headers });
                    showAlert('수정 완료!', 'success');
                } else {
                    await axios.post(`${apiUrl}/songs`, formData, { headers });
                    showAlert('등록 완료!', 'success');
                }
            } else {
                const requestBody = {
                    requestType: editingSong ? 'update' : 'create',
                    targetSongId: editingSong ? editingSong._id : null,
                    data: formData
                };
                await axios.post(`${apiUrl}/request`, requestBody, { headers });
                showAlert('수정 요청이 전송되었습니다. 관리자 승인을 기다리세요.', 'success');
            }
            
            refreshSongs(); 
            if (!editingSong) { 
                setFormData(prev => ({ ...prev, title: '', artist: '', original_lyrics: '', translated_lyrics: '', hint: '' }));
            } else {
                setEditingSong(null);
            }
        } catch (err) {
            showAlert('작업 실패: ' + (err.response?.data?.message || err.message), 'error');
        }
    };

    action(); 
  };

  return (
    <form onSubmit={handleSubmit} className="form-panel">
      <h3>
        {editingSong ? '노래 수정' : '새 노래 등록'} 
        <span style={{ fontSize: '0.6em', color: isAdmin ? 'var(--accent-pink)' : 'var(--secondary-text)', marginLeft: '10px' }}>
          ({isAdmin ? '관리자 모드' : '요청 모드'})
        </span>
      </h3>
      
      <div className="form-grid">
        <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="제목 (정답)" required />
        <input type="text" name="artist" value={formData.artist} onChange={handleChange} placeholder="가수 (힌트2)" required />
        <input type="text" name="hint" value={formData.hint} onChange={handleChange} placeholder="초성 힌트 (힌트1)" required />
        <input type="text" name="collectionNames" value={formData.collectionNames} onChange={handleChange} placeholder="모음집 (쉼표로 구분)" required />
      </div>
      <textarea name="original_lyrics" value={formData.original_lyrics} onChange={handleChange} placeholder="원본 가사" />
      <textarea name="translated_lyrics" value={formData.translated_lyrics} onChange={handleChange} placeholder="번역된 가사 (문제)" required />
      
      <div className="form-buttons">
        <button type="submit" className={editingSong ? "btn-blue" : "btn-primary"}>
          {isAdmin 
            ? (editingSong ? '수정 완료 (즉시)' : 'DB에 추가 (즉시)') 
            : (editingSong ? '수정 요청 보내기' : '등록 요청 보내기')
          }
        </button>
        {editingSong && (
          <button type="button" onClick={() => setEditingSong(null)} className="btn-secondary">취소</button>
        )}
      </div>
    </form>
  );
};

export default SongForm;