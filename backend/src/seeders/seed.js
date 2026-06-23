require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const bcrypt    = require('bcrypt');
const sequelize = require('../config/database');
require('../../models/associations');
const { User, Trip, Attraction, Interest, UserInterest, TripAttraction } = require('../../models/associations');

// ── Data ─────────────────────────────────────────────────────────────────────

// Plain-text passwords — hashed before insert in seed()
const rawUsers = [
  { id:1, firstName:'Hila',  lastName:'Sagi',      email:'hila.sagi@travelz.com',       password:'Admin@123',  role:'admin',   theme:'light' },
  { id:2, firstName:'Daniel',lastName:'Cohen',      email:'daniel.cohen@travelz.com',     password:'Daniel@456', role:'user',    theme:'light' },
  { id:3, firstName:'Chen',  lastName:'Birnfeld',   email:'chen.birnfeld@travelz.com',    password:'Admin@789',  role:'admin',   theme:'light' },
  { id:4, firstName:'Noa',   lastName:'Levi',       email:'noa.levi@travelz.com',         password:'Manager@1',  role:'manager', theme:'light' },
  { id:5, firstName:'Yossi', lastName:'Mizrahi',    email:'yossi.mizrahi@travelz.com',    password:'User@456',   role:'user',    theme:'light' },
  { id:6, firstName:'Maya',  lastName:'Katz',       email:'maya.katz@travelz.com',        password:'Manager@2',  role:'manager', theme:'light' },
  { id:7, firstName:'Omer',  lastName:'Ben David',  email:'omer.bendavid@travelz.com',    password:'User@789',   role:'user',    theme:'light' },
];

const interests = [
  { id:1,  name:'Adventure'      }, { id:2,  name:'Beach'           },
  { id:3,  name:'Culture'        }, { id:4,  name:'Food & Drink'    },
  { id:5,  name:'History'        }, { id:6,  name:'Nature'          },
  { id:7,  name:'Nightlife'      }, { id:8,  name:'Photography'     },
  { id:9,  name:'Religious Sites'}, { id:10, name:'Shopping'        },
  { id:11, name:'Sport'          }, { id:12, name:'Architecture'    },
  { id:13, name:'Art & Museums'  }, { id:14, name:'Music'           },
  { id:15, name:'Wildlife'       }, { id:16, name:'Hiking'          },
  { id:17, name:'Skiing'         }, { id:18, name:'Diving'          },
  { id:19, name:'Cycling'        }, { id:20, name:'Backpacking'     },
  { id:21, name:'Luxury Travel'  }, { id:22, name:'Budget Travel'   },
  { id:23, name:'Family Travel'  }, { id:24, name:'Solo Travel'     },
  { id:25, name:'Romantic Trips' },
];

const A = (id, name, city, country, category, rating, desc, lat, lng) => ({
  id, name, city, country, category, rating,
  description: desc,
  imageUrl: '',
  latitude: lat,
  longitude: lng,
});

const attractions = [
  // ── Europe ──────────────────────────────────────────────────────────────
  A(1,  'Eiffel Tower',          'Paris',        'France',         'Landmark',     4.8, 'Iconic iron lattice tower on the Champ de Mars.',            48.8584,   2.2945),
  A(2,  'Colosseum',             'Rome',         'Italy',          'History',      4.7, 'Ancient amphitheatre in the centre of Rome, built 70–80 AD.', 41.8902,  12.4922),
  A(3,  'Sagrada Família',       'Barcelona',    'Spain',          'Architecture', 4.9, 'Unfinished basilica designed by Antoni Gaudí.',               41.4036,   2.1744),
  A(4,  'Acropolis',             'Athens',       'Greece',         'History',      4.8, 'Ancient citadel containing the Parthenon and other structures.',37.9715, 23.7267),
  A(5,  'Big Ben',               'London',       'UK',             'Landmark',     4.6, 'Famous clock tower at the north end of the Palace of Westminster.',51.5007,-0.1246),
  A(6,  'Louvre Museum',         'Paris',        'France',         'Museum',       4.8, 'World\'s largest art museum, home to the Mona Lisa.',         48.8606,   2.3376),
  A(7,  'Tower of London',       'London',       'UK',             'History',      4.6, 'Historic castle on the north bank of the River Thames.',      51.5081,  -0.0759),
  A(8,  'Trevi Fountain',        'Rome',         'Italy',          'Landmark',     4.8, '18th-century Baroque fountain, the largest in Rome.',         41.9009,  12.4833),
  A(9,  'Alhambra',              'Granada',      'Spain',          'Architecture', 4.8, 'Palace and fortress complex from the Moorish period.',        37.1767,  -3.5886),
  A(10, 'Santorini',             'Thira',        'Greece',         'Landmark',     4.9, 'Stunning island with white-washed buildings and caldera views.',36.3932,  25.4615),
  A(11, 'Amsterdam Canals',      'Amsterdam',    'Netherlands',    'Landmark',     4.7, '17th-century canal ring, UNESCO World Heritage.',            52.3676,   4.9041),
  A(12, 'Prague Castle',         'Prague',       'Czech Republic', 'Architecture', 4.8, 'Largest ancient castle in the world.',                       50.0908,  14.4005),
  A(13, 'Neuschwanstein Castle', 'Füssen',       'Germany',        'Architecture', 4.8, '19th-century Romanesque Revival palace.',                     47.5576,  10.7498),
  A(14, 'Vatican Museums',       'Vatican City', 'Vatican',        'Museum',       4.7, 'Christian and art museums within Vatican City.',              41.9065,  12.4536),
  A(15, 'Versailles Palace',     'Versailles',   'France',         'Architecture', 4.8, 'Royal château with magnificent gardens.',                     48.8049,   2.1204),
  A(16, 'Dubrovnik Old Town',    'Dubrovnik',    'Croatia',        'History',      4.8, 'Walled city on the Adriatic coast.',                          42.6507,  18.0944),
  A(17, 'Plitvice Lakes',        'Plitvice',     'Croatia',        'Nature',       4.9, 'Terraced lakes and waterfalls in a dense forest.',            44.8654,  15.5820),
  A(18, 'Northern Lights',       'Tromsø',       'Norway',         'Nature',       4.9, 'Aurora Borealis visible from Norway Sep–Mar.',                69.6492,  18.9553),
  A(19, 'Norwegian Fjords',      'Bergen',       'Norway',         'Nature',       4.9, 'Deep glacier-carved inlets with dramatic scenery.',           60.3913,   5.3221),
  A(20, 'Mont Saint-Michel',     'Normandy',     'France',         'Architecture', 4.8, 'Island commune topped with a medieval abbey.',                48.6361,  -1.5115),
  A(21, 'Lake Bled',             'Bled',         'Slovenia',       'Nature',       4.9, 'Glacial lake with a picturesque island church.',              46.3683,  14.0943),
  A(22, 'Pompeii',               'Naples',       'Italy',          'History',      4.8, 'Ancient Roman city preserved under volcanic ash.',            40.7489,  14.4989),
  A(23, 'Amalfi Coast',          'Amalfi',       'Italy',          'Nature',       4.8, 'UNESCO-listed coastline with cliffside villages.',            40.6340,  14.6027),
  A(24, 'Edinburgh Castle',      'Edinburgh',    'UK',             'History',      4.7, 'Historic fortress on Castle Rock.',                           55.9486,  -3.1999),
  A(25, 'Stonehenge',            'Wiltshire',    'UK',             'History',      4.6, 'Prehistoric monument of standing stones.',                    51.1789,  -1.8262),
  A(26, 'Hallstatt Village',     'Hallstatt',    'Austria',        'Landmark',     4.9, 'Picturesque lakeside village in the Salzkammergut region.',   47.5622,  13.6493),
  A(27, 'Swiss Alps',            'Interlaken',   'Switzerland',    'Nature',       4.9, 'Breathtaking alpine scenery with skiing and hiking.',         46.6863,   7.8632),
  A(28, 'Matterhorn',            'Zermatt',      'Switzerland',    'Nature',       4.9, 'Iconic pyramid-shaped peak on the Swiss-Italian border.',     45.9763,   7.6586),
  A(29, 'Venice Canals',         'Venice',       'Italy',          'Landmark',     4.7, 'Unique floating city built on 118 small islands.',            45.4408,  12.3155),
  A(30, 'Colmar Old Town',       'Colmar',       'France',         'Landmark',     4.7, 'Well-preserved medieval town in Alsace.',                     48.0793,   7.3585),
  // ── Asia ────────────────────────────────────────────────────────────────
  A(31, 'Mount Fuji',            'Fujinomiya',   'Japan',          'Nature',       4.9, 'Japan\'s highest peak at 3,776 m.',                           35.3606, 138.7274),
  A(32, 'Tokyo Skytree',         'Tokyo',        'Japan',          'Landmark',     4.6, 'World\'s second tallest structure.',                          35.7101, 139.8107),
  A(33, 'Fushimi Inari Shrine',  'Kyoto',        'Japan',          'Religious',    4.8, 'Famous Shinto shrine with thousands of vermilion torii gates.',34.9671,135.7727),
  A(34, 'Kyoto Bamboo Grove',    'Kyoto',        'Japan',          'Nature',       4.7, 'Magical walkway through towering bamboo stalks.',             35.0177, 135.6721),
  A(35, 'Taj Mahal',             'Agra',         'India',          'Architecture', 4.9, 'Ivory-white marble mausoleum, UNESCO heritage.',             27.1751,  78.0421),
  A(36, 'Angkor Wat',            'Siem Reap',    'Cambodia',       'Religious',    4.8, 'Largest religious monument in the world.',                    13.4125, 103.8670),
  A(37, 'Great Wall of China',   'Beijing',      'China',          'Landmark',     4.8, 'Ancient series of walls totalling over 21,000 km.',           40.4319, 116.5704),
  A(38, 'Forbidden City',        'Beijing',      'China',          'History',      4.7, 'Imperial palace complex from the Ming dynasty.',              39.9163, 116.3972),
  A(39, 'Terracotta Army',       'Xi\'an',       'China',          'History',      4.8, 'Terracotta sculptures depicting the armies of Qin Shi Huang.',34.3841, 109.2785),
  A(40, 'Ha Long Bay',           'Quảng Ninh',   'Vietnam',        'Nature',       4.9, '3,000 limestone karsts in an emerald sea.',                   20.9101, 107.1839),
  A(41, 'Petronas Towers',       'Kuala Lumpur', 'Malaysia',       'Architecture', 4.7, 'Twin skyscrapers, tallest buildings 1998–2004.',               3.1578, 101.7116),
  A(42, 'Marina Bay Sands',      'Singapore',    'Singapore',      'Landmark',     4.6, 'Iconic integrated resort with rooftop infinity pool.',         1.2834, 103.8607),
  A(43, 'Burj Khalifa',          'Dubai',        'UAE',            'Architecture', 4.7, 'World\'s tallest building at 828 m.',                         25.1972,  55.2744),
  A(44, 'Palm Jumeirah',         'Dubai',        'UAE',            'Landmark',     4.5, 'Artificial archipelago shaped like a palm tree.',             25.1124,  55.1390),
  A(45, 'Hagia Sophia',          'Istanbul',     'Turkey',         'Architecture', 4.8, 'Former Greek Orthodox cathedral, now museum and mosque.',     41.0086,  28.9802),
  A(46, 'Blue Mosque',           'Istanbul',     'Turkey',         'Religious',    4.8, '17th-century Ottoman mosque with six minarets.',             41.0055,  28.9769),
  A(47, 'Petra',                 'Ma\'an',       'Jordan',         'History',      4.9, 'Rose-red city carved into rock by the Nabataeans.',           30.3285,  35.4444),
  A(48, 'Cappadocia',            'Nevşehir',     'Turkey',         'Landmark',     4.9, 'Surreal landscape of fairy chimneys, famous for hot-air balloons.',38.6431,34.8289),
  A(49, 'Bagan Temples',         'Mandalay',     'Myanmar',        'Religious',    4.8, 'Over 2,000 Buddhist temples across a vast plain.',            21.1717,  94.8585),
  A(50, 'Borobudur',             'Magelang',     'Indonesia',      'Religious',    4.7, '9th-century Mahayana Buddhist temple, world\'s largest.',    -7.6079, 110.2038),
  A(51, 'Bali Rice Terraces',    'Ubud',         'Indonesia',      'Nature',       4.7, 'Elaborate water management system for rice cultivation.',     -8.3405, 115.0920),
  A(52, 'Komodo National Park',  'East Nusa Tenggara','Indonesia', 'Nature',       4.8, 'Home to Komodo dragons and stunning pink beaches.',          -8.5562, 119.4830),
  A(53, 'Phi Phi Islands',       'Krabi',        'Thailand',       'Beach',        4.7, 'Stunning island group in the Andaman Sea.',                    7.7407,  98.7784),
  A(54, 'Grand Palace Bangkok',  'Bangkok',      'Thailand',       'Architecture', 4.8, 'Complex of buildings at the heart of Bangkok.',               13.7500, 100.4913),
  A(55, 'Everest Base Camp',     'Solukhumbu',   'Nepal',          'Nature',       4.9, 'Trek to the base camp of the world\'s highest mountain.',     28.0026,  86.8528),
  // ── Americas ────────────────────────────────────────────────────────────
  A(56, 'Machu Picchu',          'Cusco',        'Peru',           'History',      4.9, '15th-century Inca citadel set high in the Andes.',           -13.1631, -72.5450),
  A(57, 'Christ the Redeemer',   'Rio de Janeiro','Brazil',        'Landmark',     4.8, 'Art Deco statue of Jesus Christ, 30 m tall.',                -22.9519, -43.2105),
  A(58, 'Iguazu Falls',          'Misiones',     'Argentina',      'Nature',       4.9, 'One of the world\'s largest waterfall systems.',             -25.6953, -54.4367),
  A(59, 'Grand Canyon',          'Arizona',      'USA',            'Nature',       4.9, 'Steep-sided canyon carved by the Colorado River.',            36.0544,-112.1401),
  A(60, 'Statue of Liberty',     'New York',     'USA',            'Landmark',     4.7, 'Colossal neoclassical sculpture on Liberty Island.',          40.6892, -74.0445),
  A(61, 'Central Park',          'New York',     'USA',            'Park',         4.8, '843-acre public park in the heart of Manhattan.',             40.7829, -73.9654),
  A(62, 'Golden Gate Bridge',    'San Francisco','USA',            'Landmark',     4.7, 'Suspension bridge spanning the Golden Gate.',                 37.8199,-122.4783),
  A(63, 'Yellowstone',           'Wyoming',      'USA',            'Nature',       4.9, 'First US national park, famous for geothermal features.',     44.4280,-110.5885),
  A(64, 'Chichen Itza',          'Yucatan',      'Mexico',         'History',      4.7, 'Pre-Columbian Maya city with El Castillo pyramid.',           20.6843, -88.5678),
  A(65, 'Patagonia',             'Santa Cruz',   'Argentina',      'Nature',       4.9, 'Vast wilderness at the southern tip of South America.',      -50.5000, -73.0000),
  A(66, 'Galápagos Islands',     'Galápagos',    'Ecuador',        'Nature',       4.9, 'Archipelago famous for unique wildlife.',                     -0.9538, -90.9656),
  A(67, 'Amazon Rainforest',     'Manaus',       'Brazil',         'Nature',       4.8, 'World\'s largest tropical rainforest.',                       -3.1190, -60.0217),
  A(68, 'Banff National Park',   'Alberta',      'Canada',         'Nature',       4.9, 'Canada\'s oldest national park with stunning mountain scenery.',51.4968,-115.9281),
  A(69, 'Niagara Falls',         'Ontario',      'Canada',         'Nature',       4.7, 'Three waterfalls at the Canada-USA border.',                  43.0962, -79.0377),
  A(70, 'Teotihuacan',           'Mexico City',  'Mexico',         'History',      4.7, 'Ancient Mesoamerican city with Pyramid of the Sun and Moon.',  19.6925, -98.8438),
  A(71, 'Tikal',                 'Petén',        'Guatemala',      'History',      4.7, 'Ruined Maya city with towering temple pyramids.',             17.2220, -89.6237),
  A(72, 'Walt Disney World',     'Orlando',      'USA',            'Entertainment',4.7, 'Enormous entertainment complex, world\'s most visited resort.',28.3852, -81.5639),
  A(73, 'Rocky Mountains',       'Denver',       'USA',            'Nature',       4.8, 'Major mountain range in western North America.',              39.7392,-104.9903),
  A(74, 'Times Square',          'New York',     'USA',            'Entertainment',4.4, 'Commercial hub in Midtown Manhattan.',                        40.7580, -73.9855),
  A(75, 'Hollywood Walk of Fame','Los Angeles',  'USA',            'Entertainment',4.3, '15 blocks of terrazzo sidewalk with celebrity stars.',        34.1016,-118.3267),
  // ── Africa & Middle East ────────────────────────────────────────────────
  A(76, 'Pyramids of Giza',      'Giza',         'Egypt',          'History',      4.8, 'Ancient wonder of the world.',                               29.9792,  31.1342),
  A(77, 'Serengeti National Park','Mara',        'Tanzania',       'Nature',       4.9, 'Famous for the annual Great Migration.',                      -2.3333,  34.8333),
  A(78, 'Victoria Falls',        'Livingstone',  'Zambia',         'Nature',       4.9, 'Largest waterfall in the world by combined width and height.',-17.9243,  25.8572),
  A(79, 'Table Mountain',        'Cape Town',    'South Africa',   'Nature',       4.8, 'Flat-topped mountain with views over Cape Town.',            -33.9628,  18.4098),
  A(80, 'Marrakech Medina',      'Marrakech',    'Morocco',        'History',      4.7, 'UNESCO-listed old city filled with souks and palaces.',       31.6295,  -7.9811),
  A(81, 'Sahara Desert',         'Merzouga',     'Morocco',        'Nature',       4.8, 'World\'s largest hot desert with iconic sand dunes.',        31.0800,  -4.0130),
  A(82, 'Dead Sea',              'Amman',        'Jordan',         'Nature',       4.6, 'Salt lake at the lowest point on Earth.',                     31.5590,  35.4732),
  A(83, 'Wadi Rum',              'Ma\'an',       'Jordan',         'Nature',       4.8, 'Protected desert landscape with dramatic sandstone mountains.',29.5767,  35.4194),
  A(84, 'Masai Mara',            'Narok',        'Kenya',          'Nature',       4.9, 'National reserve famous for the annual wildebeest migration.', -1.4061,  35.0007),
  A(85, 'Kruger National Park',  'Limpopo',      'South Africa',   'Nature',       4.8, 'One of Africa\'s largest game reserves, home to the Big Five.',-23.9884,  31.5547),
  A(86, 'Abu Simbel Temples',    'Aswan',        'Egypt',          'History',      4.8, 'Two massive rock temples built by Ramesses II.',              22.3372,  31.6258),
  A(87, 'Zanzibar Beach',        'Zanzibar',     'Tanzania',       'Beach',        4.7, 'Exotic island with pristine white sand beaches.',             -6.1659,  39.2026),
  A(88, 'Sossusvlei Dunes',      'Hardap',       'Namibia',        'Nature',       4.8, 'Red sand dunes in the Namib Desert.',                        -24.7252,  15.3458),
  A(89, 'Robben Island',         'Cape Town',    'South Africa',   'History',      4.5, 'Former prison island where Nelson Mandela was held.',        -33.8054,  18.3712),
  A(90, 'Nile River Cruise',     'Luxor',        'Egypt',          'Landmark',     4.7, 'Journey along the world\'s longest river.',                   25.7000,  32.6333),
  // ── Oceania ─────────────────────────────────────────────────────────────
  A(91, 'Sydney Opera House',    'Sydney',       'Australia',      'Architecture', 4.8, 'Multi-venue performing arts centre, iconic building.',       -33.8568, 151.2153),
  A(92, 'Great Barrier Reef',    'Cairns',       'Australia',      'Nature',       4.9, 'World\'s largest coral reef system.',                        -18.2871, 147.6992),
  A(93, 'Uluru',                 'Northern Territory','Australia',  'Nature',       4.8, 'Sacred sandstone monolith at the heart of Australia.',      -25.3444, 131.0369),
  A(94, 'Bondi Beach',           'Sydney',       'Australia',      'Beach',        4.6, 'Famous ocean beach just 7 km from Sydney\'s CBD.',           -33.8915, 151.2767),
  A(95, 'Milford Sound',         'Fiordland',    'New Zealand',    'Nature',       4.9, 'Fiord in New Zealand\'s South Island, Eighth Wonder of World.',-44.6714, 167.9180),
  A(96, 'Hobbiton',              'Matamata',     'New Zealand',    'Landmark',     4.7, 'Real-life movie set from The Lord of the Rings trilogy.',    -37.8724, 175.6822),
  A(97, 'Whitehaven Beach',      'Whitsundays',  'Australia',      'Beach',        4.9, '7 km stretch of pure white silica sand.',                    -20.2784, 149.0394),
  // ── More Europe & Asia ──────────────────────────────────────────────────
  A(98,  'Ephesus',              'Izmir',        'Turkey',         'History',      4.7, 'Ancient Greek city with remarkably preserved ruins.',         37.9394,  27.3418),
  A(99,  'Prambanan Temple',     'Yogyakarta',   'Indonesia',      'Religious',    4.7, '9th-century Hindu temple compound.',                         -7.7520, 110.4914),
  A(100, 'Giant\'s Causeway',    'Antrim',       'UK',             'Nature',       4.7, 'About 40,000 interlocking basalt columns.',                  55.2408,  -6.5116),
  A(101, 'Charles Bridge',       'Prague',       'Czech Republic', 'Landmark',     4.6, 'Medieval stone bridge crossing the Vltava river.',           50.0865,  14.4114),
  A(102, 'Wat Arun',             'Bangkok',      'Thailand',       'Religious',    4.7, 'Buddhist temple of dawn on the Chao Phraya River.',          13.7437, 100.4888),
  A(103, 'Chiang Mai Night Bazaar','Chiang Mai', 'Thailand',       'Entertainment',4.5, 'Lively open-air market with local handicrafts.',             18.7883,  98.9931),
  A(104, 'Forbidden City Wall',  'Beijing',      'China',          'Architecture', 4.6, 'Outer walls surrounding the Forbidden City.',                39.9163, 116.3972),
  A(105, 'Jaipur Pink City',     'Jaipur',       'India',          'History',      4.7, 'Historic walled city nicknamed "Pink City".',                26.9124,  75.7873),
];

const trips = [
  { id:1, userId:1, title:'European Highlights 2024', description:'Two-week tour of iconic European landmarks.',   startDate:'2024-06-01', endDate:'2024-06-14' },
  { id:2, userId:2, title:'Japan Discovery',          description:'Cherry blossom season and cultural exploration.',startDate:'2024-04-01', endDate:'2024-04-10' },
  { id:3, userId:1, title:'Middle East Adventure',    description:'Ancient history and desert landscapes.',         startDate:'2024-09-15', endDate:'2024-09-25' },
  { id:4, userId:5, title:'South America Backpacking',description:'Budget-friendly trip through Peru and Brazil.', startDate:'2025-01-05', endDate:'2025-01-20' },
  { id:5, userId:4, title:'Southeast Asia Explorer',  description:'Thailand, Cambodia and Vietnam in 3 weeks.',    startDate:'2025-03-01', endDate:'2025-03-21' },
];

const tripAttractions = [
  { tripId:1, attractionId:1,  dayNumber:1, orderInDay:1, notes:'Evening visit for light show' },
  { tripId:1, attractionId:6,  dayNumber:2, orderInDay:1, notes:'Pre-book tickets online'       },
  { tripId:1, attractionId:15, dayNumber:3, orderInDay:1, notes:'Half day at gardens'           },
  { tripId:1, attractionId:2,  dayNumber:5, orderInDay:1, notes:'Morning tour'                  },
  { tripId:1, attractionId:8,  dayNumber:5, orderInDay:2, notes:'Throw a coin!'                 },
  { tripId:1, attractionId:3,  dayNumber:8, orderInDay:1, notes:'Book fast-track entry'         },
  { tripId:2, attractionId:31, dayNumber:1, orderInDay:1, notes:'Clear day needed for views'    },
  { tripId:2, attractionId:33, dayNumber:2, orderInDay:1, notes:'Early morning visit'           },
  { tripId:2, attractionId:34, dayNumber:2, orderInDay:2, notes:'Afternoon walk'                },
  { tripId:3, attractionId:47, dayNumber:1, orderInDay:1, notes:'Full day needed'               },
  { tripId:3, attractionId:76, dayNumber:3, orderInDay:1, notes:'Sunrise camel ride'            },
  { tripId:3, attractionId:48, dayNumber:5, orderInDay:1, notes:'Hot air balloon at dawn'       },
  { tripId:4, attractionId:56, dayNumber:2, orderInDay:1, notes:'Trek early to avoid crowds'   },
  { tripId:4, attractionId:57, dayNumber:5, orderInDay:1, notes:'Cable car up the mountain'    },
  { tripId:5, attractionId:54, dayNumber:1, orderInDay:1, notes:'Afternoon tour'               },
  { tripId:5, attractionId:36, dayNumber:4, orderInDay:1, notes:'Sunrise is magical here'      },
];

const userInterests = [
  { userId:1, interestId:5  }, { userId:1, interestId:12 }, { userId:1, interestId:8  },
  { userId:2, interestId:2  }, { userId:2, interestId:6  }, { userId:2, interestId:18 },
  { userId:3, interestId:3  }, { userId:3, interestId:13 },
  { userId:4, interestId:4  }, { userId:4, interestId:10 },
  { userId:5, interestId:1  }, { userId:5, interestId:16 }, { userId:5, interestId:20 },
  { userId:6, interestId:21 }, { userId:6, interestId:25 },
  { userId:7, interestId:6  }, { userId:7, interestId:15 },
];

// ── Main ─────────────────────────────────────────────────────────────────────

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('Connected to MySQL.');

    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await TripAttraction.destroy({ truncate: true, force: true });
    await UserInterest.destroy({ truncate: true, force: true });
    await Trip.destroy({ truncate: true, force: true });
    await Attraction.destroy({ truncate: true, force: true });
    await Interest.destroy({ truncate: true, force: true });
    await User.destroy({ truncate: true, force: true });
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('Tables cleared.');

    const users = await Promise.all(rawUsers.map(async u => ({
      ...u,
      name: `${u.firstName} ${u.lastName}`,
      password: await bcrypt.hash(u.password, 10),
    })));
    await User.bulkCreate(users);
    console.log(`✓ ${users.length} users seeded (passwords hashed).`);

    await Interest.bulkCreate(interests);
    console.log(`✓ ${interests.length} interests seeded.`);

    await Attraction.bulkCreate(attractions);
    console.log(`✓ ${attractions.length} attractions seeded (with coordinates).`);

    await Trip.bulkCreate(trips);
    console.log(`✓ ${trips.length} trips seeded.`);

    await TripAttraction.bulkCreate(tripAttractions);
    console.log(`✓ ${tripAttractions.length} trip-attraction links seeded.`);

    await UserInterest.bulkCreate(userInterests);
    console.log(`✓ ${userInterests.length} user-interest links seeded.`);

    console.log('\n🌍 Seed complete! Coordinates added to all attractions.');
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

seed();
