javascript
// Initialize map
const map = L.map('map').setView([20.5937, 78.9629], 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Add geocoder control
L.Control.geocoder({
    defaultMarkGeocode: false
}).on('markgeocode', function(e) {
    map.fitBounds(e.geocode.bbox);
}).addTo(map);

// Flood risk layer (simulated - in production use real API)
const floodRiskLayer = L.layerGroup().addTo(map);
const floodRiskData = {
    "type": "FeatureCollection",
    "features": [
        // This would come from a flood prediction API in production
        {
            "type": "Feature",
            "properties": {"risk": "high", "description": "High flood risk area"},
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [78.9, 20.5], [78.95, 20.5], [78.95, 20.55], [78.9, 20.55], [78.9, 20.5]
                ]]
            }
        }
    ]
};

// Add flood risk areas to map
floodRiskData.features.forEach(feature => {
    const riskLevel = feature.properties.risk;
    let color;
    switch(riskLevel) {
        case 'high': color = 'red'; break;
        case 'medium': color = 'orange'; break;
        case 'low': color = 'yellow'; break;
        default: color = 'blue';
    }
    
    L.geoJSON(feature, {
        style: {
            fillColor: color,
            weight: 2,
            opacity: 1,
            color: 'white',
            fillOpacity: 0.7
        }
    }).bindPopup(`<b>Flood Risk:</b> ${feature.properties.description}`)
      .addTo(floodRiskLayer);
});

// User location and weather
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        
        const userMarker = L.marker([lat, lon]).addTo(map)
            .bindPopup("<b>Your Location</b>").openPopup();
        
        map.setView([lat, lon], 13);
        
        try {
            // Get weather data (replace with your OpenWeatherMap API key)
            const weatherResponse = await axios.get(
                `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=be6a213ee9d4f7ab2e15d3ba4a437da3&units=metric`
            );
            
            const weather = weatherResponse.data;
            const weatherHtml = `
                <h4>Current Weather</h4>
                <p><b>Condition:</b> ${weather.weather[0].description}</p>
                <p><b>Temperature:</b> ${weather.main.temp}°C</p>
                <p><b>Humidity:</b> ${weather.main.humidity}%</p>
                <p><b>Rain (1h):</b> ${weather.rain ? weather.rain['1h'] || '0' : '0'} mm</p>
                <p><b>Wind:</b> ${weather.wind.speed} m/s</p>
            `;
            
            document.getElementById('weather-info').innerHTML = weatherHtml;
            
            // Check for flood risk
            checkFloodRisk(lat, lon, weather);
            
        } catch (error) {
            console.error("Error fetching weather:", error);
        }
    });
}

function checkFloodRisk(lat, lon, weatherData) {
    // Simple flood risk assessment (in production use proper flood API)
    let floodRisk = 'low';
    let message = 'Low flood risk in your area';
    
    if (weatherData.rain && weatherData.rain['1h'] > 10) {
        floodRisk = 'high';
        message = 'Warning: Heavy rainfall detected. High flood risk!';
    } else if (weatherData.main.humidity > 80 && weatherData.rain) {
        floodRisk = 'medium';
        message = 'Moderate flood risk due to high humidity and rainfall';
    }
    
    alert(`Flood Alert: ${message}`);
}

// Route finding (simplified)
document.getElementById('get-route').addEventListener('click', async () => {
    const destination = document.getElementById('destination').value;
    
    if (!destination) {
        alert('Please enter a destination');
        return;
    }
    
    // In production, use a proper routing API that considers flood data
    alert(`Finding safest route to ${destination} (avoiding flood zones)`);
});

// Flood reporting
document.getElementById('report-flood').addEventListener('click', () => {
    if (confirm('Report flood in your current area?')) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            
            // In production, send this to your backend
            const marker = L.marker([lat, lon], {
                icon: L.divIcon({
                    className: 'flood-report-icon',
                    html: '⚠️',
                    iconSize: [30, 30]
                })
            }).addTo(map)
              .bindPopup(`<b>User-reported flood</b><br>Reported just now`);
            
            alert('Thank you for your flood report! This will help others.');
            
            // Here you would send the report to your backend/Telegram bot
            // await axios.post('/api/report-flood', { lat, lon });
        });
    }
});
