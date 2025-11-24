// src/views/DashboardView.jsx
import React from 'react';
import AdminHeader from '../components/AdminHeader';
import QuizMaker from '../components/QuizMaker';
import SongForm from '../components/SongForm';
import SongList from '../components/SongList';
import RequestList from '../components/RequestList';

const DashboardView = ({ 
  user, token, apiUrl, 
  songs, fetchSongs, 
  editingSong, setEditingSong, 
  formData, setFormData, 
  activeTab, setActiveTab, onLogout 
}) => {
  return (
    <>
      <AdminHeader 
        user={user} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={onLogout} 
      />

      <main className="dashboard-container">
        {/* 탭 1: 노래 관리 (기본 화면) */}
        {activeTab === 'songs' && (
          <>
            {/* 왼쪽 패널: 생성 도구 */}
            <div className="dashboard-left">
              <QuizMaker user={user} token={token} setFormData={setFormData} apiUrl={apiUrl} />
              <SongForm 
                user={user}
                token={token}
                editingSong={editingSong}
                setEditingSong={setEditingSong}
                refreshSongs={fetchSongs}
                formData={formData}
                setFormData={setFormData}
                apiUrl={apiUrl}
              />
            </div>
            
            {/* 오른쪽 패널: 목록 */}
            <div className="dashboard-right">
              <SongList 
                songs={songs} 
                user={user}
                token={token} 
                onSongDeleted={fetchSongs}
                setEditingSong={setEditingSong}
                apiUrl={apiUrl}
              />
            </div>
          </>
        )}

        {/* 탭 2: 요청 관리 (관리자 전용) */}
        {activeTab === 'requests' && user.role === 'admin' && (
          <div style={{ width: '100%' }}>
            <RequestList user={user} token={token} onRequestHandled={fetchSongs} apiUrl={apiUrl} />
          </div>
        )}
      </main>
    </>
  );
};

export default DashboardView;