import React, { useState } from 'react';
import api from '../lib/api';

const RequestList = ({ requests, onRequestProcessed, showAlert, showConfirm }) => {
  const [loadingId, setLoadingId] = useState(null);
  const safeRequests = Array.isArray(requests) ? requests : [];

  const handleAction = (requestId, action) => { 
    const actionFn = async () => {
        setLoadingId(requestId);
        try {
            const response = await api.post(`/api/admin/requests/${requestId}/${action}`);
            showAlert(response.data.message, 'success');
            if (onRequestProcessed) onRequestProcessed();
        } catch (err) {
            showAlert('처리 실패', 'error');
        } finally {
            setLoadingId(null);
        }
    };
    showConfirm(`${action === 'approve' ? '승인' : '거절'} 하시겠습니까?`, actionFn);
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 shadow-xl border border-gray-700">
      <h3 className="text-2xl font-bold text-white mb-6">📩 대기 중인 요청 목록 ({safeRequests.length})</h3>
      
      <div className="h-[500px] overflow-y-auto bg-gray-900 rounded-lg border border-gray-700 p-2 custom-scrollbar">
        {safeRequests.length === 0 ? (
          <div className="text-center p-10 text-gray-500">대기 중인 요청이 없습니다.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-800 text-gray-400 border-b border-gray-700">
                <th className="p-3">유형</th>
                <th className="p-3">대상 정보</th>
                <th className="p-3">요청 내용</th>
                <th className="p-3">요청자</th>
                <th className="p-3 text-right">관리</th>
              </tr>
            </thead>
            <tbody>
              {safeRequests.map((req) => (
                <tr key={req._id} className="border-b border-gray-700 hover:bg-gray-800 transition">
                  <td className="p-3">
                    <span className={`inline-block px-2 py-1 rounded text-xs border ${req.requestType === 'delete' ? 'bg-red-900/50 text-red-300 border-red-800' : 'bg-blue-900/50 text-blue-300 border-blue-800'}`}>
                      {req.requestType.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-white">{req.data?.title || req.targetSongId?.title || '제목 없음'}</div>
                    <div className="text-gray-400 text-sm">{req.data?.artist || req.targetSongId?.artist || '가수 없음'}</div>
                  </td>
                  <td className="p-3 text-gray-300 text-sm">
                    {req.requestType === 'create' && `새 노래 (퀴즈 ${req.data?.quizzes?.length || 0}개)`}
                    {req.requestType === 'update' && `정보 수정`}
                    {req.requestType === 'delete' && '삭제 요청'}
                  </td>
                  <td className="p-3 text-gray-400 text-sm">
                    <div>{req.requesterEmail}</div>
                    <div className="text-xs">{new Date(req.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <button onClick={() => handleAction(req._id, 'approve')} disabled={loadingId === req._id} className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded text-sm transition disabled:opacity-50">승인</button>
                    <button onClick={() => handleAction(req._id, 'reject')} disabled={loadingId === req._id} className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-sm transition disabled:opacity-50">거절</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default RequestList;