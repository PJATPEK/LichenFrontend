// ============================================
// CONFIGURATION
// ============================================

// Get API URL from input field or use default
function getApiUrl() {
    const apiUrlInput = document.getElementById('api-url');
    let url = apiUrlInput ? apiUrlInput.value.trim() : '';
    
    // Remove trailing slash if present
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    
    return url || 'http://localhost:7860';
}

// ============================================
// CONNECTION TESTING
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const testConnectionBtn = document.getElementById('test-connection');
    if (testConnectionBtn) {
        testConnectionBtn.addEventListener('click', testBackendConnection);
    }
    
    // Auto-test connection on page load
    setTimeout(testBackendConnection, 500);
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
        // Test if Gradio is accessible
        const response = await fetch(`${apiUrl}/`, {
            method: 'GET',
            mode: 'cors'
        });
        
        if (response.ok) {
            statusElement.textContent = '✓ Connected';
            statusElement.className = 'success';
            console.log('Backend is accessible');
        } else {
            throw new Error(`Backend responded with status ${response.status}`);
        }
    } catch (error) {
        statusElement.textContent = '✗ Connection Failed';
        statusElement.className = 'error';
        console.error('Connection test failed:', error);
    }
}

// ============================================
// DARK MODE
// ============================================

let darkModeEnabled = false;

document.addEventListener('DOMContentLoaded', function() {
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', function() {
            darkModeEnabled = !darkModeEnabled;
            document.body.classList.toggle('dark-mode');
            
            if (darkModeEnabled) {
                this.textContent = '☀️';
            } else {
                this.textContent = '🌙';
            }
        });
    }
});

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

document.getElementById('upload-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const fileInput = document.getElementById('image-input');
    if (!fileInput.files || !fileInput.files[0]) {
        alert('Please select an image file');
        return;
    }

    const apiUrl = getApiUrl();
    if (!apiUrl || apiUrl === 'http://localhost:7860') {
        alert('Please enter your Hugging Face Space URL in the Backend API URL field');
        return;
    }

    closeDetectionPanel();

    const submitButton = this.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.textContent = 'Processing...';
    submitButton.disabled = true;

    try {
        // Read image as base64
        const file = fileInput.files[0];
        const reader = new FileReader();
        
        reader.onload = async function(e) {
            try {
                const base64Image = e.target.result;
                
                // For Gradio API, we need to use their specific format
                console.log('Sending request to Gradio API:', `${apiUrl}/api/predict`);
                
                // Try the Gradio Python API client format
                const response = await fetch(`${apiUrl}/api/predict`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        data: [base64Image]
                    })
                });

                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }

                const result = await response.json();
                console.log('API Response:', result);
                
                // Gradio returns data in result.data array
                if (result.data && result.data.length > 0) {
                    const apiData = result.data[0];
                    
                    if (apiData.result_image_base64) {
                        const imgElement = document.getElementById('result-image');
                        originalImageSrc = 'data:image/jpeg;base64,' + apiData.result_image_base64;
                        imgElement.src = originalImageSrc;
                        
                        currentDetections = apiData.detections || [];
                        originalImageWithoutBboxSrc = base64Image;
                        
                        imgElement.onload = function() {
                            setupImageClickHandlers(imgElement, apiData.detections || []);
                        };
                        
                        document.getElementById('result-container').style.display = 'block';
                        document.getElementById('result-container').scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'start' 
                        });
                    }
                }
                
                fileInput.value = '';
                
            } catch (error) {
                console.error('Error:', error);
                alert('เกิดข้อผิดพลาดในการประมวลผลภาพ: ' + error.message);
            } finally {
                submitButton.textContent = originalButtonText;
                submitButton.disabled = false;
            }
        };
        
        reader.onerror = function() {
            alert('Error reading file');
            submitButton.textContent = originalButtonText;
            submitButton.disabled = false;
        };
        
        reader.readAsDataURL(file);
        
    } catch (error) {
        console.error('Error:', error);
        alert('เกิดข้อผิดพลาดในการประมวลผลภาพ: ' + error.message);
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
    }
});

    // Close any open info panel before processing new image
    closeDetectionPanel();

    const submitButton = this.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.textContent = 'Processing...';
    submitButton.disabled = true;

    let formData = new FormData();
    formData.append('image', fileInput.files[0]);

    try {
        console.log('Sending request to:', `${apiUrl}/predict`);
        
        let response = await fetch(`${apiUrl}/predict`, {
            method: 'POST',
            body: formData,
            mode: 'cors'
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        let data = await response.json();
        console.log('Response data:', data);

        if (data.result_image_base64) {
            const imgElement = document.getElementById('result-image');
            originalImageSrc = 'data:image/jpeg;base64,' + data.result_image_base64;
            imgElement.src = originalImageSrc;
            
            currentDetections = data.detections || [];
            
            // Also store the uploaded image as the original without bbox
            const uploadedFile = fileInput.files[0];
            const reader = new FileReader();
            reader.onload = function(e) {
                originalImageWithoutBboxSrc = e.target.result;
            };
            reader.readAsDataURL(uploadedFile);
            
            imgElement.onload = function() {
                setupImageClickHandlers(imgElement, data.detections || []);
            };
        }

        document.getElementById('result-container').style.display = 'block';
        
        document.getElementById('result-container').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
        
        // Clear the file input so the filename disappears
        fileInput.value = '';
        
    } catch (error) {
        console.error('Error:', error);
        alert('เกิดข้อผิดพลาดในการประมวลผลภาพ: ' + error.message + '\n\nกรุณาตรวจสอบว่า Backend API URL ถูกต้องและ API กำลังทำงานอยู่');
    } finally {
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
    }
});

// ============================================
// IMAGE INTERACTION SETUP
// ============================================

function setupImageClickHandlers(imgElement, detections) {
    const imageContainer = document.getElementById('image-container');
    
    const existingOverlays = imageContainer.querySelectorAll('.bbox-overlay');
    existingOverlays.forEach(overlay => overlay.remove());
    
    const existingCanvas = document.getElementById('blur-canvas');
    if (existingCanvas) {
        existingCanvas.remove();
    }
    
    if (!detections || detections.length === 0) {
        console.log('No detections to display');
        return;
    }
    
    // Wait for image to fully render
    setTimeout(() => {
        const imgNaturalWidth = imgElement.naturalWidth;
        const imgNaturalHeight = imgElement.naturalHeight;
        
        // Calculate actual displayed dimensions
        const imgDisplayWidth = imgElement.offsetWidth;
        const imgDisplayHeight = imgElement.offsetHeight;
        
        const scaleX = imgDisplayWidth / imgNaturalWidth;
        const scaleY = imgDisplayHeight / imgNaturalHeight;
        
        // Calculate offset of image within container
        const imgOffsetLeft = imgElement.offsetLeft;
        const imgOffsetTop = imgElement.offsetTop;
        
        detections.forEach(detection => {
            const bbox = detection.bbox;
            const overlay = document.createElement('div');
            overlay.className = 'bbox-overlay';
            overlay.dataset.detectionId = detection.id;
            
            const x1 = bbox.x1 * scaleX;
            const y1 = bbox.y1 * scaleY;
            const width = (bbox.x2 - bbox.x1) * scaleX;
            const height = (bbox.y2 - bbox.y1) * scaleY;
            
            overlay.style.position = 'absolute';
            overlay.style.left = (imgOffsetLeft + x1) + 'px';
            overlay.style.top = (imgOffsetTop + y1) + 'px';
            overlay.style.width = width + 'px';
            overlay.style.height = height + 'px';
            overlay.style.cursor = 'pointer';
            overlay.style.transition = 'all 0.3s ease';
            
            overlay.addEventListener('mouseenter', function() {
                if (activeDetectionId !== detection.id) {
                    this.style.backgroundColor = 'rgba(76, 175, 80, 0.2)';
                }
            });
            
            overlay.addEventListener('mouseleave', function() {
                if (activeDetectionId !== detection.id) {
                    this.style.backgroundColor = 'transparent';
                }
            });
            
            overlay.addEventListener('click', function() {
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
    if (existingCanvas) {
        existingCanvas.remove();
    }
    
    // Switch to original image without bounding boxes
    if (originalImageWithoutBboxSrc) {
        imgElement.src = originalImageWithoutBboxSrc;
    }
    
    // Wait for image to load, then apply blur
    const applyBlur = () => {
        const canvas = document.createElement('canvas');
        canvas.id = 'blur-canvas';
        const ctx = canvas.getContext('2d');
        
        // Get exact displayed dimensions
        const imgNaturalWidth = imgElement.naturalWidth;
        const imgNaturalHeight = imgElement.naturalHeight;
        const displayWidth = imgElement.offsetWidth;
        const displayHeight = imgElement.offsetHeight;
        
        // Set canvas size to match displayed image
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        
        // Calculate scale factors
        const scaleX = displayWidth / imgNaturalWidth;
        const scaleY = displayHeight / imgNaturalHeight;
        
        // Scale bounding box coordinates
        const x1 = bbox.x1 * scaleX;
        const y1 = bbox.y1 * scaleY;
        const x2 = bbox.x2 * scaleX;
        const y2 = bbox.y2 * scaleY;
        
        const img = new Image();
        img.src = originalImageWithoutBboxSrc || originalImageSrc;
        img.onload = function() {
            // Draw entire image blurred
            ctx.filter = 'blur(8px)';
            ctx.drawImage(img, 0, 0, displayWidth, displayHeight);
            
            // Cut out the bounding box area
            ctx.filter = 'none';
            ctx.globalCompositeOperation = 'destination-out';
            ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
            
            // Position canvas exactly over the image
            canvas.style.position = 'absolute';
            canvas.style.top = imgElement.offsetTop + 'px';
            canvas.style.left = imgElement.offsetLeft + 'px';
            canvas.style.width = displayWidth + 'px';
            canvas.style.height = displayHeight + 'px';
            canvas.style.pointerEvents = 'none';
            
            imageContainer.appendChild(canvas);
            
            setTimeout(() => {
                canvas.classList.add('active');
            }, 10);
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
    
    // Check if mobile FIRST
    const isMobile = window.innerWidth <= 768;
    
    // Remove existing panel if any
    const existingPanel = document.querySelector('.info-panel');
    if (existingPanel) {
        existingPanel.remove();
    }
    
    const imageContainer = document.getElementById('image-container');
    imageContainer.classList.add('shifted');
    
    // Reset zoom and pan
    zoomLevel = 1;
    panX = 0;
    panY = 0;
    
    applySelectiveBlur(imgElement, detection.bbox);
    
    // Add zoom and pan controls
    setupZoomPanControls(imgElement);
    
    const allOverlays = document.querySelectorAll('.bbox-overlay');
    allOverlays.forEach(overlay => {
        overlay.classList.remove('active');
        overlay.style.backgroundColor = 'transparent';
    });
    const activeOverlay = document.querySelector(`[data-detection-id="${detection.id}"]`);
    if (activeOverlay) {
        activeOverlay.classList.add('active');
    }
    
    // Create the panel
    const panel = document.createElement('div');
    panel.className = 'info-panel';
    
    // CRITICAL: Force mobile styles immediately if on mobile
    if (isMobile) {
        panel.style.position = 'relative';
        panel.style.right = 'auto';
        panel.style.left = 'auto';
        panel.style.top = 'auto';
        panel.style.width = '100%';
        panel.style.maxWidth = '800px';
        panel.style.marginTop = '20px';
        panel.style.marginLeft = 'auto';
        panel.style.marginRight = 'auto';
        panel.style.boxSizing = 'border-box';
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
                <div class="confidence-fill" style="width: ${(detection.confidence * 100).toFixed(0)}%"></div>
            </div>
        </div>
        <div class="panel-info-section">
            <div class="info-label">ระดับมลพิษทางอากาศ</div>
            <div class="air-quality-bar" style="background: ${detection.air_quality_color}"></div>
            <div class="info-value-large">${detection.air_quality}</div>
            <div class="info-description">${detection.air_quality_description}</div>
        </div>
    `;
    
    panel.appendChild(closeBtn);
    panel.appendChild(panelContent);
    
    // Append panel to correct location
    if (isMobile) {
        const mainContainer = document.getElementById('main-container');
        if (mainContainer) {
            mainContainer.appendChild(panel);
            panel.style.display = 'block';
            panel.style.visibility = 'visible';
            setTimeout(() => {
                panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 200);
        }
    } else {
        document.body.appendChild(panel);
        setTimeout(() => {
            panel.classList.add('active');
        }, 10);
    }
    
    // Add zoom button listeners
    setTimeout(() => {
        const zoomInBtn = document.getElementById('zoom-in');
        const zoomOutBtn = document.getElementById('zoom-out');
        const zoomResetBtn = document.getElementById('zoom-reset');
        
        if (zoomInBtn) zoomInBtn.addEventListener('click', () => zoomIn(imgElement, detection.bbox));
        if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => zoomOut(imgElement, detection.bbox));
        if (zoomResetBtn) zoomResetBtn.addEventListener('click', () => resetZoom(imgElement, detection.bbox));
    }, 50);
}

function closeDetectionPanel() {
    const isMobile = window.innerWidth <= 768;
    
    const panel = document.querySelector('.info-panel');
    if (panel) {
        if (isMobile) {
            panel.remove();
        } else {
            panel.classList.remove('active');
            setTimeout(() => {
                panel.remove();
            }, 400);
        }
    }
    
    const blurCanvas = document.getElementById('blur-canvas');
    if (blurCanvas) {
        blurCanvas.classList.remove('active');
        setTimeout(() => {
            blurCanvas.remove();
        }, isMobile ? 0 : 300);
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
    
    const allOverlays = document.querySelectorAll('.bbox-overlay');
    allOverlays.forEach(overlay => {
        overlay.classList.remove('active');
        overlay.style.backgroundColor = 'transparent';
    });
    
    if (imgElement) {
        removeZoomPanControls(imgElement);
    }
    
    activeDetectionId = null;
    activeBbox = null;
    zoomLevel = 1;
    panX = 0;
    panY = 0;
    isDragging = false;
    
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
    const imageContainer = document.getElementById('image-container');
    imageContainer.style.cursor = 'grab';
    
    imgElement.addEventListener('mousedown', handleMouseDown);
    imgElement.addEventListener('mousemove', handleMouseMove);
    imgElement.addEventListener('mouseup', handleMouseUp);
    imgElement.addEventListener('mouseleave', handleMouseUp);
    imgElement.addEventListener('wheel', handleWheel, { passive: false });
}

function removeZoomPanControls(imgElement) {
    if (!imgElement) return;
    imgElement.removeEventListener('mousedown', handleMouseDown);
    imgElement.removeEventListener('mousemove', handleMouseMove);
    imgElement.removeEventListener('mouseup', handleMouseUp);
    imgElement.removeEventListener('mouseleave', handleMouseUp);
    imgElement.removeEventListener('wheel', handleWheel);
}

function handleMouseDown(e) {
    isDragging = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    const imageContainer = document.getElementById('image-container');
    imageContainer.style.cursor = 'grabbing';
    e.preventDefault();
}

function handleMouseMove(e) {
    if (!isDragging) return;
    
    const deltaX = e.clientX - lastMouseX;
    const deltaY = e.clientY - lastMouseY;
    
    panX += deltaX;
    panY += deltaY;
    
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    
    const imgElement = document.getElementById('result-image');
    imgElement.style.transformOrigin = '0 0';
    imgElement.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomLevel})`;
    imgElement.style.transition = 'none';
}

function handleMouseUp() {
    isDragging = false;
    const imageContainer = document.getElementById('image-container');
    imageContainer.style.cursor = 'grab';
}

function handleWheel(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.5, Math.min(3, zoomLevel + delta));
    
    zoomTowardsBbox(newZoom);
    updateZoomLevelText();
}

function zoomIn(imgElement, bbox) {
    const newZoom = Math.min(3, zoomLevel + 0.2);
    zoomTowardsBbox(newZoom);
    updateZoomLevelText();
    updateBlurCanvas(imgElement, bbox);
}

function zoomOut(imgElement, bbox) {
    const newZoom = Math.max(0.5, zoomLevel - 0.2);
    zoomTowardsBbox(newZoom);
    updateZoomLevelText();
    updateBlurCanvas(imgElement, bbox);
}

function resetZoom(imgElement, bbox) {
    zoomLevel = 1;
    panX = 0;
    panY = 0;
    updateImageTransform();
    updateZoomLevelText();
    updateBlurCanvas(imgElement, bbox);
}

function zoomTowardsBbox(newZoom) {
    if (!activeBbox) {
        zoomLevel = newZoom;
        updateImageTransform();
        return;
    }
    
    const imgElement = document.getElementById('result-image');
    const imgNaturalWidth = imgElement.naturalWidth;
    const imgNaturalHeight = imgElement.naturalHeight;
    const displayWidth = imgElement.offsetWidth;
    const displayHeight = imgElement.offsetHeight;
    
    const scaleX = displayWidth / imgNaturalWidth;
    const scaleY = displayHeight / imgNaturalHeight;
    
    const bboxCenterXNatural = (activeBbox.x1 + activeBbox.x2) / 2;
    const bboxCenterYNatural = (activeBbox.y1 + activeBbox.y2) / 2;
    
    const bboxCenterXDisplayed = bboxCenterXNatural * scaleX;
    const bboxCenterYDisplayed = bboxCenterYNatural * scaleY;
    
    const imageContainer = document.getElementById('image-container');
    const containerWidth = imageContainer.offsetWidth;
    const containerHeight = imageContainer.offsetHeight;
    
    const imgOffsetLeft = (containerWidth - displayWidth) / 2;
    const imgOffsetTop = (containerHeight - displayHeight) / 2;
    
    const bboxAbsoluteX = imgOffsetLeft + bboxCenterXDisplayed;
    const bboxAbsoluteY = imgOffsetTop + bboxCenterYDisplayed;
    
    const containerCenterX = containerWidth / 2;
    const containerCenterY = containerHeight / 2;
    
    panX = (containerCenterX - bboxAbsoluteX) * newZoom;
    panY = (containerCenterY - bboxAbsoluteY) * newZoom;
    
    zoomLevel = newZoom;
    updateImageTransform();
}

function updateImageTransform() {
    const imgElement = document.getElementById('result-image');
    imgElement.style.transformOrigin = '0 0';
    imgElement.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomLevel})`;
    imgElement.style.transition = 'transform 0.2s ease-out';
}

function updateZoomLevelText() {
    const zoomText = document.querySelector('.zoom-level-text');
    if (zoomText) {
        zoomText.textContent = `${Math.round(zoomLevel * 100)}%`;
    }
}

function updateBlurCanvas(imgElement, bbox) {
    const blurCanvas = document.getElementById('blur-canvas');
    if (blurCanvas) {
        blurCanvas.style.transformOrigin = '0 0';
        blurCanvas.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomLevel})`;
    }
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeDetectionPanel();
    }
});

window.closeDetectionPanel = closeDetectionPanel;

