// src/components/SongList.jsx
import React, { useState, useMemo } from 'react';
import axios from 'axios';

const SongList = ({ songs, user, token, onSongDeleted, setEditingSong, apiUrl }) => {
  const [expandedCollections, setExpandedCollections] = useState({});
  const isAdmin = user.role === 'admin';

  const groupedSongs = useMemo(() => {
    return songs.reduce((acc, song) => {
      const collections = song.collectionNames || [];
      if (collections.length === 0) {
        if (!acc['Uncategorized']) acc['Uncategorized'] = [];
        acc['Uncategorized'].push(song);
      } else {
        collections.forEach(c => {
          if (!acc[c]) acc[c] = [];
          acc[c].push(song);
        });
      }
      return acc;
    }, {});
  }, [songs]);

  const handleDelete = async (songId) => {
    // ⭐ [수정] JWT 표준(Bearer) 헤더 적용
    const headers = { 'Authorization': `Bearer ${token}` };
    
    if (isAdmin) {
      if (!window.confirm('정말로 삭제하시겠습니까? (즉시 삭제)')) return;
      try {
        await axios.delete(`${apiUrl}/songs/${songId}`, { headers });
        onSongDeleted(songId);
        alert('삭제되었습니다.');
      } catch (err) { 
        alert('삭제 실패: ' + (err.response?.data?.message || err.message)); 
      }
    } else {
      if (!window.confirm('삭제 요청을 보내시겠습니까?')) return;
      try {
        await axios.post(`${apiUrl}/request`, { 
          requestType: 'delete', 
          targetSongId: songId 
        }, { headers });
        alert('삭제 요청이 전송되었습니다.');
      } catch (err) { 
        alert('요청 실패: ' + (err.response?.data?.message || err.message)); 
      }
    }
  };

  const toggleCollection = (name) => {
    setExpandedCollections(prev => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <div className="list-panel">
      <h3>DB 노래 목록 (총 {songs.length}곡)</h3>
      {Object.keys(groupedSongs).sort().map((collectionName) => (
        <div key={collectionName} className="collection-group">
          <h4 onClick={() => toggleCollection(collectionName)} style={{ cursor: 'pointer' }}>
            {collectionName} ({groupedSongs[collectionName].length}곡)
            <span style={{ float: 'right' }}>{expandedCollections[collectionName] ? '▲' : '▼'}</span>
          </h4>
          {expandedCollections[collectionName] && (
            <div className="table-container">
              <table>
                <thead>
                  <tr><th>제목</th><th>가수</th><th>관리</th></tr>
                </thead>
                <tbody>
                  {groupedSongs[collectionName].map((song) => (
                    <tr key={song._id}>
                      <td>{song.title}</td>
                      <td>{song.artist}</td>
                      <td>
                        <button onClick={() => setEditingSong(song)} className="btn-blue" style={{ marginRight: '5px' }}>
                          {isAdmin ? '수정' : '수정 요청'}
                        </button>
                        <button onClick={() => handleDelete(song._id)} className="btn-primary">
                          {isAdmin ? '삭제' : '삭제 요청'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default SongList;