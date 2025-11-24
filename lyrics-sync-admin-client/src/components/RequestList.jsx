// src/components/RequestList.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// ⭐ [수정] showAlert, showConfirm Props 추가
const RequestList = ({ user, token, onRequestHandled, apiUrl, showAlert, showConfirm }) => {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await axios.get(`${apiUrl}/requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setRequests(response.data.requests);
    } catch (err) {
      console.error(err);
      // (선택) 로딩 실패 시에도 커스텀 알림을 띄울 수 있습니다.
      // showAlert('요청 목록을 불러오지 못했습니다.', 'error');
    }
  };

  // ⭐ [수정] 커스텀 팝업 적용
  const handleAction = (requestId, action) => { 
    const actionText = action === 'approve' ? '승인' : '거절';

    // 확인 버튼을 눌렀을 때 실행될 실제 로직
    const actionFn = async () => {
        try {
            const response = await axios.post(`${apiUrl}/requests/${requestId}/${action}`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            // 성공 알림
            showAlert(response.data.message, 'success');
            
            fetchRequests(); // 목록 갱신
            if (action === 'approve') onRequestHandled(); // 승인이면 전체 노래 목록도 갱신
            
        } catch (err) {
            // 실패 알림
            showAlert('처리 실패: ' + (err.response?.data?.message || err.message), 'error');
        }
    };

    // 커스텀 확인창 호출
    showConfirm(`${actionText} 하시겠습니까?`, actionFn);
  };

  return (
    <div className="list-panel">
      <h3>대기 중인 수정 요청 ({requests.length})</h3>
      {requests.length === 0 && <p>대기 중인 요청이 없습니다.</p>}
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {requests.map(req => (
          <div key={req._id} className="panel" style={{ border: '1px solid var(--accent-blue)', padding: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ color: 'var(--accent-pink)', fontWeight: 'bold' }}>
                [{req.requestType.toUpperCase()}]
              </span>
              <span style={{ color: 'gray', fontSize: '0.9em' }}>
                요청자: {req.requesterEmail} | {new Date(req.createdAt).toLocaleString()}
              </span>
            </div>
            
            {/* 요청 내용 미리보기 */}
            <div style={{ marginBottom: '10px', fontSize: '0.9em', textAlign: 'left' }}>
              {req.requestType === 'delete' ? (
                 <p>대상 곡 ID: {req.targetSongId?._id || req.targetSongId} (삭제 요청)</p>
              ) : (
                <>
                  <p><strong>제목:</strong> {req.data.title}</p>
                  <p><strong>가수:</strong> {req.data.artist}</p>
                  <p><strong>번역:</strong> {req.data.translated_lyrics?.substring(0, 50)}...</p>
                </>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => handleAction(req._id, 'approve')} className="btn-primary" style={{ flex: 1 }}>승인</button>
              <button onClick={() => handleAction(req._id, 'reject')} className="btn-secondary" style={{ flex: 1 }}>거절</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RequestList;