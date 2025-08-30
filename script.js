const apiKey = '764d2d47ab6dc7b4ac20d1d7c112baa5';

// 1. เลือก DOM Elements
const searchForm = document.querySelector('#search-form');
const cityInput = document.querySelector('#city-input');
const favoritesContainer = document.querySelector('#favorites-container');
const refreshBtn = document.querySelector('#refresh-btn');

// --- EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', loadFavoriteCities);

searchForm.addEventListener('submit', event => {
    event.preventDefault();
    const cityName = cityInput.value.trim().toLowerCase();
    if (cityName) {
        addCityToFavorites(cityName);
        cityInput.value = '';
    }
});

favoritesContainer.addEventListener('click', event => {
    if (event.target.classList.contains('remove-btn')) {
        const card = event.target.closest('.weather-card');
        const cityName = card.dataset.city;
        if (cityName) {
            removeCityFromFavorites(cityName);
        }
    }
});

refreshBtn.addEventListener('click', loadFavoriteCities);

// --- FUNCTIONS ---
function getFavoriteCities() {
    const citiesJSON = localStorage.getItem('favoriteCities');
    return citiesJSON ? JSON.parse(citiesJSON) : [];
}

function saveFavoriteCities(cities) {
    localStorage.setItem('favoriteCities', JSON.stringify(cities));
}

function loadFavoriteCities() {
    favoritesContainer.innerHTML = '';
    const cities = getFavoriteCities();
    cities.forEach(city => fetchAndDisplayWeather(city));
}

async function addCityToFavorites(cityName) {
    let cities = getFavoriteCities();
    if (!cities.includes(cityName)) {
        cities.push(cityName);
        saveFavoriteCities(cities);
        loadFavoriteCities();
    } else {
        alert(`${cityName} อยู่ในรายการโปรดแล้ว`);
    }
}

function removeCityFromFavorites(cityName) {
    let cities = getFavoriteCities();
    const updatedCities = cities.filter(city => city !== cityName);
    saveFavoriteCities(updatedCities);
    loadFavoriteCities();
}

async function fetchAndDisplayWeather(city) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=th`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`ไม่พบข้อมูลของ ${city}`);

        const data = await response.json();
        const { name, main, weather } = data;

        // [BONUS] เปลี่ยนสีพื้นหลัง
        document.body.style.background = getBackgroundColor(weather[0].main);

        const card = document.createElement('div');
        card.className = 'weather-card';
        card.setAttribute('data-city', city);

        card.innerHTML = `
            <div>
                <h3>${name}</h3>
                <p>${weather[0].description}</p>
            </div>
            <div class="text-right">
                <p class="temp">${main.temp.toFixed(1)}°C</p>
            </div>
            <button class="remove-btn">X</button>
        `;

        favoritesContainer.appendChild(card);

        // [BONUS] เรียกข้อมูลพยากรณ์อากาศ
        fetchForecast(city);

    } catch (error) {
        console.error(error);
        const card = document.createElement('div');
        card.className = 'weather-card';
        card.innerHTML = `<h3>${city}</h3><p class="error">${error.message}</p>`;
        favoritesContainer.appendChild(card);
    }
}

// --- BONUS CHALLENGE FUNCTIONS ---

/**
 * [BONUS] ดึงข้อมูลพยากรณ์อากาศ 5 วัน
 */
async function fetchForecast(city) {
    const forecastApiUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric&lang=th`;
    try {
        const response = await fetch(forecastApiUrl);
        if (!response.ok) return;

        const data = await response.json();
        const dailyForecasts = data.list.filter(item => item.dt_txt.includes("12:00:00"));

        let forecastHtml = '<div class="forecast-container">';
        dailyForecasts.slice(0, 5).forEach(forecast => { // แสดงสูงสุด 5 วัน
            const date = new Date(forecast.dt * 1000);
            const day = date.toLocaleDateString('th-TH', { weekday: 'short' });
            forecastHtml += `
                <div class="forecast-day">
                    <p>${day}</p>
                    <img src="https://openweathermap.org/img/wn/${forecast.weather[0].icon}.png" alt="${forecast.weather[0].description}">
                    <p><strong>${forecast.main.temp.toFixed(0)}°C</strong></p>
                </div>
            `;
        });
        forecastHtml += '</div>';

        const cityCard = favoritesContainer.querySelector(`.weather-card[data-city="${city}"]`);
        if (cityCard) {
            // ใช้ insertAdjacentHTML เพื่อแทรก forecastHtml ต่อท้าย card
            const forecastElement = document.createElement('div');
            forecastElement.innerHTML = forecastHtml;
            cityCard.insertAdjacentElement('afterend', forecastElement);
        }

    } catch (error) {
        console.error("Failed to fetch forecast:", error);
    }
}


/**
 * [BONUS] คืนค่าสีพื้นหลังตามสภาพอากาศ
 */
function getBackgroundColor(weatherMain) {
    switch (weatherMain) {
        case 'Clear':
            return '#4A90E2'; // ฟ้าโปร่ง
        case 'Clouds':
            return '#7F8C8D'; // มีเมฆ
        case 'Rain':
        case 'Drizzle':
            return '#4E6E81'; // ฝนตก
        case 'Thunderstorm':
            return '#2C3E50'; // พายุ
        case 'Snow':
            return '#BDC3C7'; // หิมะ
        default:
            return '#003554'; // ค่าเริ่มต้น
    }
}