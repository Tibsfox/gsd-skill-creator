/**
 * GPE — Global Power Efficiency Rankings 2024-2025
 * Shared data module for all GPE pages
 * Sources: Ember 2025, Energy Institute 2025, IMF WEO Oct 2025, World Bank, IEA
 */

const GPE_DATA = [
  { rank: 1,  country: "Ireland",       flag: "\u{1F1EE}\u{1F1EA}", region: "europe",       pop: 5.1,    twh: 35,    gdpCap: 106000, intensity: 0.65, tier: "Elite",  tierNum: 1, efficiency: 99 },
  { rank: 2,  country: "Nigeria",       flag: "\u{1F1F3}\u{1F1EC}", region: "africa",       pop: 224,    twh: 34,    gdpCap: 2280,   intensity: 0.67, tier: "Elite",  tierNum: 1, efficiency: 98 },
  { rank: 3,  country: "Switzerland",   flag: "\u{1F1E8}\u{1F1ED}", region: "europe",       pop: 9,      twh: 65,    gdpCap: 105670, intensity: 0.68, tier: "Elite",  tierNum: 1, efficiency: 98 },
  { rank: 4,  country: "Luxembourg",    flag: "\u{1F1F1}\u{1F1FA}", region: "europe",       pop: 0.66,   twh: 6.5,   gdpCap: 131300, intensity: 0.75, tier: "Elite",  tierNum: 1, efficiency: 97 },
  { rank: 5,  country: "UK",            flag: "\u{1F1EC}\u{1F1E7}", region: "europe",       pop: 67.7,   twh: 305,   gdpCap: 56660,  intensity: 0.80, tier: "Elite",  tierNum: 1, efficiency: 97 },
  { rank: 6,  country: "Ethiopia",      flag: "\u{1F1EA}\u{1F1F9}", region: "africa",       pop: 126,    twh: 17,    gdpCap: 1600,   intensity: 0.84, tier: "Elite",  tierNum: 1, efficiency: 97 },
  { rank: 7,  country: "Denmark",       flag: "\u{1F1E9}\u{1F1F0}", region: "europe",       pop: 5.9,    twh: 36,    gdpCap: 68900,  intensity: 0.89, tier: "Elite",  tierNum: 1, efficiency: 96 },
  { rank: 8,  country: "Kenya",         flag: "\u{1F1F0}\u{1F1EA}", region: "africa",       pop: 55,     twh: 13,    gdpCap: 2280,   intensity: 1.04, tier: "Elite",  tierNum: 1, efficiency: 96 },
  { rank: 9,  country: "Singapore",     flag: "\u{1F1F8}\u{1F1EC}", region: "asia-pacific", pop: 6,      twh: 58,    gdpCap: 88450,  intensity: 1.09, tier: "Elite",  tierNum: 1, efficiency: 96 },
  { rank: 10, country: "Germany",       flag: "\u{1F1E9}\u{1F1EA}", region: "europe",       pop: 84.5,   twh: 506,   gdpCap: 54560,  intensity: 1.10, tier: "Elite",  tierNum: 1, efficiency: 96 },
  { rank: 11, country: "Netherlands",   flag: "\u{1F1F3}\u{1F1F1}", region: "europe",       pop: 17.8,   twh: 125,   gdpCap: 63750,  intensity: 1.10, tier: "Elite",  tierNum: 1, efficiency: 96 },
  { rank: 12, country: "Tanzania",      flag: "\u{1F1F9}\u{1F1FF}", region: "africa",       pop: 65,     twh: 10,    gdpCap: 1340,   intensity: 1.15, tier: "Elite",  tierNum: 1, efficiency: 95 },
  { rank: 13, country: "Belgium",       flag: "\u{1F1E7}\u{1F1EA}", region: "europe",       pop: 11.7,   twh: 82,    gdpCap: 55590,  intensity: 1.26, tier: "Elite",  tierNum: 1, efficiency: 95 },
  { rank: 14, country: "Austria",       flag: "\u{1F1E6}\u{1F1F9}", region: "europe",       pop: 9,      twh: 70,    gdpCap: 59230,  intensity: 1.31, tier: "Elite",  tierNum: 1, efficiency: 95 },
  { rank: 15, country: "France",        flag: "\u{1F1EB}\u{1F1F7}", region: "europe",       pop: 68,     twh: 423,   gdpCap: 47360,  intensity: 1.31, tier: "Elite",  tierNum: 1, efficiency: 95 },
  { rank: 16, country: "Italy",         flag: "\u{1F1EE}\u{1F1F9}", region: "europe",       pop: 58.9,   twh: 311,   gdpCap: 39580,  intensity: 1.33, tier: "Elite",  tierNum: 1, efficiency: 95 },
  { rank: 17, country: "Israel",        flag: "\u{1F1EE}\u{1F1F1}", region: "middle-east",  pop: 9.8,    twh: 71,    gdpCap: 53370,  intensity: 1.36, tier: "Elite",  tierNum: 1, efficiency: 95 },
  { rank: 18, country: "USA",           flag: "\u{1F1FA}\u{1F1F8}", region: "americas",     pop: 340,    twh: 4273,  gdpCap: 85370,  intensity: 1.47, tier: "Elite",  tierNum: 1, efficiency: 94 },
  { rank: 19, country: "Australia",     flag: "\u{1F1E6}\u{1F1FA}", region: "asia-pacific", pop: 26.5,   twh: 265,   gdpCap: 66590,  intensity: 1.50, tier: "Elite",  tierNum: 1, efficiency: 94 },
  { rank: 20, country: "Latvia",        flag: "\u{1F1F1}\u{1F1FB}", region: "europe",       pop: 1.9,    twh: 7,     gdpCap: 23320,  intensity: 1.58, tier: "Elite",  tierNum: 1, efficiency: 94 },
  { rank: 21, country: "DR Congo",      flag: "\u{1F1E8}\u{1F1E9}", region: "africa",       pop: 102,    twh: 11,    gdpCap: 680,    intensity: 1.59, tier: "Elite",  tierNum: 1, efficiency: 94 },
  { rank: 22, country: "Romania",       flag: "\u{1F1F7}\u{1F1F4}", region: "europe",       pop: 19,     twh: 59,    gdpCap: 19530,  intensity: 1.59, tier: "Elite",  tierNum: 1, efficiency: 94 },
  { rank: 23, country: "Spain",         flag: "\u{1F1EA}\u{1F1F8}", region: "europe",       pop: 47.9,   twh: 265,   gdpCap: 34040,  intensity: 1.62, tier: "Elite",  tierNum: 1, efficiency: 94 },
  { rank: 24, country: "Lithuania",     flag: "\u{1F1F1}\u{1F1F9}", region: "europe",       pop: 2.9,    twh: 13,    gdpCap: 26540,  intensity: 1.69, tier: "Elite",  tierNum: 1, efficiency: 93 },
  { rank: 25, country: "Mexico",        flag: "\u{1F1F2}\u{1F1FD}", region: "americas",     pop: 130,    twh: 323,   gdpCap: 14490,  intensity: 1.72, tier: "Elite",  tierNum: 1, efficiency: 93 },
  { rank: 26, country: "Portugal",      flag: "\u{1F1F5}\u{1F1F9}", region: "europe",       pop: 10.4,   twh: 54,    gdpCap: 28970,  intensity: 1.79, tier: "Elite",  tierNum: 1, efficiency: 93 },
  { rank: 27, country: "New Zealand",   flag: "\u{1F1F3}\u{1F1FF}", region: "asia-pacific", pop: 5.1,    twh: 45,    gdpCap: 48780,  intensity: 1.81, tier: "Elite",  tierNum: 1, efficiency: 93 },
  { rank: 28, country: "Estonia",       flag: "\u{1F1EA}\u{1F1EA}", region: "europe",       pop: 1.4,    twh: 8,     gdpCap: 30140,  intensity: 1.90, tier: "Elite",  tierNum: 1, efficiency: 93 },
  { rank: 29, country: "Poland",        flag: "\u{1F1F5}\u{1F1F1}", region: "europe",       pop: 37.6,   twh: 171,   gdpCap: 23010,  intensity: 1.98, tier: "Elite",  tierNum: 1, efficiency: 93 },
  { rank: 30, country: "Czechia",       flag: "\u{1F1E8}\u{1F1FF}", region: "europe",       pop: 10.5,   twh: 67,    gdpCap: 31370,  intensity: 2.04, tier: "Elite",  tierNum: 1, efficiency: 92 },
  { rank: 31, country: "Slovakia",      flag: "\u{1F1F8}\u{1F1F0}", region: "europe",       pop: 5.4,    twh: 27,    gdpCap: 24500,  intensity: 2.04, tier: "Elite",  tierNum: 1, efficiency: 92 },
  { rank: 32, country: "Slovenia",      flag: "\u{1F1F8}\u{1F1EE}", region: "europe",       pop: 2.1,    twh: 14,    gdpCap: 32560,  intensity: 2.05, tier: "Elite",  tierNum: 1, efficiency: 92 },
  { rank: 33, country: "Hungary",       flag: "\u{1F1ED}\u{1F1FA}", region: "europe",       pop: 9.6,    twh: 46,    gdpCap: 23010,  intensity: 2.08, tier: "Elite",  tierNum: 1, efficiency: 92 },
  { rank: 34, country: "Sweden",        flag: "\u{1F1F8}\u{1F1EA}", region: "europe",       pop: 10.5,   twh: 131,   gdpCap: 58530,  intensity: 2.13, tier: "Elite",  tierNum: 1, efficiency: 92 },
  { rank: 35, country: "Greece",        flag: "\u{1F1EC}\u{1F1F7}", region: "europe",       pop: 10.4,   twh: 55,    gdpCap: 24340,  intensity: 2.17, tier: "Elite",  tierNum: 1, efficiency: 92 },
  { rank: 36, country: "Peru",          flag: "\u{1F1F5}\u{1F1EA}", region: "americas",     pop: 34,     twh: 59,    gdpCap: 7770,   intensity: 2.23, tier: "Elite",  tierNum: 1, efficiency: 92 },
  { rank: 37, country: "Croatia",       flag: "\u{1F1ED}\u{1F1F7}", region: "europe",       pop: 3.9,    twh: 19,    gdpCap: 21350,  intensity: 2.28, tier: "Elite",  tierNum: 1, efficiency: 91 },
  { rank: 38, country: "Colombia",      flag: "\u{1F1E8}\u{1F1F4}", region: "americas",     pop: 52,     twh: 89,    gdpCap: 7330,   intensity: 2.34, tier: "Elite",  tierNum: 1, efficiency: 91 },
  { rank: 39, country: "Philippines",   flag: "\u{1F1F5}\u{1F1ED}", region: "asia-pacific", pop: 117,    twh: 115,   gdpCap: 4130,   intensity: 2.38, tier: "Elite",  tierNum: 1, efficiency: 91 },
  { rank: 40, country: "Ghana",         flag: "\u{1F1EC}\u{1F1ED}", region: "africa",       pop: 34,     twh: 20,    gdpCap: 2450,   intensity: 2.40, tier: "Elite",  tierNum: 1, efficiency: 91 },
  { rank: 41, country: "Indonesia",     flag: "\u{1F1EE}\u{1F1E9}", region: "asia-pacific", pop: 277,    twh: 351,   gdpCap: 5270,   intensity: 2.41, tier: "Elite",  tierNum: 1, efficiency: 91 },
  { rank: 42, country: "Bangladesh",    flag: "\u{1F1E7}\u{1F1E9}", region: "asia-pacific", pop: 172,    twh: 116,   gdpCap: 2780,   intensity: 2.43, tier: "Elite",  tierNum: 1, efficiency: 91 },
  { rank: 43, country: "Argentina",     flag: "\u{1F1E6}\u{1F1F7}", region: "americas",     pop: 46,     twh: 153,   gdpCap: 13650,  intensity: 2.44, tier: "Elite",  tierNum: 1, efficiency: 91 },
  { rank: 44, country: "Japan",         flag: "\u{1F1EF}\u{1F1F5}", region: "asia-pacific", pop: 123.5,  twh: 1013,  gdpCap: 33140,  intensity: 2.48, tier: "Elite",  tierNum: 1, efficiency: 91 },
  { rank: 45, country: "Norway",        flag: "\u{1F1F3}\u{1F1F4}", region: "europe",       pop: 5.5,    twh: 125,   gdpCap: 90430,  intensity: 2.51, tier: "High",   tierNum: 2, efficiency: 91 },
  { rank: 46, country: "Finland",       flag: "\u{1F1EB}\u{1F1EE}", region: "europe",       pop: 5.5,    twh: 82,    gdpCap: 56080,  intensity: 2.66, tier: "High",   tierNum: 2, efficiency: 90 },
  { rank: 47, country: "Chile",         flag: "\u{1F1E8}\u{1F1F1}", region: "americas",     pop: 19.5,   twh: 87,    gdpCap: 16610,  intensity: 2.69, tier: "High",   tierNum: 2, efficiency: 90 },
  { rank: 48, country: "Canada",        flag: "\u{1F1E8}\u{1F1E6}", region: "americas",     pop: 40.5,   twh: 618,   gdpCap: 54935,  intensity: 2.78, tier: "High",   tierNum: 2, efficiency: 90 },
  { rank: 49, country: "UAE",           flag: "\u{1F1E6}\u{1F1EA}", region: "middle-east",  pop: 9.5,    twh: 137,   gdpCap: 51350,  intensity: 2.81, tier: "High",   tierNum: 2, efficiency: 90 },
  { rank: 50, country: "Turkey",        flag: "\u{1F1F9}\u{1F1F7}", region: "europe",       pop: 86,     twh: 323,   gdpCap: 13380,  intensity: 2.81, tier: "High",   tierNum: 2, efficiency: 90 },
  { rank: 51, country: "Morocco",       flag: "\u{1F1F2}\u{1F1E6}", region: "middle-east",  pop: 37.5,   twh: 44,    gdpCap: 4120,   intensity: 2.85, tier: "High",   tierNum: 2, efficiency: 89 },
  { rank: 52, country: "Iraq",          flag: "\u{1F1EE}\u{1F1F6}", region: "middle-east",  pop: 45,     twh: 82,    gdpCap: 6180,   intensity: 2.95, tier: "High",   tierNum: 2, efficiency: 89 },
  { rank: 53, country: "Brazil",        flag: "\u{1F1E7}\u{1F1F7}", region: "americas",     pop: 216,    twh: 725,   gdpCap: 11350,  intensity: 2.96, tier: "High",   tierNum: 2, efficiency: 89 },
  { rank: 54, country: "Saudi Arabia",  flag: "\u{1F1F8}\u{1F1E6}", region: "middle-east",  pop: 36.4,   twh: 380,   gdpCap: 32530,  intensity: 3.21, tier: "High",   tierNum: 2, efficiency: 88 },
  { rank: 55, country: "Taiwan",        flag: "\u{1F1F9}\u{1F1FC}", region: "asia-pacific", pop: 23.9,   twh: 282,   gdpCap: 34430,  intensity: 3.43, tier: "High",   tierNum: 2, efficiency: 87 },
  { rank: 56, country: "South Korea",   flag: "\u{1F1F0}\u{1F1F7}", region: "asia-pacific", pop: 51.7,   twh: 605,   gdpCap: 34160,  intensity: 3.43, tier: "High",   tierNum: 2, efficiency: 87 },
  { rank: 57, country: "Malaysia",      flag: "\u{1F1F2}\u{1F1FE}", region: "asia-pacific", pop: 34,     twh: 168,   gdpCap: 13310,  intensity: 3.71, tier: "High",   tierNum: 2, efficiency: 86 },
  { rank: 58, country: "Bulgaria",      flag: "\u{1F1E7}\u{1F1EC}", region: "europe",       pop: 6.5,    twh: 37,    gdpCap: 14810,  intensity: 3.85, tier: "High",   tierNum: 2, efficiency: 86 },
  { rank: 59, country: "Kazakhstan",    flag: "\u{1F1F0}\u{1F1FF}", region: "asia-pacific", pop: 20,     twh: 113,   gdpCap: 14300,  intensity: 3.95, tier: "High",   tierNum: 2, efficiency: 85 },
  { rank: 60, country: "Thailand",      flag: "\u{1F1F9}\u{1F1ED}", region: "asia-pacific", pop: 71.8,   twh: 224,   gdpCap: 7810,   intensity: 3.99, tier: "High",   tierNum: 2, efficiency: 85 },
  { rank: 61, country: "Myanmar",       flag: "\u{1F1F2}\u{1F1F2}", region: "asia-pacific", pop: 54,     twh: 26,    gdpCap: 1190,   intensity: 4.05, tier: "High",   tierNum: 2, efficiency: 85 },
  { rank: 62, country: "Algeria",       flag: "\u{1F1E9}\u{1F1FF}", region: "middle-east",  pop: 45,     twh: 87,    gdpCap: 4470,   intensity: 4.33, tier: "High",   tierNum: 2, efficiency: 84 },
  { rank: 63, country: "Pakistan",      flag: "\u{1F1F5}\u{1F1F0}", region: "asia-pacific", pop: 240,    twh: 171,   gdpCap: 1560,   intensity: 4.57, tier: "High",   tierNum: 2, efficiency: 83 },
  { rank: 64, country: "Serbia",        flag: "\u{1F1F7}\u{1F1F8}", region: "europe",       pop: 6.6,    twh: 36,    gdpCap: 11520,  intensity: 4.74, tier: "High",   tierNum: 2, efficiency: 82 },
  { rank: 65, country: "India",         flag: "\u{1F1EE}\u{1F1F3}", region: "asia-pacific", pop: 1450,   twh: 1957,  gdpCap: 2730,   intensity: 4.94, tier: "High",   tierNum: 2, efficiency: 81 },
  { rank: 66, country: "China",         flag: "\u{1F1E8}\u{1F1F3}", region: "asia-pacific", pop: 1410,   twh: 9443,  gdpCap: 13400,  intensity: 5.00, tier: "High",   tierNum: 2, efficiency: 81 },
  { rank: 67, country: "Ukraine",       flag: "\u{1F1FA}\u{1F1E6}", region: "europe",       pop: 37,     twh: 113,   gdpCap: 5660,   intensity: 5.40, tier: "High",   tierNum: 2, efficiency: 79 },
  { rank: 68, country: "Russia",        flag: "\u{1F1F7}\u{1F1FA}", region: "europe",       pop: 144,    twh: 1163,  gdpCap: 14770,  intensity: 5.47, tier: "High",   tierNum: 2, efficiency: 79 },
  { rank: 69, country: "South Africa",  flag: "\u{1F1FF}\u{1F1E6}", region: "africa",       pop: 60,     twh: 218,   gdpCap: 6380,   intensity: 5.70, tier: "High",   tierNum: 2, efficiency: 78 },
  { rank: 70, country: "Vietnam",       flag: "\u{1F1FB}\u{1F1F3}", region: "asia-pacific", pop: 100,    twh: 273,   gdpCap: 4620,   intensity: 5.91, tier: "High",   tierNum: 2, efficiency: 77 },
  { rank: 71, country: "Egypt",         flag: "\u{1F1EA}\u{1F1EC}", region: "middle-east",  pop: 112,    twh: 218,   gdpCap: 3220,   intensity: 6.05, tier: "Medium", tierNum: 3, efficiency: 76 },
  { rank: 72, country: "Kuwait",        flag: "\u{1F1F0}\u{1F1FC}", region: "middle-east",  pop: 4.3,    twh: 85,    gdpCap: 27140,  intensity: 7.29, tier: "Medium", tierNum: 3, efficiency: 72 },
  { rank: 73, country: "Libya",         flag: "\u{1F1F1}\u{1F1FE}", region: "middle-east",  pop: 7,      twh: 36,    gdpCap: 6020,   intensity: 8.55, tier: "Medium", tierNum: 3, efficiency: 68 },
  { rank: 74, country: "Iran",          flag: "\u{1F1EE}\u{1F1F7}", region: "middle-east",  pop: 89,     twh: 357,   gdpCap: 4680,   intensity: 8.58, tier: "Medium", tierNum: 3, efficiency: 68 },
  { rank: 75, country: "Uzbekistan",    flag: "\u{1F1FA}\u{1F1FF}", region: "asia-pacific", pop: 35.8,   twh: 79,    gdpCap: 2560,   intensity: 8.63, tier: "Medium", tierNum: 3, efficiency: 68 }
];

/* Region metadata */
const GPE_REGIONS = {
  "europe":       { name: "Europe",               color: "#3b82f6", countries: 30 },
  "asia-pacific":  { name: "Asia-Pacific",          color: "#ef4444", countries: 16 },
  "americas":      { name: "Americas",              color: "#10b981", countries: 8  },
  "africa":        { name: "Africa",                color: "#f59e0b", countries: 7  },
  "middle-east":   { name: "Middle East & N. Africa", color: "#8b5cf6", countries: 10 }
};

/* Period averages table — intensity reduction by region */
const GPE_PERIOD_AVERAGES = [
  { region: "World", flag: "\u{1F30D}", p1: "0.8%/year", p2: "2.0%/year", p3: "1.2%/year", total: "-27%", driver: "Policy acceleration post-2010" },
  { region: "USA",   flag: "\u{1F1FA}\u{1F1F8}", p1: "1.8%/year", p2: "2.4%/year", p3: "4.0%/year", total: "-47%", driver: "Gas switching, energy crisis" },
  { region: "China", flag: "\u{1F1E8}\u{1F1F3}", p1: "1.5%/year*", p2: "3.8%/year", p3: "0.8%/year", total: "-44%", driver: "Five-Year Plan targets" },
  { region: "EU",    flag: "\u{1F1EA}\u{1F1FA}", p1: "1.1%/year", p2: "1.8%/year", p3: "5.0%/year", total: "-40%", driver: "Energy crisis, REPowerEU" },
  { region: "India", flag: "\u{1F1EE}\u{1F1F3}", p1: "1.5%/year", p2: "2.0%/year", p3: "2.0%/year", total: "-36%", driver: "PAT scheme, economic shift" }
];

/* ===== Chart Datasets ===== */

/* Energy Intensity Historical Trends — Index (2000 = 100) */
const GPE_INTENSITY_LABELS = ['2000','2001','2002','2003','2004','2005','2006','2007','2008','2009','2010','2011','2012','2013','2014','2015','2016','2017','2018','2019','2020','2021','2022','2023','2024'];

const GPE_INTENSITY_DATASETS = [
  /* --- GLOBAL REFERENCE --- */
  {
    label: 'World Average',
    data: [100,99.2,98.5,97.8,97.0,96.2,95.3,94.4,93.5,92.8,92.0,90.2,88.4,86.7,85.0,83.3,81.6,80.0,78.4,76.9,76.3,75.7,74.2,73.3,72.6],
    borderColor: '#94a3b8', backgroundColor: 'rgba(148,163,184,0.08)', fill: true, tension: 0.3, borderWidth: 3, borderDash: [8,4], pointRadius: 0, pointHoverRadius: 4
  },
  /* --- AMERICAS (greens) --- */
  {
    label: 'USA',
    data: [100,98.0,96.5,95.0,93.5,92.0,90.5,88.5,86.5,85.0,83.0,81.0,79.0,77.0,75.0,73.0,71.0,69.0,67.0,65.0,64.0,63.0,57.5,54.0,52.5],
    borderColor: '#10b981', backgroundColor: 'transparent', tension: 0.3, borderWidth: 2.5, pointRadius: 2, pointHoverRadius: 5
  },
  {
    label: 'Brazil',
    data: [100,99.5,99.0,98.0,97.0,96.0,95.0,93.5,92.0,91.0,90.0,88.5,87.0,85.5,84.0,82.5,81.5,80.5,79.5,78.5,78.0,77.0,76.0,75.5,75.0],
    borderColor: '#34d399', backgroundColor: 'transparent', tension: 0.3, borderWidth: 1.5, borderDash: [4,3], pointRadius: 1, pointHoverRadius: 4
  },
  /* --- EUROPE (blues/purples) --- */
  {
    label: 'EU',
    data: [100,98.5,97.5,96.5,95.5,94.5,93.5,92.5,91.5,90.5,89.0,87.5,86.0,84.5,83.0,81.5,80.0,78.5,77.0,75.5,74.0,72.5,66.5,63.0,60.5],
    borderColor: '#3b82f6', backgroundColor: 'transparent', tension: 0.3, borderWidth: 2.5, pointRadius: 2, pointHoverRadius: 5
  },
  {
    label: 'UK',
    data: [100,98.0,96.5,95.5,94.0,93.0,91.5,90.0,88.0,86.5,85.0,82.5,80.0,77.5,75.0,72.5,70.0,68.0,66.0,64.0,62.5,61.0,56.0,53.5,51.0],
    borderColor: '#818cf8', backgroundColor: 'transparent', tension: 0.3, borderWidth: 1.5, borderDash: [4,3], pointRadius: 1, pointHoverRadius: 4
  },
  /* --- ASIA-PACIFIC (reds/oranges/ambers) --- */
  {
    label: 'China',
    data: [100,98.5,100,103.5,107,105,101,97,93,89,85,81.8,78.7,75.7,72.8,70,67.3,64.7,62.2,59.8,58.5,57.5,56.5,56.8,56.2],
    borderColor: '#ef4444', backgroundColor: 'transparent', tension: 0.3, borderWidth: 2.5, pointRadius: 2, pointHoverRadius: 5
  },
  {
    label: 'India',
    data: [100,98.5,97.0,95.5,94.0,92.5,91.0,89.5,88.0,86.5,85.0,83.3,81.6,80.0,78.4,76.8,75.3,73.8,72.3,70.9,69.5,68.2,66.9,65.5,64.2],
    borderColor: '#f97316', backgroundColor: 'transparent', tension: 0.3, borderWidth: 2, pointRadius: 2, pointHoverRadius: 5
  },
  {
    label: 'Japan',
    data: [100,99.0,98.0,97.5,97.0,96.0,95.0,94.0,92.5,91.5,90.5,89.0,87.5,86.0,84.5,83.5,82.5,81.0,79.5,78.0,77.0,76.0,74.5,73.0,72.0],
    borderColor: '#fbbf24', backgroundColor: 'transparent', tension: 0.3, borderWidth: 1.5, borderDash: [4,3], pointRadius: 1, pointHoverRadius: 4
  },
  /* --- AFRICA & MIDDLE EAST (teals/pinks) --- */
  {
    label: 'Africa (avg)',
    data: [100,99.5,99.0,98.5,98.0,97.5,97.0,96.5,96.0,95.5,95.0,94.2,93.5,92.8,92.0,91.5,91.0,90.5,90.0,89.5,89.0,88.5,88.0,87.5,87.0],
    borderColor: '#ec4899', backgroundColor: 'transparent', tension: 0.3, borderWidth: 2, pointRadius: 2, pointHoverRadius: 5
  },
  {
    label: 'Middle East (avg)',
    data: [100,100.5,101,101.5,102,102.5,103,103.5,104,103.5,103,102,101,100,99.5,99.0,98.5,98.0,97.5,97.0,96.5,96.0,95.0,94.5,94.0],
    borderColor: '#a855f7', backgroundColor: 'transparent', tension: 0.3, borderWidth: 1.5, borderDash: [6,4], pointRadius: 1, pointHoverRadius: 4
  }
];

/* Top 10 Consumers (TWh) */
const GPE_CONSUMERS_LABELS = ['China','USA','India','Russia','Japan','Brazil','Canada','S.Korea','Germany','France'];
const GPE_CONSUMERS_DATA   = [9443, 4273, 1957, 1163, 1013, 725, 618, 605, 506, 423];
const GPE_CONSUMERS_COLORS = ['#ef4444','#10b981','#f59e0b','#8b5cf6','#3b82f6','#06b6d4','#ec4899','#14b8a6','#f97316','#6366f1'];

/* Annual Improvement Rate (%) 2001-2024 + COP28 goal */
const GPE_IMPROVEMENT_LABELS = ["'01","'02","'03","'04","'05","'06","'07","'08","'09","'10","'11","'12","'13","'14","'15","'16","'17","'18","'19","'20","'21","'22","'23","'24","COP28"];
const GPE_IMPROVEMENT_DATA   = [1.0,0.8,0.7,0.6,0.9,1.2,1.4,1.5,0.5,0.8,1.8,2.0,2.1,2.4,2.8,2.6,1.7,1.2,2.0,0.5,0.8,2.1,1.0,1.0,4.0];

/* Bubble Chart — Consumption vs Intensity */
const GPE_BUBBLE_DATASETS = [
  { label: 'Knowledge Economy', data: [{x:65,y:0.68,r:7,country:'Switzerland'},{x:58,y:1.09,r:6,country:'Singapore'},{x:35,y:0.65,r:5,country:'Ireland'}], backgroundColor:'rgba(16,185,129,0.6)', borderColor:'#10b981' },
  { label: 'Developed Industrial', data: [{x:4273,y:1.47,r:20,country:'USA'},{x:506,y:1.10,r:11,country:'Germany'},{x:1013,y:2.48,r:13,country:'Japan'},{x:305,y:0.80,r:10,country:'UK'},{x:605,y:3.43,r:9,country:'South Korea'}], backgroundColor:'rgba(59,130,246,0.6)', borderColor:'#3b82f6' },
  { label: 'Emerging Industrial', data: [{x:1957,y:4.94,r:22,country:'India'},{x:725,y:2.96,r:16,country:'Brazil'},{x:1163,y:5.47,r:14,country:'Russia'},{x:351,y:2.41,r:15,country:'Indonesia'}], backgroundColor:'rgba(245,158,11,0.6)', borderColor:'#f59e0b' },
  { label: 'Manufacturing Hub', data: [{x:9443,y:5.00,r:28,country:'China'}], backgroundColor:'rgba(239,68,68,0.6)', borderColor:'#ef4444' }
];

/* Data Center Projections (TWh) */
const GPE_DATACENTER_LABELS = ['2020','2022','2024','2026','2028','2030'];
const GPE_DATACENTER_DATASETS = [
  { label: 'Base Case',   data: [300,380,415,550,720,945],  borderColor: '#8b5cf6', backgroundColor: 'rgba(139,92,246,0.1)', fill: true, tension: 0.4, borderWidth: 2 },
  { label: 'High Growth',  data: [300,380,415,620,920,1250], borderColor: '#ef4444', backgroundColor: 'transparent', borderDash: [5,5], tension: 0.4, borderWidth: 2 }
];

/* ===== Utility Functions ===== */

function gpeFilterByRegion(region) {
  return GPE_DATA.filter(d => d.region === region);
}

function gpeRegionStats(region) {
  const rows = gpeFilterByRegion(region);
  const totalPop = rows.reduce((s, r) => s + r.pop, 0);
  const totalTwh = rows.reduce((s, r) => s + r.twh, 0);
  const avgIntensity = rows.reduce((s, r) => s + r.intensity, 0) / rows.length;
  const eliteCount = rows.filter(r => r.tierNum === 1).length;
  return { count: rows.length, totalPop, totalTwh, avgIntensity: avgIntensity.toFixed(2), eliteCount };
}

function gpeTierClass(tierNum) {
  return ['', 'tier-1', 'tier-2', 'tier-3', 'tier-4'][tierNum] || 'tier-2';
}

function gpeEfficiencyClass(eff) {
  if (eff >= 85) return 'efficiency-high';
  if (eff >= 70) return 'efficiency-mid';
  return 'efficiency-low';
}

function gpeRankClass(rank) {
  if (rank === 1) return 'rank-1';
  if (rank === 2) return 'rank-2';
  if (rank === 3) return 'rank-3';
  return 'rank-default';
}

/** Render the data table into a container element */
function gpeRenderTable(containerId, data) {
  const container = document.getElementById(containerId);
  if (!container) return;
  let html = '<table><thead><tr><th>#</th><th>Country</th><th>Pop(M)</th><th>TWh</th><th>GDP/Cap</th><th>Intensity</th><th>Tier</th><th>Efficiency</th></tr></thead><tbody>';
  data.forEach(d => {
    const highlight = d.rank <= 3 ? ' class="highlight-row"' : '';
    html += `<tr${highlight}>
      <td><span class="rank-badge ${gpeRankClass(d.rank)}">${d.rank}</span></td>
      <td><span class="country-flag">${d.flag}</span>${d.country}</td>
      <td>${d.pop}</td>
      <td>${d.twh.toLocaleString()}</td>
      <td>$${d.gdpCap.toLocaleString()}</td>
      <td>${d.intensity}</td>
      <td><span class="tier-label ${gpeTierClass(d.tierNum)}">${d.tier}</span></td>
      <td><div class="efficiency-bar"><div class="efficiency-fill ${gpeEfficiencyClass(d.efficiency)}" style="width:${d.efficiency}%"></div></div></td>
    </tr>`;
  });
  html += '</tbody></table>';
  container.innerHTML = html;
}
