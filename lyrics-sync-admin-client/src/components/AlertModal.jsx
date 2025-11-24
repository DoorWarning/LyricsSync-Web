import React from 'react';

const AlertModal = ({ customAlert, setCustomAlert }) => {
    if (!customAlert) return null;

    const { message, type, confirmAction } = customAlert;
    const isConfirm = type === 'confirm';

    const handleConfirm = () => {
        if (isConfirm && confirmAction) confirmAction();
        setCustomAlert(null);
    };

    const handleCancel = () => {
        setCustomAlert(null);
    };
    
    const color = type === 'error' ? '#FF5757' : (type === 'success' ? '#2ECC71' : 'var(--accent-pink)');
    const title = type === 'confirm' ? '확인 필요' : (type === 'error' ? '오류 발생' : (type === 'success' ? '성공' : '알림'));

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ border: `2px solid ${color}` }}>
                <h3 style={{ color: color, margin: '0 0 15px 0' }}>{title}</h3>
                <p style={{ whiteSpace: 'pre-wrap', marginBottom: '25px' }}>{message}</p>
                
                {/* ⭐ [수정] justifyContent: 'center'로 변경하여 중앙 정렬 */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                    {isConfirm && (
                        <button onClick={handleCancel} className="btn-secondary">
                            취소
                        </button>
                    )}
                    <button 
                        onClick={handleConfirm} 
                        className={isConfirm ? 'btn-primary' : (type === 'error' ? 'btn-danger' : 'btn-blue')}
                    >
                        {isConfirm ? '확인' : '닫기'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AlertModal;