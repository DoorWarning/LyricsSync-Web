import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import './admin.css';

const API_URL = 'http://localhost:3001/api/admin';

// ----------------------------------------------------------------
// [수정] 폼 컴포넌트 (배열 <-> 문자열 변환)
// ----------------------------------------------------------------
const SongForm = ({ token, onSongAdded, editingSong, setEditingSong, onSongUpdated, formData, setFormData }) => {
  
  useEffect(() => {
    if (editingSong) {
      setFormData({
        title: editingSong.title || '',
        artist: editingSong.artist || '',
        original_lyrics: editingSong.original_lyrics || '',
        translated_lyrics: editingSong.translated_lyrics || '',
        hint: editingSong.hint || '',
        // ⭐ [수정] DB의 배열(collectionNames)을 쉼표로 구분된 문자열로 변환
        collectionNames: (editingSong.collectionNames || []).join(', '), 
      });
    } else {
      setFormData(prev => ({
        title: '', artist: '', original_lyrics: '',
        translated_lyrics: '', hint: '', 
        collectionNames: prev.collectionNames // 새 노래 작성 시 모음집 이름은 유지
      }));
    }
  }, [editingSong, setFormData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const headers = { 'Authorization': token };
      // 폼의 collectionNames (문자열)을 서버로 그냥 전송 (서버가 배열로 변환)
      if (editingSong) {
        const response = await axios.put(`${API_URL}/songs/${editingSong._id}`, formData, { headers });
        if (response.data.success) {
          onSongUpdated(response.data.song);
          alert('노래가 성공적으로 수정되었습니다!');
        }
      } else {
        const response = await axios.post(`${API_URL}/songs`, formData, { headers });
        if (response.data.success) {
          onSongAdded(response.data.song);
          alert('노래가 성공적으로 추가되었습니다!');
          setFormData(prev => ({
            title: '', artist: '', original_lyrics: '',
            translated_lyrics: '', hint: '', collectionNames: prev.collectionNames
          }));
        }
      }
    } catch (err) {
      alert('오류 발생: ' + err.response?.data?.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-panel" style={{ marginBottom: '20px' }}>
      <h3>{editingSong ? '노래 수정' : '새 노래 추가'}</h3>
      <div className="form-grid">
        <input name="title" value={formData.title} onChange={handleChange} placeholder="제목 (정답)" required />
        <input name="artist" value={formData.artist} onChange={handleChange} placeholder="가수 (힌트2)" required />
        <input name="hint" value={formData.hint} onChange={handleChange} placeholder="초성 힌트 (힌트1)" required />
        {/* ⭐ [수정] name과 placeholder 변경 */}
        <input 
          name="collectionNames" 
          value={formData.collectionNames} 
          onChange={handleChange} 
          placeholder="모음집 (쉼표로 구분)" 
          required 
        />
      </div>
      <textarea 
        name="original_lyrics" 
        value={formData.original_lyrics} 
        onChange={handleChange} 
        placeholder="원본 가사" 
      />
      <textarea 
        name="translated_lyrics" 
        value={formData.translated_lyrics} 
        onChange={handleChange} 
        placeholder="번역된 가사 (문제)" 
        required 
      />
      <div className="form-buttons">
        <button type="submit" className={editingSong ? "btn-blue" : "btn-primary"}>
          {editingSong ? '수정 완료' : 'DB에 추가'}
        </button>
        {editingSong && (
          <button type="button" onClick={() => setEditingSong(null)} className="btn-secondary">
            취소
          </button>
        )}
      </div>
    </form>
  );
};


// ----------------------------------------------------------------
// ⭐ [수정] 노래 목록 (새 그룹화 로직)
// ----------------------------------------------------------------
const SongList = ({ songs, token, onSongDeleted, setEditingSong }) => {
  
  const [expandedCollections, setExpandedCollections] = useState({});

  // ⭐ [수정] 노래를 collectionNames 배열 기준으로 그룹화
  const groupedSongs = useMemo(() => {
    return songs.reduce((acc, song) => {
      const collections = song.collectionNames || [];
      
      if (collections.length === 0) {
        // 모음집이 없는 경우
        if (!acc['Uncategorized']) acc['Uncategorized'] = [];
        acc['Uncategorized'].push(song);
      } else {
        // 여러 모음집에 속한 경우, 각 모음집에 노래를 추가
        collections.forEach(collection => {
          if (!acc[collection]) acc[collection] = [];
          acc[collection].push(song);
        });
      }
      return acc;
    }, {});
  }, [songs]); // songs 배열이 바뀔 때만 재계산

  const handleDelete = async (songId) => {
    if (!window.confirm('정말로 이 노래를 삭제하시겠습니까?')) return;
    try {
      await axios.delete(`${API_URL}/songs/${songId}`, {
        headers: { 'Authorization': token }
      });
      onSongDeleted(songId);
    } catch (err) {
      alert('삭제 실패: ' + err.response?.data?.message);
    }
  };
  
  const toggleCollection = (collectionName) => {
    setExpandedCollections(prev => ({
      ...prev,
      [collectionName]: !prev[collectionName]
    }));
  };

  return (
    <div className="list-panel">
      <h3>DB 노래 목록 (총 {songs.length}곡)</h3>
      
      {/* Object.keys로 정렬 (선택 사항) */}
      {Object.keys(groupedSongs).sort().map((collectionName) => (
        <div key={collectionName} className="collection-group">
          <h4 
            onClick={() => toggleCollection(collectionName)} 
            style={{ cursor: 'pointer' }}
          >
            모음집: {collectionName} ({groupedSongs[collectionName].length}곡)
            <span style={{ float: 'right' }}>
              {expandedCollections[collectionName] ? '▲' : '▼'}
            </span>
          </h4>
          
          {expandedCollections[collectionName] && (
            <table>
              <thead>
                <tr>
                  <th>제목</th>
                  <th>가수</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {groupedSongs[collectionName].map((song) => (
                  <tr key={song._id}>
                    <td>{song.title}</td>
                    <td>{song.artist}</td>
                    <td>
                      <button 
                        onClick={() => setEditingSong(song)} 
                        className="btn-blue"
                        style={{ marginRight: '5px' }}
                      >
                        수정
                      </button>
                      <button onClick={() => handleDelete(song._id)} className="btn-primary">
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}
    </div>
  );
};


// ----------------------------------------------------------------
// 엉뚱한 번역기 (Gemini)
// (수정 없음, 기존 코드 그대로)
// ----------------------------------------------------------------
const QuizMaker = ({ token, setFormData }) => {
  const [original, setOriginal] = useState('');
  const [translated, setTranslated] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleGenerate = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await axios.post(`${API_URL}/generate-translation`, 
        { originalLyrics: original },
        { headers: { 'Authorization': token }}
      );
      setTranslated(response.data.translatedLyrics);
    } catch (err) {
      setError('번역 실패: ' + err.response?.data?.message);
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
      <button onClick={handleGenerate} disabled={isLoading || !original} className="btn-blue" style={{ width: '100%', marginTop: '10px' }}>
        {isLoading ? '번역 중...' : '엉뚱한 번역 생성'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {translated && (
        <>
          <textarea 
            value={translated} 
            readOnly 
            style={{ height: '100px', backgroundColor: '#1A2036' }}
          />
          <button onClick={useTranslation} className="btn-primary" style={{ width: '100%'}}>
            이 번역 사용하기
          </button>
        </>
      )}
    </div>
  );
};


// ----------------------------------------------------------------
// ⭐ [수정] 메인 App 컴포넌트 (formData 상태 변경)
// ----------------------------------------------------------------
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [token, setToken] = useState(null);
  
  const [songs, setSongs] = useState([]);
  const [editingSong, setEditingSong] = useState(null); 
  
  // ⭐ [수정] formData의 collectionName -> collectionNames
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    original_lyrics: '',
    translated_lyrics: '',
    hint: '',
    collectionNames: 'kpop-classics', // 폼 입력은 문자열
  });

  useEffect(() => {
    if (isLoggedIn && token) {
      fetchSongs();
    }
  }, [isLoggedIn, token]);

  const fetchSongs = async () => {
    try {
      const response = await axios.get(`${API_URL}/songs`, {
        headers: { 'Authorization': token }
      });
      if (response.data.success) {
        setSongs(response.data.songs);
      }
    } catch (err) {
      setError('노래 목록 로딩 실패: ' + err.response?.data?.message);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await axios.post(`${API_URL}/login`, { password });
      if (response.data.success) {
        setToken(response.data.token);
        setIsLoggedIn(true);
      }
    } catch (err) {
      setError('로그인 실패: 비밀번호가 틀리거나 서버 오류입니다.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setToken(null);
    setPassword('');
    setSongs([]);
    setEditingSong(null);
  };
  
  const handleSongUpdated = (updatedSong) => {
    setSongs(prev => prev.map(s => s._id === updatedSong._id ? updatedSong : s));
    setEditingSong(null);
  };

  // -----------------------------------
  // [뷰] 로그인 화면
  // -----------------------------------
  if (!isLoggedIn) {
    return (
      <div className="login-view">
        <h1>LyricsSync 관리자 패널</h1>
        <form onSubmit={handleLogin}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="관리자 비밀번호"
          />
          <button type="submit" className="btn-primary">
            로그인
          </button>
        </form>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
    );
  }

  // -----------------------------------
  // [뷰] 관리자 대시보드 (로그인 성공 시)
  // -----------------------------------
  return (
    <div className="App">
      <header className="admin-header">
        <h1>DB 관리 대시보드</h1>
        <button onClick={handleLogout} className="btn-secondary">로그아웃</button>
      </header>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <main className="dashboard-container">
        
        <div style={{ flex: 1, position: 'sticky', top: '20px' }}>
          
          <QuizMaker token={token} setFormData={setFormData} />

          <SongForm 
            token={token} 
            onSongAdded={(newSong) => setSongs(prev => [newSong, ...prev])}
            editingSong={editingSong}
            setEditingSong={setEditingSong}
            onSongUpdated={handleSongUpdated}
            formData={formData}
            setFormData={setFormData}
          />
        </div>
        
        <div style={{ flex: 2 }}>
          <SongList 
            songs={songs} 
            token={token} 
            onSongDeleted={(deletedId) => setSongs(prev => prev.filter(s => s._id !== deletedId))}
            setEditingSong={setEditingSong}
          />
        </div>

      </main>
    </div>
  );
}

export default App;