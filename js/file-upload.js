import { showToast } from './toast.js';

export function initFileUpload() {
    const fileUploadBoxes = document.querySelectorAll('.file-upload-box');

    fileUploadBoxes.forEach(box => {
        const fileInput = box.querySelector('.file-input');
        if (!fileInput) return;

        // Store original content for restoring later
        const originalHTML = box.innerHTML;

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Validate file size (5MB max)
            const maxSize = 5 * 1024 * 1024;
            if (file.size > maxSize) {
                showToast(`File "${file.name}" exceeds the 5MB size limit.`, 'error');
                fileInput.value = '';
                return;
            }

            // Format file size
            const sizeStr = file.size < 1024 * 1024
                ? (file.size / 1024).toFixed(1) + ' KB'
                : (file.size / (1024 * 1024)).toFixed(2) + ' MB';

            // Check if it's an image for preview
            const isImage = file.type.startsWith('image/');

            if (isImage) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    renderPreview(box, fileInput, file.name, sizeStr, ev.target.result);
                };
                reader.readAsDataURL(file);
            } else {
                // Non-image file (e.g. PDF) — show icon preview
                renderPreview(box, fileInput, file.name, sizeStr, null);
            }
        });

        function renderPreview(box, input, fileName, fileSize, imageSrc) {
            // Hide original content, keep the input
            box.classList.add('has-file');

            // Remove any existing preview
            const existingPreview = box.querySelector('.file-preview');
            if (existingPreview) existingPreview.remove();

            // Hide original icons/text
            const originalElements = box.querySelectorAll(':scope > i, :scope > span, :scope > small');
            originalElements.forEach(el => el.style.display = 'none');

            // Create preview
            const preview = document.createElement('div');
            preview.className = 'file-preview';

            if (imageSrc) {
                const thumb = document.createElement('img');
                thumb.className = 'file-preview-thumb';
                thumb.src = imageSrc;
                thumb.alt = `Preview of ${fileName}`;
                preview.appendChild(thumb);
            } else {
                const iconThumb = document.createElement('div');
                iconThumb.className = 'file-preview-thumb';
                iconThumb.style.cssText = 'display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.05);font-size:1.5rem;color:var(--text-muted);';
                iconThumb.innerHTML = '<i class="fa-solid fa-file-pdf"></i>';
                preview.appendChild(iconThumb);
            }

            const info = document.createElement('div');
            info.className = 'file-preview-info';
            info.innerHTML = `
                <span class="file-preview-name">${escapeHtml(fileName)}</span>
                <span class="file-preview-size">${fileSize}</span>
            `;
            preview.appendChild(info);

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'file-preview-remove';
            removeBtn.setAttribute('aria-label', `Remove file ${fileName}`);
            removeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
            removeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                input.value = '';
                preview.remove();
                box.classList.remove('has-file');
                originalElements.forEach(el => el.style.display = '');
                showToast('File removed.', 'info');
            });
            preview.appendChild(removeBtn);

            box.appendChild(preview);
        }
    });
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
