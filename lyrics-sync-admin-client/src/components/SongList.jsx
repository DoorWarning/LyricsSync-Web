// src/components/SongList.jsx
import React, { useState, useMemo } from 'react';
import axios from 'axios';

const SongList = ({ songs, user, token, onSongDeleted, setEditingSong, apiUrl, showAlert, showConfirm }) => {
  const [expandedCollections, setExpandedCollections] = useState({});
  
  // ⭐ [수정] user가 null일 경우를 대비해 '?.' 사용
  const isAdmin = user?.role === 'admin';

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

  const handleDelete = (songId, isDeleteRequest) => {
    const headers = { 'Authorization': `Bearer ${token}` };
    const isDeleteImmediate = isAdmin && !isDeleteRequest;

    const action = async () => {
      try {
        if (isDeleteImmediate) {
          // 관리자: 즉시 삭제
          await axios.delete(`${apiUrl}/songs/${songId}`, { headers });
          showAlert('삭제되었습니다.', 'success');
        } else {
          // 일반 유저: 삭제 요청
          await axios.post(`${apiUrl}/request`, { requestType: 'delete', targetSongId: songId }, { headers });
          showAlert('삭제 요청이 전송되었습니다.', 'success');
        }
        onSongDeleted(songId); 
      } catch (err) {
        showAlert('삭제 실패: ' + (err.response?.data?.message || err.message), 'error');
      }
    };
    
    const message = isDeleteImmediate ? '정말로 삭제하시겠습니까? (즉시 반영)' : '삭제 요청을 보내시겠습니까?';
    showConfirm(message, action);
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
                        <button onClick={() => handleDelete(song._id, !isAdmin)} className="btn-primary">
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