// src/components/AdminHeader.jsx
import React from 'react';

const AdminHeader = ({ user, activeTab, setActiveTab, onLogout }) => {
  // user 객체가 null 또는 undefined일 때 이 컴포넌트가 렌더링되지 않도록 
  // App.jsx에서 제어하지만, 만약을 위해 JSX 내부에서도 안전하게 처리합니다.
  
  return (
    <header className="admin-header">
      <div style={{ textAlign: 'left' }}>
        <h1>DB 관리 대시보드</h1>
        {/* ⭐ [수정] user?.name, user?.role로 안전하게 접근 */}
        <p style={{ margin: 0, color: 'var(--accent-blue)', marginTop: '5px' }}>
          {user?.name} ({user?.role === 'admin' ? '관리자' : '뷰어'}) 님
        </p>
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        {/* ⭐ [수정] user?.role로 안전하게 접근 */}
        {user?.role === 'admin' && (
          <>
            <button 
              className={activeTab === 'songs' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setActiveTab('songs')}
            >
              노래 관리
            </button>
            <button 
              className={activeTab === 'requests' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setActiveTab('requests')}
            >
              요청 관리
            </button>
          </>
        )}
        <button onClick={onLogout} className="btn-secondary">로그아웃</button>
      </div>
    </header>
  );
};

export default AdminHeader;