/**
 * File Upload Component
 * Version: 1.0.0
 * Purpose: Drag-and-drop file upload with preview and metadata preparation.
 *          Structure is cloud-storage-ready (MongoDB metadata + separate storage URL).
 */

class FileUploadComponent {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.options = {
            maxFiles: options.maxFiles || 5,
            maxSizeMB: options.maxSizeMB || 10,
            acceptedTypes: options.acceptedTypes || ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xlsx', 'txt', 'jpg', 'png'],
            onFilesChanged: options.onFilesChanged || null,
        };

        this.files = []; // Array of { file: File, metadata: {...} }
        this._render();
        this._bindEvents();
    }

    _render() {
        this.container.innerHTML = `
            <div class="file-drop-zone" id="${this.container.id}_dropzone">
                <input type="file" id="${this.container.id}_input" multiple
                    accept="${this.options.acceptedTypes.map(t => '.' + t).join(',')}" />
                <div class="file-drop-icon"><i class="fa fa-cloud-upload-alt"></i></div>
                <div class="file-drop-text">Drag & drop files here, or click to browse</div>
                <div class="file-drop-sub">Accepted: ${this.options.acceptedTypes.join(', ')} &nbsp;·&nbsp; Max ${this.options.maxSizeMB}MB each</div>
            </div>
            <div class="file-preview-list" id="${this.container.id}_preview"></div>
        `;
    }

    _bindEvents() {
        const dropzone = this.container.querySelector('.file-drop-zone');
        const input = this.container.querySelector(`#${this.container.id}_input`);

        // Click to open file picker
        input.addEventListener('change', (e) => this._handleFiles(Array.from(e.target.files)));

        // Drag & drop
        dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('drag-over'); });
        dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('drag-over');
            this._handleFiles(Array.from(e.dataTransfer.files));
        });
    }

    _handleFiles(newFiles) {
        const accepted = newFiles.filter(f => {
            const ext = f.name.split('.').pop().toLowerCase();
            const sizeMB = f.size / (1024 * 1024);
            if (!this.options.acceptedTypes.includes(ext)) {
                this._showError(`File type .${ext} is not allowed.`);
                return false;
            }
            if (sizeMB > this.options.maxSizeMB) {
                this._showError(`${f.name} exceeds the ${this.options.maxSizeMB}MB limit.`);
                return false;
            }
            return true;
        });

        if (this.files.length + accepted.length > this.options.maxFiles) {
            this._showError(`You can only upload up to ${this.options.maxFiles} files.`);
            return;
        }

        accepted.forEach(file => {
            const metadata = {
                filename: file.name,
                size: this._formatSize(file.size),
                sizeBytes: file.size,
                type: file.type,
                extension: file.name.split('.').pop().toLowerCase(),
                uploadTimestamp: new Date().toISOString(),
                // These will be filled by the backend after upload:
                storageUrl: null,
                storageProvider: 'cloud', // e.g., cloudinary, s3, backblaze
                fileId: null,
            };
            this.files.push({ file, metadata });
        });

        this._renderPreview();
        if (this.options.onFilesChanged) this.options.onFilesChanged(this.getMetadata());
    }

    _renderPreview() {
        const preview = this.container.querySelector(`#${this.container.id}_preview`);
        if (!preview) return;

        if (this.files.length === 0) {
            preview.innerHTML = '';
            return;
        }

        preview.innerHTML = this.files.map((f, index) => `
            <div class="file-preview-item">
                <div class="file-preview-icon">
                    <i class="${this._getFileIcon(f.metadata.extension)}"></i>
                </div>
                <div class="file-preview-info">
                    <div class="file-preview-name">${f.metadata.filename}</div>
                    <div class="file-preview-size">${f.metadata.size} &nbsp;·&nbsp; ${f.metadata.extension.toUpperCase()}</div>
                </div>
                <button class="file-preview-remove" onclick="window._fileUploadComponents['${this.container.id}'].removeFile(${index})">
                    <i class="fa fa-times"></i>
                </button>
            </div>`).join('');

        // Register this instance globally for remove button callbacks
        if (!window._fileUploadComponents) window._fileUploadComponents = {};
        window._fileUploadComponents[this.container.id] = this;
    }

    removeFile(index) {
        this.files.splice(index, 1);
        this._renderPreview();
        if (this.options.onFilesChanged) this.options.onFilesChanged(this.getMetadata());
    }

    getFiles() { return this.files.map(f => f.file); }

    getMetadata() { return this.files.map(f => f.metadata); }

    clear() { this.files = []; this._renderPreview(); }

    _formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    _getFileIcon(ext) {
        const icons = {
            pdf: 'fa fa-file-pdf', doc: 'fa fa-file-word', docx: 'fa fa-file-word',
            ppt: 'fa fa-file-powerpoint', pptx: 'fa fa-file-powerpoint',
            xlsx: 'fa fa-file-excel', xls: 'fa fa-file-excel',
            jpg: 'fa fa-file-image', jpeg: 'fa fa-file-image', png: 'fa fa-file-image',
            txt: 'fa fa-file-alt',
        };
        return icons[ext] || 'fa fa-file';
    }

    _showError(message) {
        const e = document.createElement('div');
        e.style.cssText = 'position:fixed;bottom:30px;right:30px;z-index:99999;padding:12px 20px;border-radius:12px;font-weight:700;font-size:0.85rem;background:#dc3545;color:#fff;box-shadow:0 8px 24px rgba(0,0,0,0.15);';
        e.textContent = '⚠ ' + message;
        document.body.appendChild(e);
        setTimeout(() => e.remove(), 3500);
    }
}

// Expose globally
window.FileUploadComponent = FileUploadComponent;
