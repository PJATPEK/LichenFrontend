import { Client } from "https://cdn.jsdelivr.net/npm/@gradio/client/dist/index.min.js";

const HF_SPACE = "PjetpAAAAAk/lichen-detection-api";

let darkModeEnabled = false;
let currentDetections = [];
let originalImageSrc = null;
let originalImageWithoutBboxSrc = null;
let activeDetectionId = null;
let activeBbox = null;
let zoomLevel = 1;
let panX = 0, panY = 0;
let isDragging = false;
let lastMouseX = 0, lastMouseY = 0;

document.addEventListener('DOMContentLoaded', function () {
    
    // ============================================
    // NAVIGATION SYSTEM
    // ============================================
    
    const helpModal = document.getElementById('help-modal');
    const settingsModal = document.getElementById('settings-modal');
    
    // Mobile bottom navigation (3 tabs)
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabType = this.getAttribute('data-tab');
            
            console.log('Mobile tab clicked:', tabType);
            
            // Remove active from all tabs
            navTabs.forEach(t => t.classList.remove('active'));
            // Add active to clicked tab
            this.classList.add('active');
            
            // Handle modal display
            if (tabType === 'help') {
                if (helpModal) {
                    helpModal.classList.add('show');
                    console.log('Help modal opened');
                }
                if (settingsModal) settingsModal.classList.remove('show');
            } else if (tabType === 'settings') {
                if (settingsModal) {
                    settingsModal.classList.add('show');
                    console.log('Settings modal opened');
                }
                if (helpModal) helpModal.classList.remove('show');
            } else if (tabType === 'home') {
                if (helpModal) helpModal.classList.remove('show');
                if (settingsModal) settingsModal.classList.remove('show');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });
    
    // Desktop sidebar navigation
    const sidebarBtns = document.querySelectorAll('.sidebar-btn');
    sidebarBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            
            console.log('Sidebar button clicked:', page);
            
            // Remove active from all buttons
            sidebarBtns.forEach(b => b.classList.remove('active'));
            // Add active to clicked button
            this.classList.add('active');
            
            // Handle modal display
            if (page === 'help') {
                if (helpModal) {
                    helpModal.classList.add('show');
                    console.log('Help modal opened');
                }
                if (settingsModal) settingsModal.classList.remove('show');
            } else if (page === 'settings') {
                if (settingsModal) {
                    settingsModal.classList.add('show');
                    console.log('Settings modal opened');
                }
                if (helpModal) helpModal.classList.remove('show');
            } else if (page === 'home') {
                if (helpModal) helpModal.classList.remove('show');
                if (settingsModal) settingsModal.classList.remove('show');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });
    
    // Helper function to reset navigation to home
    function resetActiveNav(tab = 'home') {
        navTabs.forEach(t => {
            if (t.getAttribute('data-tab') === tab) {
                t.classList.add('active');
            } else {
                t.classList.remove('active');
            }
        });
        
        sidebarBtns.forEach(b => {
            if (b.getAttribute('data-page') === tab) {
                b.classList.add('active');
            } else {
                b.classList.remove('active');
            }
        });
    }
    
    // Modal close buttons
    const helpCloseBtn = helpModal ? helpModal.querySelector('.help-close') : null;
    const settingsCloseBtn = settingsModal ? settingsModal.querySelector('.help-close') : null;
    
    if (helpCloseBtn) {
        helpCloseBtn.addEventListener('click', function() {
            helpModal.classList.remove('show');
            resetActiveNav('home');
        });
    }
    
    if (settingsCloseBtn) {
        settingsCloseBtn.addEventListener('click', function() {
            settingsModal.classList.remove('show');
            resetActiveNav('home');
        });
    }
    
    // Click outside modal to close
    if (helpModal) {
        helpModal.addEventListener('click', function(e) {
            if (e.target === helpModal) {
                helpModal.classList.remove('show');
                resetActiveNav('home');
            }
        });
    }
    
    if (settingsModal) {
        settingsModal.addEventListener('click', function(e) {
            if (e.target === settingsModal) {
                settingsModal.classList.remove('show');
                resetActiveNav('home');
            }
        });
    }
    
    // ESC key to close modals
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (helpModal && helpModal.classList.contains('show')) {
                helpModal.classList.remove('show');
                resetActiveNav('home');
            }
            if (settingsModal && settingsModal.classList.contains('show')) {
                settingsModal.classList.remove('show');
                resetActiveNav('home');
            }
        }
    });
    
    // ============================================
    // THEME SWITCHER IN SETTINGS
    // ============================================
    
    const themeToggleInput = document.getElementById('theme-toggle-input');
    const themeLightOption = document.getElementById('theme-light');
    const themeDarkOption = document.getElementById('theme-dark');
    
    function updateThemeUI() {
        if (darkModeEnabled) {
            if (themeToggleInput) themeToggleInput.checked = true;
            if (themeLightOption) themeLightOption.classList.remove('active');
            if (themeDarkOption) themeDarkOption.classList.add('active');
        } else {
            if (themeToggleInput) themeToggleInput.checked = false;
            if (themeLightOption) themeLightOption.classList.add('active');
            if (themeDarkOption) themeDarkOption.classList.remove('active');
        }
    }
    
    function toggleDarkMode() {
        darkModeEnabled = !darkModeEnabled;
        document.body.classList.toggle('dark-mode');
        updateThemeUI();
    }
    
    // Initialize theme UI
    updateThemeUI();
    
    // Theme toggle switch
    if (themeToggleInput) {
        themeToggleInput.addEventListener('change', toggleDarkMode);
    }
    
    // Click on theme options
    if (themeLightOption) {
        themeLightOption.addEventListener('click', function() {
            if (darkModeEnabled) toggleDarkMode();
        });
    }
    
    if (themeDarkOption) {
        themeDarkOption.addEventListener('click', function() {
            if (!darkModeEnabled) toggleDarkMode();
        });
    }
    
    // ============================================
    // HELP MODAL LANGUAGE TOGGLE
    // ============================================
    
    const langToggle = document.getElementById('lang-toggle');
    const helpTitle = document.getElementById('help-title');
    const helpEn = document.getElementById('help-en');
    const helpTh = document.getElementById('help-th');
    const langLabelEn = document.getElementById('lang-label-en');
    const langLabelTh = document.getElementById('lang-label-th');
    
    if (langToggle) {
        // Set initial state
        if (langLabelEn) langLabelEn.classList.add('active');
        
        langToggle.addEventListener('change', function() {
            if (this.checked) {
                // Switch to Thai
                if (helpTitle) helpTitle.textContent = 'วิธีการใช้งาน';
                if (helpEn) helpEn.style.display = 'none';
                if (helpTh) helpTh.style.display = 'block';
                if (langLabelEn) langLabelEn.classList.remove('active');
                if (langLabelTh) langLabelTh.classList.add('active');
            } else {
                // Switch to English
                if (helpTitle) helpTitle.textContent = 'How to Use';
                if (helpEn) helpEn.style.display = 'block';
                if (helpTh) helpTh.style.display = 'none';
                if (langLabelEn) langLabelEn.classList.add('active');
                if (langLabelTh) langLabelTh.classList.remove('active');
            }
        });
    }
    
    // ============================================
    // IMAGE UPLOAD FORM
    // ============================================
    
    const uploadForm = document.getElementById('upload-form');
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleImageUpload);
    }
});

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

    closeDetectionPanel();

    const submitButton = document.querySelector('#upload-form button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.textContent = 'Processing...';
    submitButton.disabled = true;

    const file = fileInput.files[0];

    // Store original image (no bboxes) for blur effect later
    originalImageWithoutBboxSrc = await fileToBase64(file);

    try {
        // Try to connect with retries for cold start
        const result = await connectAndPredictWithRetry(file, submitButton);

        console.log("Gradio result:", result);

        const resultData = result.data[0];

        if (!resultData || !resultData.success) {
            throw new Error(resultData?.error || "Detection failed");
        }

        const imgElement = document.getElementById('result-image');
        originalImageSrc = 'data:image/jpeg;base64,' + resultData.result_image_base64;
        imgElement.src   = originalImageSrc;

        currentDetections = resultData.detections || [];

        imgElement.onload = function () {
            setupImageClickHandlers(imgElement, currentDetections);
        };

        document.getElementById('result-container').style.display = 'block';
        document.getElementById('result-container').scrollIntoView({
            behavior: 'smooth',
            block:    'start'
        });

        fileInput.value = '';

    } catch (error) {
        console.error('Error:', error);
        alert('เกิดข้อผิดพลาด: ' + error.message + '\n\nPlease try again.');
    } finally {
        submitButton.textContent = originalButtonText;
        submitButton.disabled    = false;
    }
}

// Helper function to retry connection for cold start
async function connectAndPredictWithRetry(file, submitButton, maxRetries = 3, retryDelay = 5000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            if (attempt > 1) {
                submitButton.textContent = `Waking up server... (Attempt ${attempt}/${maxRetries})`;
                console.log(`Retry attempt ${attempt}/${maxRetries} after ${retryDelay}ms delay`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
            
            submitButton.textContent = attempt === 1 ? 'Connecting to server...' : `Reconnecting (${attempt}/${maxRetries})...`;
            
            const client = await Client.connect(HF_SPACE, {
                timeout: 60000 // 60 second timeout for cold start
            });
            
            submitButton.textContent = 'Processing image...';
            
            const result = await client.predict("/predict_api", {
                image: file
            });
            
            return result; // Success!
            
        } catch (error) {
            console.error(`Attempt ${attempt} failed:`, error);
            
            if (attempt === maxRetries) {
                throw new Error(`Connection failed after ${maxRetries} attempts. The server may be starting up - please wait 30 seconds and try again.`);
            }
            
            // Continue to next retry
        }
    }
}

// Helper: File → base64 data URL
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader    = new FileReader();
        reader.onload   = () => resolve(reader.result);
        reader.onerror  = reject;
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
        const scaleX        = imgElement.offsetWidth  / imgElement.naturalWidth;
        const scaleY        = imgElement.offsetHeight / imgElement.naturalHeight;
        const imgOffsetLeft = imgElement.offsetLeft;
        const imgOffsetTop  = imgElement.offsetTop;

        detections.forEach(detection => {
            const bbox    = detection.bbox;
            const overlay = document.createElement('div');
            overlay.className           = 'bbox-overlay';
            overlay.dataset.detectionId = detection.id;

            overlay.style.position   = 'absolute';
            overlay.style.left       = (imgOffsetLeft + bbox.x1 * scaleX) + 'px';
            overlay.style.top        = (imgOffsetTop  + bbox.y1 * scaleY) + 'px';
            overlay.style.width      = ((bbox.x2 - bbox.x1) * scaleX)    + 'px';
            overlay.style.height     = ((bbox.y2 - bbox.y1) * scaleY)    + 'px';
            overlay.style.cursor     = 'pointer';
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
        canvas.id    = 'blur-canvas';
        const ctx    = canvas.getContext('2d');

        const displayWidth  = imgElement.offsetWidth;
        const displayHeight = imgElement.offsetHeight;
        canvas.width  = displayWidth;
        canvas.height = displayHeight;

        const scaleX = displayWidth  / imgElement.naturalWidth;
        const scaleY = displayHeight / imgElement.naturalHeight;
        const x1 = bbox.x1 * scaleX, y1 = bbox.y1 * scaleY;
        const x2 = bbox.x2 * scaleX, y2 = bbox.y2 * scaleY;

        const img  = new Image();
        img.src    = originalImageWithoutBboxSrc || originalImageSrc;
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
    activeBbox        = detection.bbox;

    const isMobile = window.innerWidth <= 768;

    const existingPanel = document.querySelector('.info-panel');
    if (existingPanel) existingPanel.remove();

    // Add class to body to trigger main-content shift
    document.body.classList.add('info-panel-active');
    
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
            position:    'relative',
            right:       'auto',
            left:        'auto',
            top:         'auto',
            width:       '100%',
            maxWidth:    '800px',
            marginTop:   '20px',
            marginLeft:  'auto',
            marginRight: 'auto',
            boxSizing:   'border-box'
        });
    }

    const closeBtn     = document.createElement('button');
    closeBtn.className = 'panel-close';
    closeBtn.innerHTML = '✕';
    closeBtn.onclick   = closeDetectionPanel;

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
            panel.style.display    = 'block';
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
        if (zi) zi.addEventListener('click', zoomIn);
        if (zo) zo.addEventListener('click', zoomOut);
        if (zr) zr.addEventListener('click', resetZoom);
    }, 50);
}

function closeDetectionPanel() {
    const isMobile = window.innerWidth <= 768;

    // Remove body class
    document.body.classList.remove('info-panel-active');
    
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
        imgElement.src               = originalImageSrc;
        imgElement.style.transform      = '';
        imgElement.style.transformOrigin = '';
        imgElement.style.cursor          = 'default';
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

    activeDetectionId = null;
    activeBbox        = null;
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
    imgElement.addEventListener('mousedown',  handleMouseDown);
    imgElement.addEventListener('mousemove',  handleMouseMove);
    imgElement.addEventListener('mouseup',    handleMouseUp);
    imgElement.addEventListener('mouseleave', handleMouseUp);
    imgElement.addEventListener('wheel',      handleWheel, { passive: false });
}

function removeZoomPanControls(imgElement) {
    if (!imgElement) return;
    imgElement.removeEventListener('mousedown',  handleMouseDown);
    imgElement.removeEventListener('mousemove',  handleMouseMove);
    imgElement.removeEventListener('mouseup',    handleMouseUp);
    imgElement.removeEventListener('mouseleave', handleMouseUp);
    imgElement.removeEventListener('wheel',      handleWheel);
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
    img.style.transform       = `translate(${panX}px,${panY}px) scale(${zoomLevel})`;
    img.style.transition      = 'none';
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

function zoomIn()    { zoomTowardsBbox(Math.min(3,   zoomLevel + 0.2)); updateZoomLevelText(); updateBlurCanvas(); }
function zoomOut()   { zoomTowardsBbox(Math.max(0.5, zoomLevel - 0.2)); updateZoomLevelText(); updateBlurCanvas(); }
function resetZoom() { zoomLevel = 1; panX = 0; panY = 0; updateImageTransform(); updateZoomLevelText(); updateBlurCanvas(); }

function zoomTowardsBbox(newZoom) {
    if (!activeBbox) { zoomLevel = newZoom; updateImageTransform(); return; }

    const img       = document.getElementById('result-image');
    const container = document.getElementById('image-container');
    const scaleX    = img.offsetWidth  / img.naturalWidth;
    const scaleY    = img.offsetHeight / img.naturalHeight;

    const bboxCX = (activeBbox.x1 + activeBbox.x2) / 2 * scaleX;
    const bboxCY = (activeBbox.y1 + activeBbox.y2) / 2 * scaleY;
    const offL   = (container.offsetWidth  - img.offsetWidth)  / 2;
    const offT   = (container.offsetHeight - img.offsetHeight) / 2;

    panX = (container.offsetWidth  / 2 - (offL + bboxCX)) * newZoom;
    panY = (container.offsetHeight / 2 - (offT + bboxCY)) * newZoom;
    zoomLevel = newZoom;
    updateImageTransform();
}

function updateImageTransform() {
    const img = document.getElementById('result-image');
    img.style.transformOrigin = '0 0';
    img.style.transform       = `translate(${panX}px,${panY}px) scale(${zoomLevel})`;
    img.style.transition      = 'transform 0.2s ease-out';
}

function updateZoomLevelText() {
    const el = document.querySelector('.zoom-level-text');
    if (el) el.textContent = `${Math.round(zoomLevel * 100)}%`;
}

function updateBlurCanvas() {
    const canvas = document.getElementById('blur-canvas');
    if (canvas) {
        canvas.style.transformOrigin = '0 0';
        canvas.style.transform       = `translate(${panX}px,${panY}px) scale(${zoomLevel})`;
    }
}

window.closeDetectionPanel = closeDetectionPanel;
