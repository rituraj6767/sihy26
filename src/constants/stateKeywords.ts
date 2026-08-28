export interface StateGeoInfo {
  state: string;
  aliases: string[];
  center: { latitude: number; longitude: number };
  delta: { latitudeDelta: number; longitudeDelta: number };
  bbox: { minLat: number; maxLat: number; minLng: number; maxLng: number };
}

export const INDIAN_STATES: StateGeoInfo[] = [
  {
    state: 'Andhra Pradesh',
    aliases: ['andhra', 'ap', 'apsdma', 'visakhapatnam', 'amaravati', 'vijayawada', 'tirupati', 'guntur', 'kurnool', 'nellore', 'rajahmundry', 'kakinada'],
    center: { latitude: 15.9129, longitude: 79.7400 },
    delta: { latitudeDelta: 4.5, longitudeDelta: 4.5 },
    bbox: { minLat: 12.6, maxLat: 19.1, minLng: 76.7, maxLng: 84.7 },
  },
  {
    state: 'Arunachal Pradesh',
    aliases: ['arunachal', 'itanagar', 'tawang', 'pasighat', 'ziro'],
    center: { latitude: 28.2180, longitude: 94.7278 },
    delta: { latitudeDelta: 3.5, longitudeDelta: 3.5 },
    bbox: { minLat: 26.6, maxLat: 29.5, minLng: 91.5, maxLng: 97.4 },
  },
  {
    state: 'Assam',
    aliases: ['assam', 'asdma', 'guwahati', 'dispur', 'barpeta', 'jorhat', 'silchar', 'dibrugarh', 'nagaon', 'tezpur', 'beki', 'brahmaputra', 'cachar', 'kamrup', 'sonitpur'],
    center: { latitude: 26.2006, longitude: 92.9376 },
    delta: { latitudeDelta: 3.0, longitudeDelta: 3.0 },
    bbox: { minLat: 24.1, maxLat: 28.0, minLng: 89.7, maxLng: 96.0 },
  },
  {
    state: 'Bihar',
    aliases: ['bihar', 'bsdma', 'patna', 'gaya', 'muzaffarpur', 'bhagalpur', 'darbhanga', 'purnia', 'rohtas', 'begusarai', 'katihar', 'motihari', 'kosi', 'bagmati', 'gandak', 'ghaghra', 'supaul', 'munger', 'saharsa', 'khagaria', 'madhepura', 'samastipur', 'arwal', 'aurangabad', 'jahanabad', 'buxar', 'siwan', 'nalanda', 'nawada', 'sheikhpura', 'jamui', 'lakhisarai', 'banka'],
    center: { latitude: 25.0961, longitude: 85.3131 },
    delta: { latitudeDelta: 3.2, longitudeDelta: 3.2 },
    bbox: { minLat: 24.3, maxLat: 27.5, minLng: 83.3, maxLng: 88.3 },
  },
  {
    state: 'Chhattisgarh',
    aliases: ['chhattisgarh', 'raipur', 'bilaspur', 'durg', 'bastar', 'korba', 'jashpur', 'surguja', 'surajpur', 'balrampur', 'dantewada', 'koriya'],
    center: { latitude: 21.2787, longitude: 81.8661 },
    delta: { latitudeDelta: 4.5, longitudeDelta: 4.5 },
    bbox: { minLat: 17.8, maxLat: 24.1, minLng: 80.2, maxLng: 84.4 },
  },
  {
    state: 'Delhi',
    aliases: ['delhi', 'new delhi', 'ncr', 'ddma'],
    center: { latitude: 28.7041, longitude: 77.1025 },
    delta: { latitudeDelta: 0.8, longitudeDelta: 0.8 },
    bbox: { minLat: 28.4, maxLat: 28.9, minLng: 76.8, maxLng: 77.4 },
  },
  {
    state: 'Goa',
    aliases: ['goa', 'panaji', 'margao', 'vasco'],
    center: { latitude: 15.2993, longitude: 74.1240 },
    delta: { latitudeDelta: 1.0, longitudeDelta: 1.0 },
    bbox: { minLat: 14.9, maxLat: 15.8, minLng: 73.6, maxLng: 74.4 },
  },
  {
    state: 'Gujarat',
    aliases: ['gujarat', 'gsdma', 'ahmedabad', 'gandhinagar', 'surat', 'vadodara', 'rajkot', 'bhavnagar', 'jamnagar', 'kutch', 'anand', 'arvalli', 'chhotaudepur', 'dahod', 'kheda', 'mahisagar', 'navsari', 'panchmahal', 'panch mahals', 'dangs', 'valsad', 'amreli', 'sabarkantha'],
    center: { latitude: 22.2587, longitude: 71.1924 },
    delta: { latitudeDelta: 4.5, longitudeDelta: 4.5 },
    bbox: { minLat: 20.1, maxLat: 24.7, minLng: 68.1, maxLng: 74.5 },
  },
  {
    state: 'Haryana',
    aliases: ['haryana', 'chandigarh', 'gurugram', 'gurgaon', 'faridabad', 'panipat', 'ambala', 'hisar', 'karnal', 'rohtak'],
    center: { latitude: 29.0588, longitude: 76.0856 },
    delta: { latitudeDelta: 2.8, longitudeDelta: 2.8 },
    bbox: { minLat: 27.6, maxLat: 30.9, minLng: 74.4, maxLng: 77.6 },
  },
  {
    state: 'Himachal Pradesh',
    aliases: ['himachal', 'hpsdma', 'shimla', 'manali', 'dharamshala', 'kullu', 'mandi', 'solan', 'kangra', 'chamba'],
    center: { latitude: 31.1048, longitude: 77.1734 },
    delta: { latitudeDelta: 2.8, longitudeDelta: 2.8 },
    bbox: { minLat: 30.3, maxLat: 33.3, minLng: 75.5, maxLng: 79.0 },
  },
  {
    state: 'Jharkhand',
    aliases: ['jharkhand', 'jsdma', 'ranchi', 'jamshedpur', 'dhanbad', 'bokaro', 'deoghar', 'hazaribagh', 'giridih', 'dumka', 'godda', 'jamtara', 'simdega', 'khunti', 'gumla', 'latehar', 'lohardaga', 'chatra', 'koderma', 'ramgarh', 'singhbhum', 'saraikela', 'sahibganj'],
    center: { latitude: 23.6102, longitude: 85.2799 },
    delta: { latitudeDelta: 3.2, longitudeDelta: 3.2 },
    bbox: { minLat: 21.9, maxLat: 25.3, minLng: 83.3, maxLng: 87.9 },
  },
  {
    state: 'Karnataka',
    aliases: ['karnataka', 'ksdma', 'bengaluru', 'bangalore', 'mysuru', 'mysore', 'mangalore', 'hubli', 'belgaum', 'udupi', 'bellary', 'shimoga'],
    center: { latitude: 15.3173, longitude: 75.7139 },
    delta: { latitudeDelta: 4.8, longitudeDelta: 4.8 },
    bbox: { minLat: 11.5, maxLat: 18.5, minLng: 74.0, maxLng: 78.6 },
  },
  {
    state: 'Kerala',
    aliases: ['kerala', 'ksdma', 'thiruvananthapuram', 'kochi', 'ernakulam', 'kozhikode', 'idukki', 'kottayam', 'pathanamthitta', 'palakkad', 'thrissur', 'kannur', 'kasaragod', 'alappuzha', 'kollam', 'wayanad', 'malappuram'],
    center: { latitude: 10.8505, longitude: 76.2711 },
    delta: { latitudeDelta: 3.5, longitudeDelta: 3.5 },
    bbox: { minLat: 8.2, maxLat: 12.8, minLng: 74.8, maxLng: 77.4 },
  },
  {
    state: 'Madhya Pradesh',
    aliases: ['madhya pradesh', 'mp', 'mpsdma', 'bhopal', 'indore', 'gwalior', 'jabalpur', 'ujjain', 'sagar', 'rewa', 'satna', 'sheopur', 'morena', 'bhind', 'datia', 'shivpuri', 'guna', 'ashoknagar', 'chhatarpur', 'tikamgarh', 'niwari', 'orchha', 'mandsaur', 'neemuch', 'damoh', 'panna', 'raisen', 'seoni', 'maihar', 'agar malwa'],
    center: { latitude: 22.9734, longitude: 78.6569 },
    delta: { latitudeDelta: 5.0, longitudeDelta: 5.0 },
    bbox: { minLat: 21.1, maxLat: 26.9, minLng: 74.0, maxLng: 82.8 },
  },
  {
    state: 'Maharashtra',
    aliases: ['maharashtra', 'msdma', 'mumbai', 'pune', 'nagpur', 'nashik', 'thane', 'aurangabad', 'solapur', 'kolhapur', 'amravati', 'nanded'],
    center: { latitude: 19.7515, longitude: 75.7139 },
    delta: { latitudeDelta: 5.2, longitudeDelta: 5.2 },
    bbox: { minLat: 15.6, maxLat: 22.0, minLng: 72.6, maxLng: 80.9 },
  },
  {
    state: 'Manipur',
    aliases: ['manipur', 'imphal', 'churachandpur', 'senapati', 'ukhrul'],
    center: { latitude: 24.6637, longitude: 93.9063 },
    delta: { latitudeDelta: 2.0, longitudeDelta: 2.0 },
    bbox: { minLat: 23.8, maxLat: 25.7, minLng: 93.0, maxLng: 94.8 },
  },
  {
    state: 'Meghalaya',
    aliases: ['meghalaya', 'shillong', 'cherrapunji', 'tura', 'jowai', 'jaintia hills'],
    center: { latitude: 25.4670, longitude: 91.3662 },
    delta: { latitudeDelta: 2.0, longitudeDelta: 2.0 },
    bbox: { minLat: 25.0, maxLat: 26.1, minLng: 89.8, maxLng: 92.8 },
  },
  {
    state: 'Mizoram',
    aliases: ['mizoram', 'aizawl', 'lunglei', 'champhai'],
    center: { latitude: 23.1645, longitude: 92.9376 },
    delta: { latitudeDelta: 2.0, longitudeDelta: 2.0 },
    bbox: { minLat: 21.9, maxLat: 24.5, minLng: 92.2, maxLng: 93.4 },
  },
  {
    state: 'Nagaland',
    aliases: ['nagaland', 'nsdma', 'kohima', 'dimapur', 'mokokchung'],
    center: { latitude: 26.1584, longitude: 94.5624 },
    delta: { latitudeDelta: 2.0, longitudeDelta: 2.0 },
    bbox: { minLat: 25.2, maxLat: 27.0, minLng: 93.3, maxLng: 95.2 },
  },
  {
    state: 'Odisha',
    aliases: ['odisha', 'orissa', 'osdma', 'bhubaneswar', 'cuttack', 'puri', 'rourkela', 'sambalpur', 'balasore', 'berhampur', 'naraj', 'mahanadi', 'jalaka', 'mathani'],
    center: { latitude: 20.9517, longitude: 85.0985 },
    delta: { latitudeDelta: 4.0, longitudeDelta: 4.0 },
    bbox: { minLat: 17.8, maxLat: 22.6, minLng: 81.4, maxLng: 87.5 },
  },
  {
    state: 'Punjab',
    aliases: ['punjab', 'amritsar', 'ludhiana', 'jalandhar', 'patiala', 'bathinda', 'mohali'],
    center: { latitude: 31.1471, longitude: 75.3412 },
    delta: { latitudeDelta: 2.8, longitudeDelta: 2.8 },
    bbox: { minLat: 29.5, maxLat: 32.5, minLng: 73.8, maxLng: 76.9 },
  },
  {
    state: 'Rajasthan',
    aliases: ['rajasthan', 'jaipur', 'jodhpur', 'udaipur', 'kota', 'bikaner', 'ajmer', 'alwar', 'banswara', 'baran', 'bharatpur', 'bundi', 'chittorgarh', 'churu', 'dausa', 'dholpur', 'jhalawar', 'jhunjhunu', 'karauli', 'nagaur', 'pratapgarh', 'salumbar', 'sawai madhopur', 'sikar', 'tonk', 'deeg', 'khairthal'],
    center: { latitude: 27.0238, longitude: 74.2179 },
    delta: { latitudeDelta: 5.5, longitudeDelta: 5.5 },
    bbox: { minLat: 23.0, maxLat: 30.2, minLng: 69.5, maxLng: 78.3 },
  },
  {
    state: 'Sikkim',
    aliases: ['sikkim', 'gangtok', 'namchi', 'mangan'],
    center: { latitude: 27.5330, longitude: 88.5122 },
    delta: { latitudeDelta: 1.2, longitudeDelta: 1.2 },
    bbox: { minLat: 27.0, maxLat: 28.1, minLng: 88.0, maxLng: 88.9 },
  },
  {
    state: 'Tamil Nadu',
    aliases: ['tamil nadu', 'tn', 'tnsdma', 'chennai', 'coimbatore', 'madurai', 'trichy', 'salem', 'tirunelveli', 'chengalpattu', 'kancheepuram', 'thiruvallur', 'ariyalur', 'cuddalore', 'dindigul', 'karur', 'mayiladuthurai', 'nagapattinam', 'namakkal', 'perambalur', 'pudukkottai', 'ramanathapuram', 'ranipet', 'sivaganga', 'thanjavur', 'thiruvarur', 'tiruchirappalli', 'viluppuram', 'pondicherry', 'karaikal'],
    center: { latitude: 11.1271, longitude: 78.6569 },
    delta: { latitudeDelta: 4.5, longitudeDelta: 4.5 },
    bbox: { minLat: 8.1, maxLat: 13.6, minLng: 76.2, maxLng: 80.3 },
  },
  {
    state: 'Telangana',
    aliases: ['telangana', 'tg', 'tgiccc', 'hyderabad', 'warangal', 'nizamabad', 'karimnagar', 'khammam', 'medak', 'siddipet', 'nirmal', 'mulugu'],
    center: { latitude: 18.1124, longitude: 79.0193 },
    delta: { latitudeDelta: 3.5, longitudeDelta: 3.5 },
    bbox: { minLat: 15.8, maxLat: 19.9, minLng: 77.2, maxLng: 81.8 },
  },
  {
    state: 'Tripura',
    aliases: ['tripura', 'agartala', 'udaipur', 'dharmanagar'],
    center: { latitude: 23.9408, longitude: 91.9882 },
    delta: { latitudeDelta: 1.8, longitudeDelta: 1.8 },
    bbox: { minLat: 22.9, maxLat: 24.5, minLng: 91.1, maxLng: 92.3 },
  },
  {
    state: 'Uttar Pradesh',
    aliases: ['uttar pradesh', 'up', 'upsdma', 'lucknow', 'kanpur', 'varanasi', 'agra', 'prayagraj', 'allahabad', 'noida', 'ghaziabad', 'meerut', 'bareilly', 'aligarh', 'moradabad', 'badaun', 'banda', 'etawah', 'etawarah', 'auraiya', 'hamirpur', 'jalaun', 'jhansi', 'lalitpur', 'mahoba', 'etaw', 'kasganj', 'lakhimpur', 'mainpuri', 'pilibhit', 'sambhal', 'shahjahanpur'],
    center: { latitude: 26.8467, longitude: 80.9462 },
    delta: { latitudeDelta: 5.0, longitudeDelta: 5.0 },
    bbox: { minLat: 23.9, maxLat: 30.4, minLng: 77.1, maxLng: 84.6 },
  },
  {
    state: 'Uttarakhand',
    aliases: ['uttarakhand', 'uk', 'usdma', 'dehradun', 'haridwar', 'rishikesh', 'nainital', 'champawat', 'pauri', 'garhwal', 'pithoragarh', 'udham singh nagar', 'chamoli', 'rudraprayag', 'uttarkashi'],
    center: { latitude: 30.0668, longitude: 79.0193 },
    delta: { latitudeDelta: 2.8, longitudeDelta: 2.8 },
    bbox: { minLat: 28.7, maxLat: 31.5, minLng: 77.6, maxLng: 81.1 },
  },
  {
    state: 'West Bengal',
    aliases: ['west bengal', 'bengal', 'wbsdma', 'kolkata', 'howrah', 'hooghly', 'darjeeling', 'siliguri', 'asansol', 'durgapur', 'murshidabad', 'farakka', 'burdwan', 'birbhum', 'bankura', 'ganga', 'malda', 'jalpaiguri'],
    center: { latitude: 22.9868, longitude: 87.8550 },
    delta: { latitudeDelta: 4.2, longitudeDelta: 4.2 },
    bbox: { minLat: 21.5, maxLat: 27.2, minLng: 85.8, maxLng: 89.9 },
  },
  {
    state: 'Jammu & Kashmir',
    aliases: ['jammu', 'kashmir', 'srinagar', 'anantnag', 'baramulla', 'jk'],
    center: { latitude: 33.7782, longitude: 76.5762 },
    delta: { latitudeDelta: 3.5, longitudeDelta: 3.5 },
    bbox: { minLat: 32.2, maxLat: 35.5, minLng: 73.8, maxLng: 79.5 },
  },
  {
    state: 'Ladakh',
    aliases: ['ladakh', 'leh', 'kargil'],
    center: { latitude: 34.1526, longitude: 77.5771 },
    delta: { latitudeDelta: 3.5, longitudeDelta: 3.5 },
    bbox: { minLat: 32.5, maxLat: 36.0, minLng: 75.5, maxLng: 80.5 },
  },
];

export function getStateGeoInfo(stateName: string): StateGeoInfo {
  const norm = (stateName || '').toLowerCase().trim();
  const matched = INDIAN_STATES.find(s => 
    s.state.toLowerCase() === norm || 
    s.aliases.some(alias => norm.includes(alias) || alias.includes(norm))
  );
  if (matched) return matched;

  // Default fallback (Central India)
  return {
    state: stateName || 'India',
    aliases: [norm],
    center: { latitude: 20.5937, longitude: 78.9629 },
    delta: { latitudeDelta: 8.0, longitudeDelta: 8.0 },
    bbox: { minLat: 8.0, maxLat: 35.0, minLng: 68.0, maxLng: 97.0 },
  };
}

export function isAlertForState(alertText: string, stateName: string): boolean {
  if (!stateName || stateName.toLowerCase() === 'all' || stateName.toLowerCase() === 'all india') {
    return true;
  }
  const geo = getStateGeoInfo(stateName);
  const text = (alertText || '').toLowerCase();
  
  // Check exact state name first
  if (text.includes(geo.state.toLowerCase())) return true;

  // Check aliases (cities, rivers, SDMA abbreviations, etc.)
  for (const alias of geo.aliases) {
    if (alias.length < 3) {
      // short acronyms: look for word boundaries
      const regex = new RegExp(`\\b${alias}\\b`, 'i');
      if (regex.test(text)) return true;
    } else if (text.includes(alias)) {
      return true;
    }
  }
  return false;
}
