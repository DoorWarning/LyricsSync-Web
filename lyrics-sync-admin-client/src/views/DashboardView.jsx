import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import SongList from '../components/SongList';
import SongForm from '../components/SongForm';
import RequestList from '../components/RequestList';
import AlertModal from '../components/AlertModal';
import AdminHeader from '../components/AdminHeader';

export default function DashboardView({ user, token, onLogout }) {
  const [isRequestView, setIsRequestView] = useState(false);
  const [showMobileForm, setShowMobileForm] = useState(false);
  
  const [songs, setSongs] = useState([]);
  const [requests, setRequests] = useState([]);
  const [editingSong, setEditingSong] = useState(null);
  
  const [alertInfo, setAlertInfo] = useState({ isOpen: false, message: '', type: 'info' });
  const [confirmInfo, setConfirmInfo] = useState({ isOpen: false, message: '', onConfirm: null });

  const userRole = user?.role || 'viewer';

  const fetchData = async () => {
    if (!token) return;
    try {
      const [songsRes, reqRes] = await Promise.all([
        api.get('/api/admin/songs'),
        userRole === 'admin' ? api.get('/api/admin/requests') : Promise.resolve({ data: { requests: [] } })
      ]);

      setSongs(songsRes.data.songs || []);
      setRequests(reqRes.data.requests || []);
    } catch (err) {
      console.error("데이터 로딩 실패:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token, user]);

  const handleEditSong = (song) => {
    setEditingSong(song);
    setShowMobileForm(true);
  };

  const handleAddSong = () => {
    setEditingSong(null);
    setShowMobileForm(true);
  };

  const handleCancelForm = () => {
    setEditingSong(null);
    setShowMobileForm(false);
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (editingSong) {
        const url = userRole === 'admin' ? `/api/admin/songs/${editingSong._id}` : `/api/admin/request`;
        const body = userRole === 'admin' ? formData : { requestType: 'update', targetSongId: editingSong._id, data: formData };
        
        userRole === 'admin' ? await api.put(url, body) : await api.post(url, body);
        showAlert(userRole === 'admin' ? '수정 작업이 처리되었습니다.' : '수정 요청이 전송되었습니다.', 'success');
      } else {
        const url = userRole === 'admin' ? `/api/admin/songs` : `/api/admin/request`;
        const body = userRole === 'admin' ? formData : { requestType: 'create', data: formData };
        
        await api.post(url, body);
        showAlert(userRole === 'admin' ? '추가 작업이 처리되었습니다.' : '추가 요청이 전송되었습니다.', 'success');
      }
      fetchData();
      handleCancelForm();
    } catch (err) {
      showAlert('작업 실패: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  const showAlert = (message, type) => setAlertInfo({ isOpen: true, message, type });
  const showConfirm = (message, onConfirm) => setConfirmInfo({ isOpen: true, message, onConfirm });

  const toggleRequests = () => {
    setIsRequestView(!isRequestView);
    setEditingSong(null);
    setShowMobileForm(false);
  };

  if (!user) return <div className="min-h-screen bg-main flex items-center justify-center text-text-main">Loading...</div>;

  return (
    <div className="h-dvh bg-main text-text-main flex flex-col overflow-hidden font-sans">
      <AdminHeader 
        user={user} 
        onLogout={onLogout} 
        requestCount={requests.length} 
        onToggleRequests={toggleRequests}
        isRequestView={isRequestView}
      />
      
      <div className="flex flex-1 overflow-hidden relative">
        {isRequestView ? (
          <main className="flex-1 p-4 md:p-6 w-full h-full bg-main overflow-hidden">
            <div className="h-full flex flex-col max-w-6xl mx-auto">
              <div className="flex justify-between items-center mb-4 shrink-0">
                <h2 className="text-xl md:text-2xl font-bold text-brand-blue">📩 요청 관리</h2>
                <button onClick={toggleRequests} className="text-text-sub hover:text-white transition-colors p-2">✕ 닫기</button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <RequestList 
                    requests={requests} 
                    token={token} 
                    onRequestProcessed={fetchData} 
                    showAlert={showAlert} 
                    showConfirm={showConfirm} 
                />
              </div>
            </div>
          </main>
        ) : (
          <main className="flex flex-1 w-full h-full relative">
            <div className={`
              transition-transform duration-300 ease-in-out
              ${showMobileForm ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
              absolute inset-0 md:static md:inset-auto
              w-full md:w-[480px] bg-panel md:border-r border-gray-700/50 
              h-full overflow-hidden shadow-2xl z-30 flex flex-col
            `}>
              <SongForm 
                onSubmit={handleFormSubmit} 
                initialData={editingSong} 
                onCancel={handleCancelForm}
                userRole={userRole} // ⭐ [추가] userRole 전달
              />
            </div>

            <div className="flex-1 bg-main p-4 md:p-6 h-full overflow-hidden">
              <SongList 
                songs={songs} 
                user={user} 
                token={token} 
                onSongDeleted={fetchData} 
                setEditingSong={handleEditSong} 
                onAddSong={handleAddSong}
                showAlert={showAlert} 
                showConfirm={showConfirm} 
              />
            </div>
          </main>
        )}
      </div>

      <AlertModal isOpen={alertInfo.isOpen} message={alertInfo.message} type={alertInfo.type} onClose={() => setAlertInfo({ ...alertInfo, isOpen: false })} />
      <AlertModal isOpen={confirmInfo.isOpen} message={confirmInfo.message} type="confirm" onConfirm={() => { confirmInfo.onConfirm(); setConfirmInfo({ ...confirmInfo, isOpen: false }); }} onClose={() => setConfirmInfo({ ...confirmInfo, isOpen: false })} />
    </div>
  );
}