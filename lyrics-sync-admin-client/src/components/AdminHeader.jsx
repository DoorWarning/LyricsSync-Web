import React from 'react';

const AdminHeader = ({ user, onLogout, requestCount, onToggleRequests, isRequestView }) => {
  const roleTitle = user?.role === 'admin' ? 'Admin' : 'Request';

  return (
    <header className="h-[60px] md:h-[70px] bg-panel border-b border-gray-700/50 flex items-center justify-between px-4 md:px-6 shadow-md z-20 shrink-0">
      <div 
        className="flex items-center gap-2 md:gap-3 cursor-pointer group" 
        onClick={() => isRequestView && onToggleRequests()}
      >
        <img src="/vite.svg" alt="Logo" className="w-6 h-6 md:w-8 md:h-8 group-hover:rotate-12 transition-transform duration-300" />
        <h1 className="text-lg md:text-xl font-bold text-white tracking-wide">
          LyricsSync <span className="text-brand-blue">{roleTitle}</span>
        </h1>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {user?.role === 'admin' && (
          <button 
            onClick={onToggleRequests}
            className={`relative px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-bold text-xs md:text-sm transition-all flex items-center gap-1 md:gap-2 ${
              isRequestView 
                ? 'bg-brand-blue text-black shadow-[0_0_10px_rgba(77,255,255,0.5)]' 
                : 'text-text-sub hover:bg-gray-700/50 hover:text-white'
            }`}
          >
            <span>📩 <span className="hidden md:inline">요청함</span></span>
            {requestCount > 0 && (
              <span className="bg-brand-pink text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full absolute -top-1 -right-1 shadow-sm">
                {requestCount}
              </span>
            )}
          </button>
        )}

        {user && (
          <div className="hidden md:flex items-center gap-3 bg-main/50 px-3 py-1.5 rounded-full border border-gray-600/50">
            {user.picture && (
              <img src={user.picture} alt="profile" className="w-6 h-6 rounded-full border border-gray-500" />
            )}
            <span className="text-sm text-text-sub font-medium pr-1">{user.name}</span>
          </div>
        )}

        <button 
          onClick={onLogout}
          className="text-text-sub hover:text-white hover:bg-red-500/20 hover:text-red-300 px-2 py-1.5 md:px-3 rounded-lg transition-all text-xs md:text-sm font-bold"
        >
          로그아웃
        </button>
      </div>
    </header>
  );
};

export default AdminHeader;