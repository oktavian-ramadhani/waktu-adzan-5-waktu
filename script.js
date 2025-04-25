// DOM Elements
const greetingElement = document.getElementById('greeting');
const dateElement = document.getElementById('date');
const locationElement = document.getElementById('city');
const currentTimeElement = document.getElementById('current-time');
const prayerCards = {
    fajr: document.getElementById('fajr'),
    dhuhr: document.getElementById('dhuhr'),
    asr: document.getElementById('asr'),
    maghrib: document.getElementById('maghrib'),
    isha: document.getElementById('isha')
};
const prayerTimeElements = {
    fajr: prayerCards.fajr.querySelector('.prayer-time'),
    dhuhr: prayerCards.dhuhr.querySelector('.prayer-time'),
    asr: prayerCards.asr.querySelector('.prayer-time'),
    maghrib: prayerCards.maghrib.querySelector('.prayer-time'),
    isha: prayerCards.isha.querySelector('.prayer-time')
};

// Settings Modal Elements
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeBtn = document.querySelector('.close-btn');
const citySelect = document.getElementById('city-select');
const methodSelect = document.getElementById('method-select');
const saveSettingsBtn = document.getElementById('save-settings');

// App State
let currentLocation = {
    city: 'Jakarta',
    latitude: -6.2088,
    longitude: 106.8456
};
let calculationMethod = 1; // Default: Kemenag
let prayerTimes = {};

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Load saved settings or use defaults
    loadSettings();
    
    // Get prayer times
    getPrayerTimes();
    
    // Setup event listeners
    setupEventListeners();
});

function setupEventListeners() {
    // Settings modal
    settingsBtn.addEventListener('click', () => {
        settingsModal.style.display = 'flex';
        populateCitySelect();
    });
    
    closeBtn.addEventListener('click', () => {
        settingsModal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
    });
    
    saveSettingsBtn.addEventListener('click', saveSettings);
}

function updateDateTime() {
    const now = new Date();
    const hours = now.getHours();
    
    // Update greeting based on time
    if (hours < 12) {
        greetingElement.textContent = "Selamat Pagi";
    } else if (hours < 15) {
        greetingElement.textContent = "Selamat Siang";
    } else if (hours < 18) {
        greetingElement.textContent = "Selamat Sore";
    } else {
        greetingElement.textContent = "Selamat Malam";
    }
    
    // Update date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateElement.textContent = now.toLocaleDateString('id-ID', options);
    
    // Update current time
    currentTimeElement.textContent = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    // Update background based on time
    updateBackground(hours);
    
    // Highlight current prayer
    highlightCurrentPrayer(now);
}

function updateBackground(hours) {
    const body = document.body;
    
    if (hours >= 4 && hours < 7) {
        body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    } else if (hours >= 7 && hours < 12) {
        body.style.background = 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)';
    } else if (hours >= 12 && hours < 16) {
        body.style.background = 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)';
    } else if (hours >= 16 && hours < 19) {
        body.style.background = 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)';
    } else {
        body.style.background = 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)';
    }
}

function highlightCurrentPrayer(now) {
    // Reset all cards
    Object.values(prayerCards).forEach(card => {
        card.classList.remove('current');
    });
    
    // If we have prayer times, determine which prayer we're in
    if (prayerTimes && prayerTimes.fajr) {
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        // Convert prayer times to minutes since midnight for comparison
        const fajrTime = convertTimeToMinutes(prayerTimes.fajr);
        const dhuhrTime = convertTimeToMinutes(prayerTimes.dhuhr);
        const asrTime = convertTimeToMinutes(prayerTimes.asr);
        const maghribTime = convertTimeToMinutes(prayerTimes.maghrib);
        const ishaTime = convertTimeToMinutes(prayerTimes.isha);
        
        if (currentTime >= ishaTime || currentTime < fajrTime) {
            prayerCards.isha.classList.add('current');
        } else if (currentTime >= maghribTime) {
            prayerCards.maghrib.classList.add('current');
        } else if (currentTime >= asrTime) {
            prayerCards.asr.classList.add('current');
        } else if (currentTime >= dhuhrTime) {
            prayerCards.dhuhr.classList.add('current');
        } else if (currentTime >= fajrTime) {
            prayerCards.fajr.classList.add('current');
        }
    }
}

function convertTimeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

async function getPrayerTimes() {
    try {
        const date = new Date();
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        
        // Using Aladhan API
        const response = await fetch(`https://api.aladhan.com/v1/timings/${day}-${month}-${year}?latitude=${currentLocation.latitude}&longitude=${currentLocation.longitude}&method=${calculationMethod}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch prayer times');
        }
        
        const data = await response.json();
        
        // Extract prayer times
        const timings = data.data.timings;
        prayerTimes = {
            fajr: timings.Fajr,
            dhuhr: timings.Dhuhr,
            asr: timings.Asr,
            maghrib: timings.Maghrib,
            isha: timings.Isha
        };
        
        // Update UI
        updatePrayerTimesUI();
        
        // Update location if we have it
        if (data.data.meta && data.data.meta.timezone) {
            const city = data.data.meta.timezone.split('/')[1] || currentLocation.city;
            locationElement.textContent = city;
            currentLocation.city = city;
        }
    } catch (error) {
        console.error('Error fetching prayer times:', error);
        // Fallback to default times if API fails
        prayerTimes = {
            fajr: '04:30',
            dhuhr: '12:00',
            asr: '15:30',
            maghrib: '18:00',
            isha: '19:30'
        };
        updatePrayerTimesUI();
    }
}

function updatePrayerTimesUI() {
    prayerTimeElements.fajr.textContent = prayerTimes.fajr;
    prayerTimeElements.dhuhr.textContent = prayerTimes.dhuhr;
    prayerTimeElements.asr.textContent = prayerTimes.asr;
    prayerTimeElements.maghrib.textContent = prayerTimes.maghrib;
    prayerTimeElements.isha.textContent = prayerTimes.isha;
}

function loadSettings() {
    const savedCity = localStorage.getItem('prayerTimesCity');
    const savedLat = localStorage.getItem('prayerTimesLat');
    const savedLng = localStorage.getItem('prayerTimesLng');
    const savedMethod = localStorage.getItem('prayerTimesMethod');
    
    if (savedCity && savedLat && savedLng) {
        currentLocation = {
            city: savedCity,
            latitude: parseFloat(savedLat),
            longitude: parseFloat(savedLng)
        };
        locationElement.textContent = savedCity;
    }
    
    if (savedMethod) {
        calculationMethod = parseInt(savedMethod);
        methodSelect.value = calculationMethod;
    }
}

function saveSettings() {
    const selectedCity = citySelect.value;
    const selectedMethod = methodSelect.value;
    
    if (selectedCity) {
        const cityData = JSON.parse(selectedCity);
        currentLocation = {
            city: cityData.city,
            latitude: cityData.lat,
            longitude: cityData.lng
        };
        
        localStorage.setItem('prayerTimesCity', cityData.city);
        localStorage.setItem('prayerTimesLat', cityData.lat);
        localStorage.setItem('prayerTimesLng', cityData.lng);
        
        locationElement.textContent = cityData.city;
    }
    
    if (selectedMethod) {
        calculationMethod = parseInt(selectedMethod);
        localStorage.setItem('prayerTimesMethod', calculationMethod);
    }
    
    // Refresh prayer times
    getPrayerTimes();
    
    // Close modal
    settingsModal.style.display = 'none';
}

async function populateCitySelect() {
    // Load Indonesian cities with coordinates
    try {
        const response = await fetch('https://raw.githubusercontent.com/lutangar/cities.json/master/cities.json');
        if (!response.ok) throw new Error('Failed to fetch cities');
        
        const cities = await response.json();
        const indonesianCities = cities.filter(city => city.country === 'ID');
        
        citySelect.innerHTML = '';
        
        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Pilih Kota';
        citySelect.appendChild(defaultOption);
        
        // Add Indonesian cities
        indonesianCities.forEach(city => {
            const option = document.createElement('option');
            option.value = JSON.stringify({
                city: city.name,
                lat: city.lat,
                lng: city.lng
            });
            option.textContent = city.name;
            
            // Select current city if it matches
            if (city.name === currentLocation.city) {
                option.selected = true;
            }
            
            citySelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching cities:', error);
        citySelect.innerHTML = '<option value="">Gagal memuat daftar kota</option>';
    }
}