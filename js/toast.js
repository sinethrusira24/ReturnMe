export function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconClass = 'fa-info-circle';
    if (type === 'success') iconClass = 'fa-check-circle';
    if (type === 'error') iconClass = 'fa-circle-xmark';
    if (type === 'warning') iconClass = 'fa-triangle-exclamation';

    toast.innerHTML = `
        <i class="fa-solid ${iconClass}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    // Trigger animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

export function showVerificationModal(email, callback) {
    const modalHtml = `
        <div id="verificationModal" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 9999; backdrop-filter: blur(8px);">
            <div style="background: rgba(15, 23, 42, 0.95); padding: 2.5rem; border-radius: 20px; max-width: 420px; width: 90%; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.15); animation: popIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);">
                <div style="width: 80px; height: 80px; border-radius: 50%; background: rgba(16, 185, 129, 0.15); color: #10B981; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; margin: 0 auto 1.5rem; border: 2px solid rgba(16, 185, 129, 0.3);">
                    <i class="fa-regular fa-envelope-open"></i>
                </div>
                <h2 style="margin-bottom: 1rem; color: #F8FAFC; font-size: 1.6rem; font-weight: 700; letter-spacing: -0.5px;">Verify Your Email</h2>
                <p style="color: #94A3B8; margin-bottom: 2rem; line-height: 1.6; font-size: 1rem;">
                    We've sent a verification link to<br><strong style="color: #FFFFFF; font-weight: 600;">${email}</strong>.<br><br>Please check your inbox to activate your account.
                </p>
                <button id="closeVerifModal" style="width: 100%; padding: 1rem; border-radius: 12px; border: none; background: #10B981; color: white; font-weight: 600; font-size: 1rem; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);">
                    Continue to Login
                </button>
            </div>
        </div>
        <style>
            @keyframes popIn {
                0% { opacity: 0; transform: scale(0.9) translateY(20px); }
                100% { opacity: 1; transform: scale(1) translateY(0); }
            }
            #closeVerifModal:hover {
                background: #059669 !important;
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4) !important;
            }
        </style>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    document.getElementById('closeVerifModal').addEventListener('click', () => {
        const modal = document.getElementById('verificationModal');
        modal.style.opacity = '0';
        modal.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            modal.remove();
            if (callback) callback();
        }, 300);
    });
}
