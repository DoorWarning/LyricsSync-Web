// src/components/RequestList.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RequestList = ({ user, token, onRequestHandled, apiUrl }) => {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await axios.get(`${apiUrl}/requests`, {
        headers: { 'Authorization': token, 'x-user-email': user.email }
      });
      setRequests(response.data.requests);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAction = async (requestId, action) => { 
    if (!window.confirm(`${action === 'approve' ? '승인' : '거절'} 하시겠습니까?`)) return;
    try {
      const response = await axios.post(`${apiUrl}/requests/${requestId}/${action}`, {}, {
        headers: { 'Authorization': token, 'x-user-email': user.email }
      });
      alert(response.data.message);
      fetchRequests(); 
      if (action === 'approve') onRequestHandled(); 
    } catch (err) {
      alert('처리 실패: ' + err.response?.data?.message);
    }
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