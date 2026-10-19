/** Cities for sunset/sunrise times, with coordinates and time zone. */
export type City = {
  id: string;
  he: string;
  en: string;
  latitude: number;
  longitude: number;
  tzid: string;
};

const IL = 'Asia/Jerusalem';

const israel = (id: string, he: string, en: string, latitude: number, longitude: number): City => ({
  id,
  he,
  en,
  latitude,
  longitude,
  tzid: IL,
});

export const ISRAEL_CITIES: City[] = [
  israel('jerusalem', 'ירושלים', 'Jerusalem', 31.7683, 35.2137),
  israel('bnei-brak', 'בני ברק', 'Bnei Brak', 32.0807, 34.8338),
  israel('tel-aviv', 'תל אביב', 'Tel Aviv', 32.0853, 34.7818),
  israel('petah-tikva', 'פתח תקווה', 'Petah Tikva', 32.084, 34.8878),
  israel('beit-shemesh', 'בית שמש', 'Beit Shemesh', 31.747, 34.9881),
  israel('modiin-illit', 'מודיעין עילית', "Modi'in Illit", 31.933, 35.042),
  israel('modiin', 'מודיעין', "Modi'in", 31.898, 35.0104),
  israel('beitar-illit', 'ביתר עילית', 'Beitar Illit', 31.696, 35.115),
  israel('elad', 'אלעד', 'Elad', 32.052, 34.951),
  israel('ashdod', 'אשדוד', 'Ashdod', 31.8014, 34.6435),
  israel('haifa', 'חיפה', 'Haifa', 32.794, 34.9896),
  israel('netanya', 'נתניה', 'Netanya', 32.3215, 34.8532),
  israel('beer-sheva', 'באר שבע', "Be'er Sheva", 31.252, 34.7915),
  israel('rehovot', 'רחובות', 'Rehovot', 31.8928, 34.8113),
  israel('safed', 'צפת', 'Safed', 32.9646, 35.496),
  israel('tiberias', 'טבריה', 'Tiberias', 32.7922, 35.5312),
  israel('rishon-lezion', 'ראשון לציון', 'Rishon LeZion', 31.973, 34.7925),
  israel('ramat-gan', 'רמת גן', 'Ramat Gan', 32.0684, 34.8248),
  israel('holon', 'חולון', 'Holon', 32.0158, 34.7874),
  israel('raanana', 'רעננה', "Ra'anana", 32.1848, 34.8713),
  israel('kfar-saba', 'כפר סבא', 'Kfar Saba', 32.175, 34.907),
  israel('herzliya', 'הרצליה', 'Herzliya', 32.1624, 34.8447),
  israel('ashkelon', 'אשקלון', 'Ashkelon', 31.6688, 34.5743),
  israel('kiryat-gat', 'קריית גת', 'Kiryat Gat', 31.61, 34.7642),
  israel('netivot', 'נתיבות', 'Netivot', 31.421, 34.588),
  israel('ofakim', 'אופקים', 'Ofakim', 31.313, 34.62),
  israel('eilat', 'אילת', 'Eilat', 29.5577, 34.9519),
  israel('afula', 'עפולה', 'Afula', 32.6078, 35.2897),
  israel('karmiel', 'כרמיאל', 'Karmiel', 32.919, 35.295),
  israel('nahariya', 'נהריה', 'Nahariya', 33.0058, 35.094),
  israel('hadera', 'חדרה', 'Hadera', 32.434, 34.9196),
  israel('maale-adumim', 'מעלה אדומים', "Ma'ale Adumim", 31.777, 35.298),
  israel('efrat', 'אפרת', 'Efrat', 31.653, 35.15),
  israel('givat-zeev', 'גבעת זאב', "Giv'at Ze'ev", 31.863, 35.168),
  israel('kiryat-malachi', 'קריית מלאכי', 'Kiryat Malachi', 31.73, 34.744),
  israel('rosh-haayin', 'ראש העין', "Rosh HaAyin", 32.0956, 34.9566),
  israel('lod', 'לוד', 'Lod', 31.951, 34.888),
  israel('yavne', 'יבנה', 'Yavne', 31.878, 34.739),
  israel('kiryat-ata', 'קריית אתא', 'Kiryat Ata', 32.809, 35.107),
  israel('zichron-yaakov', 'זכרון יעקב', "Zikhron Ya'akov", 32.57, 34.953),
  israel('kiryat-shmona', 'קריית שמונה', 'Kiryat Shmona', 33.207, 35.57),
  israel('arad', 'ערד', 'Arad', 31.26, 35.213),
  israel('dimona', 'דימונה', 'Dimona', 31.07, 35.033),
  israel('ariel', 'אריאל', 'Ariel', 32.106, 35.187),
  israel('emmanuel', 'עמנואל', 'Emmanuel', 32.161, 35.136),
];

const city = (
  id: string,
  he: string,
  en: string,
  latitude: number,
  longitude: number,
  tzid: string,
): City => ({ id, he, en, latitude, longitude, tzid });

export const ABROAD_CITIES: City[] = [
  city('new-york', 'ניו יורק', 'New York', 40.7128, -74.006, 'America/New_York'),
  city('lakewood', 'לייקווד', 'Lakewood', 40.0821, -74.2097, 'America/New_York'),
  city('monsey', 'מונסי', 'Monsey', 41.1112, -74.0685, 'America/New_York'),
  city('baltimore', 'בולטימור', 'Baltimore', 39.2904, -76.6122, 'America/New_York'),
  city('philadelphia', 'פילדלפיה', 'Philadelphia', 39.9526, -75.1652, 'America/New_York'),
  city('washington', 'וושינגטון', 'Washington DC', 38.9072, -77.0369, 'America/New_York'),
  city('boston', 'בוסטון', 'Boston', 42.3601, -71.0589, 'America/New_York'),
  city('miami', 'מיאמי', 'Miami', 25.7617, -80.1918, 'America/New_York'),
  city('cleveland', 'קליבלנד', 'Cleveland', 41.4993, -81.6944, 'America/New_York'),
  city('detroit', 'דטרויט', 'Detroit', 42.3314, -83.0458, 'America/Detroit'),
  city('chicago', 'שיקגו', 'Chicago', 41.8781, -87.6298, 'America/Chicago'),
  city('los-angeles', 'לוס אנג׳לס', 'Los Angeles', 34.0522, -118.2437, 'America/Los_Angeles'),
  city('toronto', 'טורונטו', 'Toronto', 43.6532, -79.3832, 'America/Toronto'),
  city('montreal', 'מונטריאול', 'Montreal', 45.5017, -73.5673, 'America/Toronto'),
  city('mexico-city', 'מקסיקו סיטי', 'Mexico City', 19.4326, -99.1332, 'America/Mexico_City'),
  city('sao-paulo', 'סאו פאולו', 'São Paulo', -23.5505, -46.6333, 'America/Sao_Paulo'),
  city('buenos-aires', 'בואנוס איירס', 'Buenos Aires', -34.6037, -58.3816, 'America/Argentina/Buenos_Aires'),
  city('london', 'לונדון', 'London', 51.5074, -0.1278, 'Europe/London'),
  city('manchester', 'מנצ׳סטר', 'Manchester', 53.4808, -2.2426, 'Europe/London'),
  city('paris', 'פריז', 'Paris', 48.8566, 2.3522, 'Europe/Paris'),
  city('marseille', 'מרסיי', 'Marseille', 43.2965, 5.3698, 'Europe/Paris'),
  city('antwerp', 'אנטוורפן', 'Antwerp', 51.2194, 4.4025, 'Europe/Brussels'),
  city('zurich', 'ציריך', 'Zurich', 47.3769, 8.5417, 'Europe/Zurich'),
  city('berlin', 'ברלין', 'Berlin', 52.52, 13.405, 'Europe/Berlin'),
  city('budapest', 'בודפשט', 'Budapest', 47.4979, 19.0402, 'Europe/Budapest'),
  city('kyiv', 'קייב', 'Kyiv', 50.4501, 30.5234, 'Europe/Kyiv'),
  city('moscow', 'מוסקבה', 'Moscow', 55.7558, 37.6173, 'Europe/Moscow'),
  city('johannesburg', 'יוהנסבורג', 'Johannesburg', -26.2041, 28.0473, 'Africa/Johannesburg'),
  city('melbourne', 'מלבורן', 'Melbourne', -37.8136, 144.9631, 'Australia/Melbourne'),
  city('sydney', 'סידני', 'Sydney', -33.8688, 151.2093, 'Australia/Sydney'),
];
