import React, { useState, useMemo } from 'react';
import api from '../lib/api';

const SongList = ({ songs, user, onSongDeleted, setEditingSong, onAddSong, showAlert, showConfirm }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("playlist"); 
  const [expandedPlaylists, setExpandedPlaylists] = useState({});

  const isAdmin = user?.role === 'admin';

  const filteredSongs = songs.filter(song => 
    song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedSongs = useMemo(() => {
    const groups = {};
    filteredSongs.forEach(song => {
      const collections = song.collectionNames && song.collectionNames.length > 0 ? song.collectionNames : ['미분류'];
      collections.forEach(col => {
        if (!groups[col]) groups[col] = [];
        groups[col].push(song);
      });
    });
    return groups;
  }, [filteredSongs]);

  const togglePlaylist = (name) => {
    setExpandedPlaylists(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handleDelete = (songId) => {
    const action = async () => {
      try {
        const url = isAdmin ? `/api/admin/songs/${songId}` : `/api/admin/request`;
        const body = isAdmin ? {} : { requestType: 'delete', targetSongId: songId };
        isAdmin ? await api.delete(url) : await api.post(url, body);
        showAlert(isAdmin ? '삭제되었습니다.' : '삭제 요청 전송됨', 'success');
        onSongDeleted();
      } catch (err) {
        showAlert('삭제 실패', 'error');
      }
    };
    showConfirm('정말 삭제하시겠습니까?', action);
  };

  // 테이블 렌더링
  const RenderTable = ({ data }) => (
    <div className="overflow-x-auto pb-10 md:pb-0">
      <table className="w-full text-left border-collapse min-w-[500px] md:min-w-0">
        <thead className="sticky top-0 z-10 bg-panel text-text-sub border-b-2 border-brand-blue/30 shadow-md">
          <tr>
            <th className="p-3 w-[35%]">제목</th>
            <th className="p-3 w-[25%]">가수</th>
            <th className="p-3 w-[20%] text-center">정보</th>
            <th className="p-3 text-right">관리</th>
          </tr>
        </thead>
        <tbody>
          {data.map(song => (
            <tr key={song._id} className="border-b border-gray-700/50 hover:bg-white/5 transition-colors">
              <td className="p-3 font-bold text-white truncate max-w-[150px]">{song.title}</td>
              <td className="p-3 text-text-sub truncate max-w-[100px]">{song.artist}</td>
              <td className="p-3 text-center">
                <span className="inline-block bg-brand-blue/10 text-brand-blue text-xs px-2 py-1 rounded border border-brand-blue/30 font-bold whitespace-nowrap">
                  문제 {song.quizzes?.length || 0}
                </span>
              </td>
              <td className="p-3 text-right space-x-2 whitespace-nowrap">
                <button onClick={() => setEditingSong(song)} className="bg-brand-dark hover:bg-brand-blue hover:text-black text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm">수정</button>
                <button onClick={() => handleDelete(song._id)} className="bg-red-500/80 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm">삭제</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="bg-panel rounded-xl p-4 md:p-6 shadow-2xl border border-gray-700/50 h-full flex flex-col relative">
      
      {/* 1. 상단 (검색) */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 md:mb-6 gap-3 shrink-0">
        <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2 self-start md:self-center">
          <span className="text-brand-blue">🎵</span> 노래 목록
        </h2>
        <input 
          type="text" 
          placeholder="제목/가수 검색..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="bg-input text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-brand-blue outline-none w-full md:w-64 transition-all shadow-inner"
        />
      </div>

      {/* 2. 탭 */}
      <div className="flex border-b border-gray-700/50 mb-4 shrink-0 gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
        <button 
          onClick={() => setActiveTab('playlist')} 
          className={`px-4 py-2 font-bold transition-all text-sm md:text-base ${activeTab === 'playlist' ? 'text-brand-blue border-b-2 border-brand-blue' : 'text-text-sub hover:text-white'}`}
        >
          📂 플레이리스트
        </button>
        <button 
          onClick={() => setActiveTab('all')} 
          className={`px-4 py-2 font-bold transition-all text-sm md:text-base ${activeTab === 'all' ? 'text-brand-blue border-b-2 border-brand-blue' : 'text-text-sub hover:text-white'}`}
        >
          🎼 전체 목록 ({filteredSongs.length})
        </button>
      </div>

      {/* 3. 리스트 */}
      <div className="flex-1 overflow-y-auto bg-input/50 rounded-lg border border-gray-700/50 p-2 custom-scrollbar relative">
        {activeTab === 'playlist' ? (
          Object.keys(groupedSongs).length === 0 ? <div className="text-center p-10 text-text-sub">데이터가 없습니다.</div> :
          Object.keys(groupedSongs).sort().map(group => (
            <div key={group} className="mb-3">
              <div 
                onClick={() => togglePlaylist(group)} 
                className="flex justify-between items-center bg-panel p-3 rounded-lg cursor-pointer hover:bg-brand-dark/20 transition border border-gray-700/50 shadow-sm"
              >
                <span className="font-bold text-white text-base md:text-lg pl-2 border-l-4 border-brand-blue/50 flex items-center gap-2 truncate">
                  {group} <span className="text-text-sub text-xs md:text-sm font-normal">({groupedSongs[group].length})</span>
                </span>
                <span className="text-brand-blue pr-2">{expandedPlaylists[group] ? '▲' : '▼'}</span>
              </div>
              {expandedPlaylists[group] && (
                <div className="mt-2 pl-0 md:pl-2 md:border-l-2 md:border-gray-700/30 md:ml-4">
                  <RenderTable data={groupedSongs[group]} />
                </div>
              )}
            </div>
          ))
        ) : (
          <RenderTable data={filteredSongs} />
        )}
      </div>

      {/* ⭐ [모바일 전용] 플로팅 추가 버튼 (SVG 아이콘 적용) */}
      <button 
        onClick={onAddSong}
        className="md:hidden absolute bottom-6 right-6 w-14 h-14 bg-brand-blue text-black rounded-full shadow-[0_0_15px_rgba(77,255,255,0.6)] flex items-center justify-center z-20 active:scale-95 transition-transform"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>
    </div>
  );
};

export default SongList;