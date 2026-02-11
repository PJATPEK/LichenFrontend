// ============================================
// CONFIGURATION
// ============================================

function getApiUrl() {
    const apiUrlInput = document.getElementById('api-url');
    let url = apiUrlInput ? apiUrlInput.value.trim() : '';
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    return url || 'http://localhost:7860';
}

// ============================================
// CONNECTION TESTING
// ============================================

document.addEventListener('DOMContentLoaded', function () {
    const testConnectionBtn = document.getElementById('test-connection');
    if (testConnectionBtn) {
        testConnectionBtn.addEventListener('click', testBackendConnection);
    }
    setTimeout(testBackendConnection, 500);

    const uploadForm = document.getElementById('upload-form');
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleImageUpload);
    }

    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', function () {
            darkModeEnabled = !darkModeEnabled;
            document.body.classList.toggle('dark-mode');
            this.textContent = darkModeEnabled ? '☀️' : '🌙';
        });
    }
});

async function testBackendConnection() {
    const statusElement = document.getElementById('connection-status');
    const apiUrl = getApiUrl();

    if (!apiUrl || apiUrl === 'http://localhost:7860') {
        statusElement.textContent = '⚠️ Please enter your Hugging Face Space URL';
        statusElement.className = 'error';
        return;
    }

    statusElement.textContent = 'Testing...';
    statusElement.className = '';

    try {
        const response = await fetch(`${apiUrl}/`, { method: 'GET', mode: 'cors' });
        if (response.ok) {
            statusElement.textContent = '✓ Connected';
            statusElement.className = 'success';
            console.log('Backend is accessible');
        } else {
            throw new Error(`Status ${response.status}`);
        }
    } catch (error) {
        statusElement.textContent = '✗ Connection Failed';
        statusElement.className = 'error';
        console.error('Connection test failed:', error);
    }
}

// ============================================
// DARK MODE STATE
// ============================================

let darkModeEnabled = false;

// ============================================
// MAIN APPLICATION STATE
// ============================================

let currentDetections = [];
let originalImageSrc = null;
let originalImageWithoutBboxSrc = null;
let activeDetectionId = null;
let activeBbox = null;
let zoomLevel = 1;
let panX = 0;
let panY = 0;
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

// ============================================
// IMAGE UPLOAD AND PREDICTION
// ============================================

async function handleImageUpload(e) {
    e.preventDefault();

    const fileInput = document.getElementById('image-input');
    if (!fileInput || !fileInput.files || !fileInput.files[0]) {
        alert('Please select an image file');
        return;
    }

    const apiUrl = getApiUrl();
    if (!apiUrl || apiUrl === 'http://localhost:7860') {
        alert('Please enter your Hugging Face Space URL in the Backend API URL field');
        return;
    }

    closeDetectionPanel();

    const submitButton = document.querySelector('#upload-form button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.textContent = 'Processing...';
    submitButton.disabled = true;

    const file = fileInput.files[0];

    try {
        // Step 1: Convert image file → base64 data URL
        const base64Image = await fileToBase64(file);

        // Step 2: POST to Gradio's named API endpoint
        // Gradio /call/<api_name> expects { data: [...inputs] }
        // then you GET /call/<api_name>/<event_id> to retrieve the result.
        // But for simple JSON outputs the /call endpoint returns the result directly.
        const callUrl = `${apiUrl}/call/predict_api`;
        console.log('POST →', callUrl);

        const postResp = await fetch(callUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: [base64Image] })
        });

        if (!postResp.ok) {
            const txt = await postResp.text();
            throw new Error(`POST failed (${postResp.status}): ${txt}`);
        }

        const postJson = await postResp.json();
        console.log('POST response:', postJson);

        const resultData = postJson;

        if (!resultData.success) {
            throw new Error(resultData.error || 'Detection failed');
        }
        
        const imgElement = document.getElementById('result-image');
        originalImageSrc = 'data:image/jpeg;base64,' + resultData.result_image_base64;
        imgElement.src = originalImageSrc;
        
        currentDetections = resultData.detections || [];
        originalImageWithoutBboxSrc = base64Image;
        
        imgElement.onload = function () {
            setupImageClickHandlers(imgElement, currentDetections);
        };
        
        document.getElementById('result-container').style.display = 'block';
        document.getElementById('result-container').scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });

        // Step 4: Use the result
        if (!resultData.success) {
            throw new Error(resultData.error || 'Detection failed');
        }

        const imgElement = document.getElementById('result-image');
        originalImageSrc = 'data:image/jpeg;base64,' + resultData.result_image_base64;
        imgElement.src = originalImageSrc;

        currentDetections = resultData.detections || [];
        originalImageWithoutBboxSrc = base64Image;

        imgElement.onload = function () {
            setupImageClickHandlers(imgElement, resultData.detections || []);
        };

        document.getElementById('result-container').style.display = 'block';
        document.getElementById('result-container').scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });

        fileInput.value = '';

    } catch (error) {
        console.error('Error:', error);
        alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
    }
}

// Helper: File → base64 data URL
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ============================================
// IMAGE INTERACTION SETUP
// ============================================

function setupImageClickHandlers(imgElement, detections) {
    const imageContainer = document.getElementById('image-container');

    imageContainer.querySelectorAll('.bbox-overlay').forEach(o => o.remove());
    const existingCanvas = document.getElementById('blur-canvas');
    if (existingCanvas) existingCanvas.remove();

    if (!detections || detections.length === 0) {
        console.log('No detections to display');
        return;
    }

    setTimeout(() => {
        const scaleX = imgElement.offsetWidth  / imgElement.naturalWidth;
        const scaleY = imgElement.offsetHeight / imgElement.naturalHeight;
        const imgOffsetLeft = imgElement.offsetLeft;
        const imgOffsetTop  = imgElement.offsetTop;

        detections.forEach(detection => {
            const bbox    = detection.bbox;
            const overlay = document.createElement('div');
            overlay.className = 'bbox-overlay';
            overlay.dataset.detectionId = detection.id;

            overlay.style.position = 'absolute';
            overlay.style.left     = (imgOffsetLeft + bbox.x1 * scaleX) + 'px';
            overlay.style.top      = (imgOffsetTop  + bbox.y1 * scaleY) + 'px';
            overlay.style.width    = ((bbox.x2 - bbox.x1) * scaleX) + 'px';
            overlay.style.height   = ((bbox.y2 - bbox.y1) * scaleY) + 'px';
            overlay.style.cursor   = 'pointer';
            overlay.style.transition = 'all 0.3s ease';

            overlay.addEventListener('mouseenter', function () {
                if (activeDetectionId !== detection.id)
                    this.style.backgroundColor = 'rgba(76, 175, 80, 0.2)';
            });
            overlay.addEventListener('mouseleave', function () {
                if (activeDetectionId !== detection.id)
                    this.style.backgroundColor = 'transparent';
            });
            overlay.addEventListener('click', function () {
                showDetectionPanel(detection, imgElement);
            });

            imageContainer.appendChild(overlay);
        });
    }, 100);
}

// ============================================
// BLUR EFFECT
// ============================================

function applySelectiveBlur(imgElement, bbox) {
    const imageContainer = document.getElementById('image-container');
    const existingCanvas = document.getElementById('blur-canvas');
    if (existingCanvas) existingCanvas.remove();

    if (originalImageWithoutBboxSrc) imgElement.src = originalImageWithoutBboxSrc;

    const applyBlur = () => {
        const canvas = document.createElement('canvas');
        canvas.id = 'blur-canvas';
        const ctx = canvas.getContext('2d');

        const displayWidth  = imgElement.offsetWidth;
        const displayHeight = imgElement.offsetHeight;
        canvas.width  = displayWidth;
        canvas.height = displayHeight;

        const scaleX = displayWidth  / imgElement.naturalWidth;
        const scaleY = displayHeight / imgElement.naturalHeight;
        const x1 = bbox.x1 * scaleX, y1 = bbox.y1 * scaleY;
        const x2 = bbox.x2 * scaleX, y2 = bbox.y2 * scaleY;

        const img = new Image();
        img.src = originalImageWithoutBboxSrc || originalImageSrc;
        img.onload = function () {
            ctx.filter = 'blur(8px)';
            ctx.drawImage(img, 0, 0, displayWidth, displayHeight);
            ctx.filter = 'none';
            ctx.globalCompositeOperation = 'destination-out';
            ctx.fillRect(x1, y1, x2 - x1, y2 - y1);

            canvas.style.position      = 'absolute';
            canvas.style.top           = imgElement.offsetTop  + 'px';
            canvas.style.left          = imgElement.offsetLeft + 'px';
            canvas.style.width         = displayWidth  + 'px';
            canvas.style.height        = displayHeight + 'px';
            canvas.style.pointerEvents = 'none';

            imageContainer.appendChild(canvas);
            setTimeout(() => canvas.classList.add('active'), 10);
        };
    };

    if (originalImageWithoutBboxSrc && imgElement.src !== originalImageWithoutBboxSrc) {
        imgElement.onload = applyBlur;
    } else {
        applyBlur();
    }
}

// ============================================
// DETECTION PANEL
// ============================================

function showDetectionPanel(detection, imgElement) {
    activeDetectionId = detection.id;
    activeBbox = detection.bbox;

    const isMobile = window.innerWidth <= 768;
    const existingPanel = document.querySelector('.info-panel');
    if (existingPanel) existingPanel.remove();

    document.getElementById('image-container').classList.add('shifted');
    zoomLevel = 1; panX = 0; panY = 0;

    applySelectiveBlur(imgElement, detection.bbox);
    setupZoomPanControls(imgElement);

    document.querySelectorAll('.bbox-overlay').forEach(o => {
        o.classList.remove('active');
        o.style.backgroundColor = 'transparent';
    });
    const activeOverlay = document.querySelector(`[data-detection-id="${detection.id}"]`);
    if (activeOverlay) activeOverlay.classList.add('active');

    const panel = document.createElement('div');
    panel.className = 'info-panel';

    if (isMobile) {
        Object.assign(panel.style, {
            position: 'relative', right: 'auto', left: 'auto', top: 'auto',
            width: '100%', maxWidth: '800px', marginTop: '20px',
            marginLeft: 'auto', marginRight: 'auto', boxSizing: 'border-box'
        });
    }

    const closeBtn = document.createElement('button');
    closeBtn.className = 'panel-close';
    closeBtn.innerHTML = '✕';
    closeBtn.onclick = closeDetectionPanel;

    const panelContent = document.createElement('div');
    panelContent.innerHTML = `
        <div class="panel-header">
            <h2 class="panel-title">${detection.name}</h2>
        </div>
        <div class="zoom-controls">
            <button class="zoom-btn" id="zoom-in">🔍+</button>
            <button class="zoom-btn" id="zoom-out">🔍−</button>
            <button class="zoom-btn" id="zoom-reset">↺</button>
            <span class="zoom-level-text">${Math.round(zoomLevel * 100)}%</span>
        </div>
        <div class="panel-info-section">
            <div class="info-label">ความมั่นใจ</div>
            <div class="info-value">${(detection.confidence * 100).toFixed(0)}%</div>
            <div class="confidence-bar">
                <div class="confidence-fill" style="width:${(detection.confidence * 100).toFixed(0)}%"></div>
            </div>
        </div>
        <div class="panel-info-section">
            <div class="info-label">ระดับมลพิษทางอากาศ</div>
            <div class="air-quality-bar" style="background:${detection.air_quality_color}"></div>
            <div class="info-value-large">${detection.air_quality}</div>
            <div class="info-description">${detection.air_quality_description}</div>
        </div>`;

    panel.appendChild(closeBtn);
    panel.appendChild(panelContent);

    if (isMobile) {
        const mainContainer = document.getElementById('main-container');
        if (mainContainer) {
            mainContainer.appendChild(panel);
            panel.style.display = 'block';
            panel.style.visibility = 'visible';
            setTimeout(() => panel.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
        }
    } else {
        document.body.appendChild(panel);
        setTimeout(() => panel.classList.add('active'), 10);
    }

    setTimeout(() => {
        const zi = document.getElementById('zoom-in');
        const zo = document.getElementById('zoom-out');
        const zr = document.getElementById('zoom-reset');
        if (zi) zi.addEventListener('click', () => zoomIn(imgElement, detection.bbox));
        if (zo) zo.addEventListener('click', () => zoomOut(imgElement, detection.bbox));
        if (zr) zr.addEventListener('click', () => resetZoom(imgElement, detection.bbox));
    }, 50);
}

function closeDetectionPanel() {
    const isMobile = window.innerWidth <= 768;

    const panel = document.querySelector('.info-panel');
    if (panel) {
        if (isMobile) { panel.remove(); }
        else { panel.classList.remove('active'); setTimeout(() => panel.remove(), 400); }
    }

    const blurCanvas = document.getElementById('blur-canvas');
    if (blurCanvas) {
        blurCanvas.classList.remove('active');
        setTimeout(() => blurCanvas.remove(), isMobile ? 0 : 300);
    }

    const imgElement = document.getElementById('result-image');
    if (imgElement && originalImageSrc) {
        imgElement.src = originalImageSrc;
        imgElement.style.transform = '';
        imgElement.style.transformOrigin = '';
        imgElement.style.cursor = 'default';
    }

    const imageContainer = document.getElementById('image-container');
    if (imageContainer) {
        imageContainer.classList.remove('shifted');
        imageContainer.style.cursor = 'default';
    }

    document.querySelectorAll('.bbox-overlay').forEach(o => {
        o.classList.remove('active');
        o.style.backgroundColor = 'transparent';
    });

    if (imgElement) removeZoomPanControls(imgElement);

    activeDetectionId = null; activeBbox = null;
    zoomLevel = 1; panX = 0; panY = 0; isDragging = false;

    setTimeout(() => {
        if (imgElement && currentDetections && currentDetections.length > 0) {
            setupImageClickHandlers(imgElement, currentDetections);
        }
    }, isMobile ? 150 : 450);
}

// ============================================
// ZOOM AND PAN CONTROLS
// ============================================

function setupZoomPanControls(imgElement) {
    document.getElementById('image-container').style.cursor = 'grab';
    imgElement.addEventListener('mousedown', handleMouseDown);
    imgElement.addEventListener('mousemove', handleMouseMove);
    imgElement.addEventListener('mouseup',   handleMouseUp);
    imgElement.addEventListener('mouseleave', handleMouseUp);
    imgElement.addEventListener('wheel', handleWheel, { passive: false });
}

function removeZoomPanControls(imgElement) {
    if (!imgElement) return;
    imgElement.removeEventListener('mousedown', handleMouseDown);
    imgElement.removeEventListener('mousemove', handleMouseMove);
    imgElement.removeEventListener('mouseup',   handleMouseUp);
    imgElement.removeEventListener('mouseleave', handleMouseUp);
    imgElement.removeEventListener('wheel', handleWheel);
}

function handleMouseDown(e) {
    isDragging = true;
    lastMouseX = e.clientX; lastMouseY = e.clientY;
    document.getElementById('image-container').style.cursor = 'grabbing';
    e.preventDefault();
}

function handleMouseMove(e) {
    if (!isDragging) return;
    panX += e.clientX - lastMouseX;
    panY += e.clientY - lastMouseY;
    lastMouseX = e.clientX; lastMouseY = e.clientY;
    const img = document.getElementById('result-image');
    img.style.transformOrigin = '0 0';
    img.style.transform = `translate(${panX}px,${panY}px) scale(${zoomLevel})`;
    img.style.transition = 'none';
}

function handleMouseUp() {
    isDragging = false;
    document.getElementById('image-container').style.cursor = 'grab';
}

function handleWheel(e) {
    e.preventDefault();
    zoomTowardsBbox(Math.max(0.5, Math.min(3, zoomLevel + (e.deltaY > 0 ? -0.1 : 0.1))));
    updateZoomLevelText();
}

function zoomIn(imgElement, bbox)  { zoomTowardsBbox(Math.min(3,   zoomLevel + 0.2)); updateZoomLevelText(); updateBlurCanvas(); }
function zoomOut(imgElement, bbox) { zoomTowardsBbox(Math.max(0.5, zoomLevel - 0.2)); updateZoomLevelText(); updateBlurCanvas(); }
function resetZoom() { zoomLevel = 1; panX = 0; panY = 0; updateImageTransform(); updateZoomLevelText(); updateBlurCanvas(); }

function zoomTowardsBbox(newZoom) {
    if (!activeBbox) { zoomLevel = newZoom; updateImageTransform(); return; }

    const img = document.getElementById('result-image');
    const container = document.getElementById('image-container');
    const scaleX = img.offsetWidth  / img.naturalWidth;
    const scaleY = img.offsetHeight / img.naturalHeight;

    const bboxCX = (activeBbox.x1 + activeBbox.x2) / 2 * scaleX;
    const bboxCY = (activeBbox.y1 + activeBbox.y2) / 2 * scaleY;
    const offL = (container.offsetWidth  - img.offsetWidth)  / 2;
    const offT = (container.offsetHeight - img.offsetHeight) / 2;
    const absX = offL + bboxCX;
    const absY = offT + bboxCY;

    panX = (container.offsetWidth  / 2 - absX) * newZoom;
    panY = (container.offsetHeight / 2 - absY) * newZoom;
    zoomLevel = newZoom;
    updateImageTransform();
}

function updateImageTransform() {
    const img = document.getElementById('result-image');
    img.style.transformOrigin = '0 0';
    img.style.transform = `translate(${panX}px,${panY}px) scale(${zoomLevel})`;
    img.style.transition = 'transform 0.2s ease-out';
}

function updateZoomLevelText() {
    const el = document.querySelector('.zoom-level-text');
    if (el) el.textContent = `${Math.round(zoomLevel * 100)}%`;
}

function updateBlurCanvas() {
    const canvas = document.getElementById('blur-canvas');
    if (canvas) {
        canvas.style.transformOrigin = '0 0';
        canvas.style.transform = `translate(${panX}px,${panY}px) scale(${zoomLevel})`;
    }
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDetectionPanel(); });
window.closeDetectionPanel = closeDetectionPanel;

