import React from 'react';

const AlertModal = ({ isOpen, message, type, onClose, onConfirm }) => {
  if (!isOpen) return null;

  const isConfirm = type === 'confirm';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-600 max-w-sm w-full p-6 transform transition-all scale-100">
        <div className="text-center mb-6">
          <div className="text-4xl mb-4">
            {type === 'success' && '✅'}
            {type === 'error' && '⚠️'}
            {type === 'info' && 'ℹ️'}
            {type === 'confirm' && '❓'}
          </div>
          <h3 className="text-lg font-bold text-white mb-2">
            {type === 'success' && '성공'}
            {type === 'error' && '오류'}
            {type === 'info' && '알림'}
            {type === 'confirm' && '확인'}
          </h3>
          <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{message}</p>
        </div>

        <div className="flex gap-3 justify-center">
          {isConfirm ? (
            <>
              <button 
                onClick={onClose} 
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition font-medium"
              >
                취소
              </button>
              <button 
                onClick={onConfirm} 
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition font-medium"
              >
                확인
              </button>
            </>
          ) : (
            <button 
              onClick={onClose} 
              className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition font-medium"
            >
              확인
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertModal;