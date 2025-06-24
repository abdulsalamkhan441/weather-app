import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { format, parseISO, fromUnixTime, addDays } from 'date-fns'
import { SunIcon, MoonIcon, MapPinIcon } from '@heroicons/react/24/outline'

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

const ICONS = {
  wind: 'https://img.icons8.com/fluency/96/windsock.png',
  humidity: 'https://img.icons8.com/fluency/96/hygrometer.png',
  pressure: 'https://img.icons8.com/fluency/96/air-element.png',
  thermometer: 'https://img.icons8.com/fluency/96/thermometer.png',
  aqi: 'https://img.icons8.com/fluency/96/factory.png'
}

const App = () => {
  const [location, setLocation] = useState('')
  const [unit, setUnit] = useState('metric')
  const [weatherData, setWeatherData] = useState(null)
  const [forecastData, setForecastData] = useState(null)
  const [aqiData, setAqiData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [time, setTime] = useState(new Date())
  const [error, setError] = useState(null)

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!location) return
    fetchWeatherByLocation(location)
  }, [location, unit])

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords
      fetchWeatherByCoords(latitude, longitude)
    })
  }, [unit])

  const fetchWeatherByLocation = async (loc) => {
    try {
      setLoading(true)
      setError(null)
      const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${loc}&units=${unit}&appid=${API_KEY}`)
      const forecastRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${loc}&units=${unit}&appid=${API_KEY}`)
      const weather = await weatherRes.json()
      const forecast = await forecastRes.json()
      if (weather.cod !== 200) {
        setError(weather.message || 'Location not found')
        setWeatherData(null)
        setForecastData(null)
        setAqiData(null)
        return
      }
      setWeatherData(weather)
      setForecastData(forecast)
      if (weather.coord) {
        fetchAqi(weather.coord.lat, weather.coord.lon)
      } else {
        setAqiData(null)
      }
    } catch (err) {
      setError('Failed to fetch weather data')
      setWeatherData(null)
      setForecastData(null)
      setAqiData(null)
    } finally {
      setLoading(false)
    }
  }

  const fetchWeatherByCoords = async (lat, lon) => {
    try {
      setLoading(true)
      const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${unit}&appid=${API_KEY}`)
      const forecastRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${unit}&appid=${API_KEY}`)
      const aqiRes = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`)
      const weather = await weatherRes.json()
      const forecast = await forecastRes.json()
      const aqi = await aqiRes.json()
      setWeatherData(weather)
      setForecastData(forecast)
      setAqiData(aqi.list?.[0])
      setLocation(weather.name)
    } catch (err) {
      console.error('API Error:', err)
      setWeatherData(null)
      setForecastData(null)
      setAqiData(null)
    } finally {
      setLoading(false)
    }
  }

  const fetchAqi = async (lat, lon) => {
    try {
      const aqiRes = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`)
      const aqi = await aqiRes.json()
      setAqiData(aqi.list?.[0])
    } catch (err) {
      setAqiData(null)
    }
  }

  const currentTime = format(time, 'EEE, MMM d yyyy | HH:mm:ss')
  const bg = "bg-[#1e202c] text-[#bfc0d1]"

  const getFiveDayForecast = () => {
    if (!forecastData) return []
    const dailyData = {}
    forecastData.list.forEach(item => {
      const date = format(parseISO(item.dt_txt), 'yyyy-MM-dd')
      if (!dailyData[date]) {
        dailyData[date] = {
          date,
          temp: item.main.temp,
          weather: item.weather[0],
          count: 1
        }
      } else {
        dailyData[date].temp += item.main.temp
        dailyData[date].count++
      }
    })
    return Object.values(dailyData)
      .map(day => ({
        ...day,
        temp: Math.round(day.temp / day.count)
      }))
      .slice(0, 5)
  }

  return (
    <div className={`min-h-screen p-6 ${bg} font-sans`}>
      <header className="max-w-5xl mx-auto mb-10 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-[#60519b]"
        >
          Weather Dashboard
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-[#bfc0d1]/70"
        >
          Real-time weather and air quality updates
        </motion.p>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xs text-[#bfc0d1]/50 mt-2"
        >
          {currentTime}
        </motion.p>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex w-full max-w-lg mx-auto gap-2 mt-6"
        >
          <motion.div
            className="flex-1"
            whileHover={{ boxShadow: '0 0 24px 4px #a855f7, 0 0 60px 8px #a855f744' }}
            style={{ borderRadius: '0.75rem' }} 
          >
            <input
              type="text"
              placeholder="Search location..."
              className="w-full p-3 rounded-xl bg-[#31323e]/80 border border-[#60519b] placeholder-gray-400"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </motion.div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setUnit(u => u === 'metric' ? 'imperial' : 'metric')}
            className="px-4 py-2 bg-[#60519b] rounded-xl text-[#F3BD68] font-bold hover:bg-[#C7843B] transition"
          >
            °{unit === 'metric' ? 'C' : 'F'}
          </motion.button>
        </motion.div>
      </header>

      {loading && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-gray-300"
        >
          Loading weather data...
        </motion.p>
      )}
      {error && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-red-400 font-semibold mt-4"
        >
          {error}
        </motion.p>
      )}

      <AnimatePresence>
        {weatherData && forecastData && (
          <motion.main 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <motion.section 
              whileHover={{ y: -5, boxShadow: '0 0 24px 4px #3b82f6, 0 0 60px 8px #2563eb44' }}
              className="bg-[#23243a] border border-[#60519b]/30 shadow-lg p-6 rounded-2xl flex flex-col justify-between"
            >
              <div>
                <h2 className="text-xl font-bold text-[#bfc0d1] mb-4 flex items-center gap-2">
                  <MapPinIcon className="h-6 w-6 text-[#60519b]" />
                  {weatherData.name}
                </h2>
                <div className="text-6xl font-bold text-[#60519b] mb-2">
                  {Math.round(weatherData.main.temp)}°{unit === 'metric' ? 'C' : 'F'}
                </div>
                <div className="text-gray-400 text-lg capitalize mb-4">
                  {weatherData.weather[0].description}
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm justify-center">
                <SunIcon className="h-5 w-5 text-yellow-300" />
                {format(fromUnixTime(weatherData.sys.sunrise), 'HH:mm')} |
                <MoonIcon className="h-5 w-5 text-indigo-400" />
                {format(fromUnixTime(weatherData.sys.sunset), 'HH:mm')}
              </div>
            </motion.section>

            <WeatherStatBox 
              icon={ICONS.wind}
              label="Wind"
              value={`${weatherData.wind.speed} m/s`}
              color="from-blue-500/20 to-blue-700/20"
            />

            <WeatherStatBox 
              icon={ICONS.humidity}
              label="Humidity"
              value={`${weatherData.main.humidity}%`}
              color="from-green-500/20 to-green-700/20"
            />

            <WeatherStatBox 
              icon={ICONS.pressure}
              label="Pressure"
              value={`${weatherData.main.pressure} hPa`}
              color="from-purple-500/20 to-purple-700/20"
            />

            <motion.section 
              whileHover={{ y: -5, boxShadow: '0 0 24px 4px #3b82f6, 0 0 60px 8px #2563eb44' }}
              className="md:col-span-2 bg-[#23243a] border border-[#60519b]/30 shadow-lg p-6 rounded-2xl"
            >
              <h2 className="text-xl font-bold text-[#bfc0d1] mb-4">Next Hours</h2>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={forecastData.list.slice(0, 8).map(i => ({
                  time: format(parseISO(i.dt_txt), 'HH:mm'),
                  temp: i.main.temp
                }))}>
                  <XAxis dataKey="time" stroke="#bfc0d1" />
                  <YAxis stroke="#bfc0d1" />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="temp" 
                    stroke="#60519b" 
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#F3BD68' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.section>

            <motion.section 
              whileHover={{ y: -5, boxShadow: '0 0 24px 4px #3b82f6, 0 0 60px 8px #2563eb44' }}
              className="md:col-span-3 bg-[#23243a] border border-[#60519b]/30 shadow-lg p-6 rounded-2xl"
            >
              <h2 className="text-xl font-bold text-[#bfc0d1] mb-6">5-Day Forecast</h2>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {getFiveDayForecast().map((day, i) => (
                  <motion.div 
                    key={day.date}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-[#31323e] p-4 rounded-lg text-center"
                  >
                    <p className="font-bold text-[#bfc0d1]">
                      {i === 0 ? 'Today' : format(addDays(new Date(), i), 'EEE')}
                    </p>
                    <p className="text-sm text-gray-400">
                      {format(parseISO(day.date), 'MMM d')}
                    </p>
                    <p className="text-2xl font-bold text-[#60519b] my-2">
                      {day.temp}°{unit === 'metric' ? 'C' : 'F'}
                    </p>
                    <p className="text-sm text-gray-400 capitalize">
                      {day.weather.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.section>

            <motion.section 
              whileHover={{ y: -5, boxShadow: '0 0 24px 4px #3b82f6, 0 0 60px 8px #2563eb44' }}
              className="md:col-span-3 bg-[#23243a] border border-[#60519b]/30 shadow-lg p-6 rounded-2xl"
            >
              <h2 className="text-xl font-bold text-[#bfc0d1] mb-4">Air Quality</h2>
              {aqiData ? (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                  <motion.img 
                    src={ICONS.aqi} 
                    alt="AQI" 
                    className="h-20 w-20"
                    animate={{
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                  />
                  <div className="text-center sm:text-left">
                    <p className="text-[#60519b] font-bold text-3xl">AQI: {aqiData.main.aqi}</p>
                    <p className="text-base text-gray-400">{aqiDescription(aqiData.main.aqi)}</p>
                    <div className="mt-2 w-full bg-gray-700 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${
                          aqiData.main.aqi === 1 ? 'bg-green-500' :
                          aqiData.main.aqi === 2 ? 'bg-yellow-500' :
                          aqiData.main.aqi === 3 ? 'bg-orange-500' :
                          aqiData.main.aqi === 4 ? 'bg-red-500' : 'bg-purple-500'
                        }`}
                        style={{ width: `${aqiData.main.aqi * 20}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400">No AQI data available.</p>
              )}
            </motion.section>
          </motion.main>
        )}
      </AnimatePresence>
    </div>
  )
}

const WeatherStatBox = ({ icon, label, value, color }) => (
  <motion.div 
    whileHover={{ y: -5, scale: 1.02, boxShadow: '0 0 24px 4px #3b82f6, 0 0 60px 8px #2563eb44' }}
    className={`bg-gradient-to-br ${color} border border-[#60519b]/30 shadow-lg p-6 rounded-2xl`}
  >
    <div className="text-center">
      <motion.img 
        src={icon} 
        alt={label} 
        className="h-12 w-12 mx-auto mb-3"
        whileHover={{ scale: 1.1 }}
      />
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-[#bfc0d1]">{value}</p>
    </div>
  </motion.div>
)

const aqiDescription = (aqi) => {
  switch (aqi) {
    case 1: return 'Good - Air quality is satisfactory'
    case 2: return 'Fair - Air quality is acceptable'
    case 3: return 'Moderate - Sensitive groups should limit outdoor exertion'
    case 4: return 'Poor - Health alert for everyone'
    case 5: return 'Very Poor - Health warnings of emergency conditions'
    default: return 'Unknown air quality'
  }
}

export default App