// NOTE: We no longer use the @gradio/client SDK. It always sends
// `credentials: "include"` on its requests, which is incompatible with
// Hugging Face Spaces' wildcard CORS policy (`Access-Control-Allow-Origin: *`
// cannot be combined with `Access-Control-Allow-Credentials: true`).
// Calling the REST endpoints directly with plain fetch + credentials:"omit"
// avoids that mismatch entirely.
const HF_SPACE_URL = "https://pjetpaaaaak-lichen-detection-api.hf.space";

// Physical/physiological descriptions shown in the info panel for each
// detected species, in both languages. Keys must exactly match the "name"
// field returned by the backend (see SPECIES_COLOR_MAP / AIR_QUALITY_MAP in
// utils.py). Scientific names themselves are never translated.
const SPECIES_DESCRIPTIONS = {
    'Dirinaria picta': {
        en: 'Dirinaria picta forms a leafy, fan-shaped patch that lies tightly against bark or rock. Its lobes radiate outward from the centre, branching repeatedly and staying narrow — usually around 1 to 1.5 mm wide — with rounded, separated tips. The upper surface has a pale, frosty grey-white colour with a smooth texture, occasionally showing a light powdery bloom near the lobe tips. Small, raised, powdery patches called soralia are scattered across the surface and release fine reproductive granules. The underside is black, and occasional black, short-stalked fruiting discs may appear, each releasing colourless, two-celled spores.',
        th: 'ไดรินาเรีย พิคตา (Dirinaria picta) มีรูปร่างเป็นแผ่นใบบางคล้ายพัด เกาะแน่นกับเปลือกไม้หรือหิน กลีบแผ่ขยายออกจากศูนย์กลาง แตกแขนงซ้ำ ๆ และมีความกว้างแคบ ประมาณ 1 ถึง 1.5 มิลลิเมตร ปลายกลีบมนและแยกออกจากกัน พื้นผิวด้านบนมีสีเทาขาวอมหมอกอ่อน เรียบ และบางครั้งอาจมีฝุ่นขาวบาง ๆ ปกคลุมบริเวณปลายกลีบ มีจุดนูนเล็ก ๆ คล้ายฝุ่นเรียกว่าโซราเลีย กระจายอยู่บนพื้นผิว ปลดปล่อยเม็ดสืบพันธุ์ละเอียด ด้านล่างของแผ่นมีสีดำ และบางครั้งอาจพบโครงสร้างสร้างสปอร์สีดำที่มีก้านสั้น ปล่อยสปอร์ไม่มีสีแบบสองเซลล์'
    },
    'Pyxine cocoes': {
        en: 'Pyxine cocoes grows as a pale greyish-green crust of narrow, radiating lobes, each under about 1 mm wide, pressed closely to bark or stone. Grainy reproductive patches called soralia break through the lobe surface in irregular shapes, releasing powdery propagules. Beneath the surface, the inner medulla layer is white. Mature specimens occasionally produce small, flat, disc-shaped fruiting bodies, 1–5 mm across, that are black with a black rim and a reddish-brown base layer. The species also contains a yellow pigment compound called lichexanthone.',
        th: 'ไพซีน โคโคอีส (Pyxine cocoes) เติบโตเป็นแผ่นคล้ายเปลือกสีเทาอมเขียวอ่อน มีกลีบแคบแผ่ออกจากศูนย์กลาง กว้างไม่ถึง 1 มิลลิเมตร เกาะแน่นกับเปลือกไม้หรือหิน มีจุดสร้างสปอร์ผิวขรุขระ (โซราเลีย) แตกออกตามพื้นผิวกลีบเป็นรูปทรงไม่แน่นอน ปลดปล่อยเม็ดสืบพันธุ์เป็นฝุ่น ใต้พื้นผิวมีเนื้อชั้นในสีขาว ตัวอย่างที่โตเต็มที่อาจพบโครงสร้างสร้างสปอร์รูปจานแบนขนาดเล็ก กว้าง 1–5 มิลลิเมตร มีสีดำพร้อมขอบสีดำและฐานสีน้ำตาลแดง สายพันธุ์นี้ยังมีสารสีเหลืองที่เรียกว่าไลเคซานโทน'
    },
    'Physcia undulata': {
        en: 'Physcia undulata has a leaf-like, lobed thallus that spreads out in a roughly circular pattern and lies loosely on its substrate. The lobes are narrow, generally under 3 mm wide, ranging from whitish or bluish-grey to a darker grey, with little colour change when wet. The surface can look matte or slightly shiny, sometimes showing tiny pale pores under magnification, and this species is known for a consistent, fine, even powdery coating (pruina) toward the outer edges of the lobes. The underside is pale and anchored by root-like rhizines. When fruiting bodies are present, they appear as disc-shaped structures with a pale rim, producing brown, two-celled spores.',
        th: 'ฟิสเซีย อันดูลาตา (Physcia undulata) มีแผ่นทาลลัสคล้ายใบที่แยกเป็นกลีบ แผ่ขยายเป็นวงคล้ายวงกลม เกาะกับพื้นผิวอย่างหลวม ๆ กลีบมีความแคบ โดยทั่วไปกว้างไม่ถึง 3 มิลลิเมตร มีสีตั้งแต่ขาวอมฟ้าจนถึงเทาเข้ม และมีการเปลี่ยนสีเพียงเล็กน้อยเมื่อเปียก พื้นผิวอาจดูด้านหรือมันเล็กน้อย และเป็นหนึ่งในสายพันธุ์ของสกุลนี้ที่มีฝุ่นขาวละเอียดสม่ำเสมอ (พรูอินา) ปกคลุมบริเวณขอบกลีบด้านนอก ด้านใต้มีสีอ่อนและยึดด้วยเส้นใยคล้ายราก เมื่อมีโครงสร้างสร้างสปอร์ จะมีลักษณะเป็นจานมีขอบสีอ่อน ปล่อยสปอร์สีน้ำตาลแบบสองเซลล์'
    },
    'Nigrovothelium tropicum': {
        en: "Nigrovothelium tropicum grows as a crust firmly fused to its substrate, with a hardened outer layer that gives the surface a more solid, consolidated feel compared to looser crustose lichens. Its fruiting bodies are small, black, egg-shaped structures that sit fully exposed on the surface rather than embedded in a shared structure, sometimes crowding together where they grow close. Each has a tiny pore at the top through which spores are released. Inside, clear, branching threads fill the spore-bearing tissue, and the colourless spores are divided by three internal cross-walls, with a distinctive diamond-shaped pattern inside the spore wall.",
        th: 'ไนโกรโวธีเลียม ทรอปิคุม (Nigrovothelium tropicum) เติบโตเป็นแผ่นคล้ายคราบเกาะแน่นกับพื้นผิว มีเปลือกชั้นนอกที่แข็งทำให้พื้นผิวดูแน่นและรวมตัวกันมากกว่าไลเคนชนิดคราบทั่วไป โครงสร้างสร้างสปอร์มีขนาดเล็ก สีดำ รูปไข่ และอยู่บนพื้นผิวแบบเปิดเผยโดยไม่มีก้าน บางครั้งอาจเกาะกันแน่นจนติดกัน แต่ละโครงสร้างมีรูเล็ก ๆ ด้านบนสำหรับปลดปล่อยสปอร์ ภายในมีเส้นใยโปร่งแสงแตกแขนงเต็มเนื้อเยื่อสร้างสปอร์ และสปอร์ไม่มีสีถูกแบ่งด้วยผนังกั้นภายในสามชั้น พร้อมลักษณะเฉพาะคล้ายเพชรภายในผนังสปอร์'
    },
    'Trypethelium eluteriae': {
        en: "Trypethelium eluteriae grows almost entirely inside the outer bark layer of its host tree, so it doesn't form an obvious leafy or powdery surface like most lichens. Its presence is usually only visible as small, dark fruiting bodies that push through the bark. The fungal tissue spreads through the bark in a formless mass, with its algal partner scattered loosely within rather than forming a distinct layer. This hidden growth habit gives the lichen a subtle, almost invisible appearance, often mistaken for textured bark rather than a lichen.",
        th: 'ทริปเพเทเลียม เอลูเทอริเอ (Trypethelium eluteriae) เติบโตอยู่ภายในเปลือกไม้ของต้นไม้เจ้าบ้านเกือบทั้งหมด จึงไม่ปรากฏเป็นแผ่นใบหรือฝุ่นแบบไลเคนทั่วไป การมีอยู่ของมันมักสังเกตได้จากโครงสร้างสร้างสปอร์สีเข้มขนาดเล็กที่แทงทะลุผ่านเปลือกไม้ เนื้อเยื่อของเชื้อราแผ่กระจายอยู่ในเปลือกไม้แบบไม่มีรูปทรงแน่นอน โดยมีสาหร่ายคู่ชีวิตกระจายอยู่อย่างหลวม ๆ ภายในมากกว่าจะรวมเป็นชั้นเดียว ลักษณะการเติบโตที่ซ่อนตัวนี้ทำให้ไลเคนชนิดนี้ดูจางและแทบไม่เห็น มักถูกเข้าใจผิดว่าเป็นเพียงเปลือกไม้ที่มีลวดลายมากกว่าจะเป็นไลเคน'
    }
};

// The backend (utils.py) always returns air_quality / air_quality_description
// strings in Thai. These maps translate the known Thai phrases to English for
// display when the app language is set to English. Thai display is just the
// original backend string, unchanged.
const AIR_QUALITY_LEVEL_EN = {
    'มลพิษต่ำ': 'Low Pollution',
    'มลพิษปานกลาง': 'Moderate Pollution',
    'มลพิษสูง': 'High Pollution',
    'มลพิษต่ำ ถึง มลพิษปานกลาง': 'Low to Moderate Pollution',
    'มลพิษต่ำ ถึง มลพิษสูง': 'Low to High Pollution',
    'ไม่ทราบ': 'Unknown'
};

const AIR_QUALITY_DESC_EN = {
    'คุณภาพอากาศดีมาก': 'Air quality is very good',
    'คุณภาพอากาศปานกลาง': 'Air quality is moderate',
    'คุณภาพอากาศแย่': 'Air quality is poor',
    'คุณภาพอากาศดีถึงปานกลาง': 'Air quality is good to moderate',
    'คุณภาพอากาศแปรผัน (ต่ำถึงสูง)': 'Air quality varies (low to high)',
    'ไม่สามารถประเมินได้': 'Unable to assess'
};

// All other translatable UI strings. The page title ("Lichen Detection
// (Model z1)") and lichen scientific names are intentionally excluded —
// they never change with this toggle.
const TRANSLATIONS = {
    en: {
        sidebarMenu: 'Menu',
        navHome: 'Home',
        navHelp: 'How to Use',
        navSettings: 'Settings',
        predictBtn: 'Predict',
        processing: 'Processing...',
        uploadingImage: 'Uploading image...',
        processingImage: 'Processing image...',
        wakingServer: (a, m) => `Waking up server... (Attempt ${a}/${m})`,
        reconnecting: (a, m) => `Reconnecting (${a}/${m})...`,
        connectionFailed: (m) => `Connection failed after ${m} attempts. The server may be starting up - please wait 30 seconds and try again.`,
        pleaseSelectImage: 'Please select an image file',
        errorPrefix: 'An error occurred: ',
        errorSuffix: '\n\nPlease try again.',
        confidence: 'Confidence',
        airQualityLevel: 'Air Quality Level',
        description: 'Description',
        noDescription: 'No description available for this species yet.',
        settingsTitle: 'Settings',
        themeTitle: 'Theme',
        themeDesc: 'Switch between light and dark mode',
        lightMode: 'Light Mode',
        darkMode: 'Dark Mode',
        languageTitle: 'Language',
        languageDesc: 'Switch the app language between English and Thai',
        helpTitle: 'How to Use'
    },
    th: {
        sidebarMenu: 'เมนู',
        navHome: 'หน้าหลัก',
        navHelp: 'วิธีใช้งาน',
        navSettings: 'การตั้งค่า',
        predictBtn: 'ทำนาย',
        processing: 'กำลังประมวลผล...',
        uploadingImage: 'กำลังอัปโหลดรูปภาพ...',
        processingImage: 'กำลังประมวลผลภาพ...',
        wakingServer: (a, m) => `กำลังปลุกเซิร์ฟเวอร์... (ครั้งที่ ${a}/${m})`,
        reconnecting: (a, m) => `กำลังเชื่อมต่อใหม่ (${a}/${m})...`,
        connectionFailed: (m) => `การเชื่อมต่อล้มเหลวหลังจากลอง ${m} ครั้ง เซิร์ฟเวอร์อาจกำลังเริ่มทำงาน กรุณารอ 30 วินาทีแล้วลองใหม่`,
        pleaseSelectImage: 'กรุณาเลือกไฟล์รูปภาพ',
        errorPrefix: 'เกิดข้อผิดพลาด: ',
        errorSuffix: '\n\nกรุณาลองอีกครั้ง',
        confidence: 'ความมั่นใจ',
        airQualityLevel: 'ระดับมลพิษทางอากาศ',
        description: 'คำอธิบาย',
        noDescription: 'ยังไม่มีคำอธิบายสำหรับสายพันธุ์นี้',
        settingsTitle: 'การตั้งค่า',
        themeTitle: 'ธีม',
        themeDesc: 'สลับระหว่างโหมดสว่างและโหมดมืด',
        lightMode: 'โหมดสว่าง',
        darkMode: 'โหมดมืด',
        languageTitle: 'ภาษา',
        languageDesc: 'สลับภาษาของแอประหว่างอังกฤษและไทย',
        helpTitle: 'วิธีการใช้งาน'
    }
};

let currentLanguage = 'en';
let currentPanelDetection = null; // the detection currently shown in the info panel, if any

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

// ============================================
// GLOBAL LANGUAGE SWITCHING
// ============================================
// Updates every translatable piece of UI text on the page. The page title
// ("Lichen Detection (Model z1)") and lichen scientific names are never
// touched by this function — they stay the same in both languages.
function applyLanguage(lang) {
    currentLanguage = lang;
    const t = TRANSLATIONS[lang];

    document.documentElement.lang = lang;

    // Sidebar (desktop)
    const sidebarMenuTitle = document.getElementById('sidebar-menu-title');
    if (sidebarMenuTitle) sidebarMenuTitle.textContent = t.sidebarMenu;
    const sidebarLabelHome = document.getElementById('sidebar-label-home');
    if (sidebarLabelHome) sidebarLabelHome.textContent = t.navHome;
    const sidebarLabelHelp = document.getElementById('sidebar-label-help');
    if (sidebarLabelHelp) sidebarLabelHelp.textContent = t.navHelp;
    const sidebarLabelSettings = document.getElementById('sidebar-label-settings');
    if (sidebarLabelSettings) sidebarLabelSettings.textContent = t.navSettings;

    // Bottom nav (mobile)
    const navTabLabelHome = document.getElementById('navtab-label-home');
    if (navTabLabelHome) navTabLabelHome.textContent = t.navHome;
    const navTabLabelHelp = document.getElementById('navtab-label-help');
    if (navTabLabelHelp) navTabLabelHelp.textContent = t.navHelp;
    const navTabLabelSettings = document.getElementById('navtab-label-settings');
    if (navTabLabelSettings) navTabLabelSettings.textContent = t.navSettings;

    // Predict button (only when not mid-upload, so we don't clobber progress text)
    const predictBtn = document.getElementById('predict-btn');
    if (predictBtn && !predictBtn.disabled) predictBtn.textContent = t.predictBtn;

    // Help modal title + which instruction block is visible
    const helpTitleEl = document.getElementById('help-title');
    if (helpTitleEl) helpTitleEl.textContent = t.helpTitle;
    const helpEn = document.getElementById('help-en');
    const helpTh = document.getElementById('help-th');
    if (helpEn) helpEn.style.display = lang === 'en' ? 'block' : 'none';
    if (helpTh) helpTh.style.display = lang === 'th' ? 'block' : 'none';

    // Settings modal
    const settingsModalTitle = document.getElementById('settings-modal-title');
    if (settingsModalTitle) settingsModalTitle.textContent = t.settingsTitle;
    const settingsThemeTitle = document.getElementById('settings-theme-title');
    if (settingsThemeTitle) settingsThemeTitle.textContent = t.themeTitle;
    const settingsThemeDesc = document.getElementById('settings-theme-desc');
    if (settingsThemeDesc) settingsThemeDesc.textContent = t.themeDesc;
    const themeLabelLight = document.getElementById('theme-label-light');
    if (themeLabelLight) themeLabelLight.textContent = t.lightMode;
    const themeLabelDark = document.getElementById('theme-label-dark');
    if (themeLabelDark) themeLabelDark.textContent = t.darkMode;
    const settingsLangTitle = document.getElementById('settings-lang-title');
    if (settingsLangTitle) settingsLangTitle.textContent = t.languageTitle;
    const settingsLangDesc = document.getElementById('settings-lang-desc');
    if (settingsLangDesc) settingsLangDesc.textContent = t.languageDesc;

    // If a detection info panel is currently open, refresh its translatable text
    if (currentPanelDetection) {
        const infoContainer = document.getElementById('panel-translatable-info');
        if (infoContainer) infoContainer.innerHTML = buildPanelInfoHTML(currentPanelDetection);
    }
}

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
    // GLOBAL LANGUAGE TOGGLE IN SETTINGS
    // ============================================

    const globalLangToggle = document.getElementById('global-lang-toggle');
    const langOptionEn = document.getElementById('lang-option-en');
    const langOptionTh = document.getElementById('lang-option-th');

    function updateLanguageUI() {
        if (currentLanguage === 'th') {
            if (globalLangToggle) globalLangToggle.checked = true;
            if (langOptionEn) langOptionEn.classList.remove('active');
            if (langOptionTh) langOptionTh.classList.add('active');
        } else {
            if (globalLangToggle) globalLangToggle.checked = false;
            if (langOptionEn) langOptionEn.classList.add('active');
            if (langOptionTh) langOptionTh.classList.remove('active');
        }
    }

    function switchLanguage(lang) {
        applyLanguage(lang);
        updateLanguageUI();
    }

    // Initialize language UI + apply default language text everywhere
    switchLanguage(currentLanguage);

    if (globalLangToggle) {
        globalLangToggle.addEventListener('change', function() {
            switchLanguage(this.checked ? 'th' : 'en');
        });
    }

    if (langOptionEn) {
        langOptionEn.addEventListener('click', function() {
            if (currentLanguage !== 'en') switchLanguage('en');
        });
    }

    if (langOptionTh) {
        langOptionTh.addEventListener('click', function() {
            if (currentLanguage !== 'th') switchLanguage('th');
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
        alert(TRANSLATIONS[currentLanguage].pleaseSelectImage);
        return;
    }

    closeDetectionPanel();

    const submitButton = document.querySelector('#upload-form button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.textContent = TRANSLATIONS[currentLanguage].processing;
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
        const t = TRANSLATIONS[currentLanguage];
        alert(t.errorPrefix + error.message + t.errorSuffix);
    } finally {
        submitButton.textContent = originalButtonText;
        submitButton.disabled    = false;
    }
}

// Step 1: upload the file to the Space's /gradio_api/upload endpoint.
// Returns the server-side path Gradio assigned to the uploaded file.
async function uploadFileToSpace(file) {
    const formData = new FormData();
    formData.append("files", file);

    const res = await fetch(`${HF_SPACE_URL}/gradio_api/upload`, {
        method: "POST",
        body: formData,
        credentials: "omit" // <-- key fix: no cookies sent, so the browser
                             //     doesn't require Access-Control-Allow-Credentials
    });

    if (!res.ok) {
        throw new Error(`Upload failed with status ${res.status}`);
    }

    const paths = await res.json(); // e.g. ["/tmp/gradio/xxxx/photo.jpg"]
    if (!paths || !paths[0]) {
        throw new Error("Upload succeeded but returned no file path");
    }
    return paths[0];
}

// Step 2: call the predict_api endpoint with a reference to the uploaded file.
// This kicks off the job and returns an event_id we use to stream the result.
async function startPrediction(uploadedPath) {
    const res = await fetch(`${HF_SPACE_URL}/gradio_api/call/predict_api`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "omit",
        body: JSON.stringify({
            data: [
                {
                    path: uploadedPath,
                    meta: { _type: "gradio.FileData" }
                }
            ]
        })
    });

    if (!res.ok) {
        throw new Error(`Prediction request failed with status ${res.status}`);
    }

    const { event_id } = await res.json();
    if (!event_id) {
        throw new Error("Server did not return an event_id");
    }
    return event_id;
}

// Step 3: listen on the SSE stream for the result. EventSource defaults to
// withCredentials:false, which is equivalent to credentials:"omit" — so this
// avoids the CORS/credentials mismatch too.
function streamPredictionResult(eventId) {
    return new Promise((resolve, reject) => {
        const es = new EventSource(`${HF_SPACE_URL}/gradio_api/call/predict_api/${eventId}`);

        es.addEventListener("complete", (event) => {
            es.close();
            try {
                const payload = JSON.parse(event.data); // [resultObject]
                resolve(payload);
            } catch (err) {
                reject(new Error("Failed to parse prediction result"));
            }
        });

        es.addEventListener("error", (event) => {
            es.close();
            reject(new Error(event.data || "Prediction stream failed"));
        });

        // Safety net in case the connection itself drops without an explicit
        // "error" event from the server (e.g. network failure).
        es.onerror = () => {
            es.close();
            reject(new Error("Connection to prediction stream was lost"));
        };
    });
}

// Helper function to retry the whole upload -> predict -> stream flow,
// to ride out a Space cold start.
async function connectAndPredictWithRetry(file, submitButton, maxRetries = 3, retryDelay = 5000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const t = TRANSLATIONS[currentLanguage];
        try {
            if (attempt > 1) {
                submitButton.textContent = t.wakingServer(attempt, maxRetries);
                console.log(`Retry attempt ${attempt}/${maxRetries} after ${retryDelay}ms delay`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }

            submitButton.textContent = attempt === 1 ? t.uploadingImage : t.reconnecting(attempt, maxRetries);
            const uploadedPath = await uploadFileToSpace(file);

            submitButton.textContent = t.processingImage;
            const eventId = await startPrediction(uploadedPath);
            const payload = await streamPredictionResult(eventId);

            return { data: payload }; // keep the same shape handleImageUpload expects

        } catch (error) {
            console.error(`Attempt ${attempt} failed:`, error);

            if (attempt === maxRetries) {
                throw new Error(t.connectionFailed(maxRetries));
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

// Builds the translatable inner content of the info panel (confidence,
// air quality, and species description) for the currently selected language.
// Re-run whenever the panel opens AND whenever the language is switched
// while a panel is already open (see applyLanguage()).
function buildPanelInfoHTML(detection) {
    const t = TRANSLATIONS[currentLanguage];

    const airQualityLevelText = currentLanguage === 'en'
        ? (AIR_QUALITY_LEVEL_EN[detection.air_quality] || detection.air_quality)
        : detection.air_quality;

    const airQualityDescText = currentLanguage === 'en'
        ? (AIR_QUALITY_DESC_EN[detection.air_quality_description] || detection.air_quality_description)
        : detection.air_quality_description;

    const speciesEntry = SPECIES_DESCRIPTIONS[detection.name];
    const speciesDescText = speciesEntry ? speciesEntry[currentLanguage] : null;

    return `
        <div class="panel-info-section">
            <div class="info-label">${t.confidence}</div>
            <div class="info-value">${(detection.confidence * 100).toFixed(0)}%</div>
            <div class="confidence-bar">
                <div class="confidence-fill" style="width:${(detection.confidence * 100).toFixed(0)}%"></div>
            </div>
        </div>
        <div class="panel-info-section">
            <div class="info-label">${t.airQualityLevel}</div>
            <div class="air-quality-bar" style="background:${detection.air_quality_color}"></div>
            <div class="info-value-large">${airQualityLevelText}</div>
            <div class="info-description">${airQualityDescText}</div>
        </div>
        <div class="panel-info-section species-description-section">
            <div class="info-label">${t.description}</div>
            <p class="species-description-text">${speciesDescText || t.noDescription}</p>
        </div>`;
}

function showDetectionPanel(detection, imgElement) {
    activeDetectionId = detection.id;
    activeBbox        = detection.bbox;
    currentPanelDetection = detection;

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
        <div id="panel-translatable-info">${buildPanelInfoHTML(detection)}</div>`;

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
