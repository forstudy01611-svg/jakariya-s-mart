// Bangladesh Administrative Divisions, Districts, and Upazilas/Thanas
export interface DivisionData {
  id: string;
  name: string;
  districts: string[];
}

export const BD_DIVISIONS: string[] = [
  'Dhaka',
  'Chattogram',
  'Rajshahi',
  'Khulna',
  'Barishal',
  'Sylhet',
  'Rangpur',
  'Mymensingh',
];

export const BD_DISTRICTS_BY_DIVISION: Record<string, string[]> = {
  Dhaka: [
    'Dhaka',
    'Gazipur',
    'Narayanganj',
    'Tangail',
    'Kishoreganj',
    'Manikganj',
    'Munshiganj',
    'Narsingdi',
    'Faridpur',
    'Gopalganj',
    'Madaripur',
    'Rajbari',
    'Shariatpur',
  ],
  Chattogram: [
    'Chattogram',
    'Cox\'s Bazar',
    'Cumilla',
    'Feni',
    'Brahmanbaria',
    'Noakhali',
    'Chandpur',
    'Lakshmipur',
    'Rangamati',
    'Bandarban',
    'Khagrachhari',
  ],
  Rajshahi: [
    'Rajshahi',
    'Bogura',
    'Pabna',
    'Sirajganj',
    'Naogaon',
    'Natore',
    'Chapainawabganj',
    'Joypurhat',
  ],
  Khulna: [
    'Khulna',
    'Jashore',
    'Kushtia',
    'Jhenaidah',
    'Satkhira',
    'Bagerhat',
    'Chuadanga',
    'Meherpur',
    'Narail',
    'Magura',
  ],
  Barishal: [
    'Barishal',
    'Patuakhali',
    'Bhola',
    'Pirojpur',
    'Barguna',
    'Jhalokathi',
  ],
  Sylhet: [
    'Sylhet',
    'Moulvibazar',
    'Habiganj',
    'Sunamganj',
  ],
  Rangpur: [
    'Rangpur',
    'Dinajpur',
    'Gaibandha',
    'Kurigram',
    'Lalmonirhat',
    'Nilphamari',
    'Panchagarh',
    'Thakurgaon',
  ],
  Mymensingh: [
    'Mymensingh',
    'Jamalpur',
    'Netrokona',
    'Sherpur',
  ],
};

// Comprehensive mapping of major Upazilas / Thanas for Bangladesh districts
export const BD_UPAZILAS_BY_DISTRICT: Record<string, string[]> = {
  // Dhaka Division
  Dhaka: [
    'Dhanmondi',
    'Gulshan',
    'Banani',
    'Mirpur',
    'Uttara',
    'Mohammadpur',
    'Badda',
    'Tejgaon',
    'Motijheel',
    'Khilgaon',
    'Ramna',
    'Shahbagh',
    'Lalbagh',
    'Paltan',
    'New Market',
    'Cantonment',
    'Jatrabari',
    'Demra',
    'Hazaribagh',
    'Kamrangirchar',
    'Kafrul',
    'Pallabi',
    'Rampura',
    'Savar',
    'Keraniganj',
    'Dhamrai',
    'Dohar',
    'Nawabganj',
  ],
  Gazipur: ['Gazipur Sadar', 'Tongi', 'Kaliakair', 'Kapasia', 'Sreepur', 'Kaliganj'],
  Narayanganj: ['Narayanganj Sadar', 'Fatullah', 'Siddhirganj', 'Bandar', 'Sonargaon', 'Rupganj', 'Araihazar'],
  Tangail: ['Tangail Sadar', 'Mirzapur', 'Gopalpur', 'Ghatail', 'Madhupur', 'Nagarpur', 'Sakhipur', 'Kalihati', 'Basail', 'Delduar', 'Bhuapur', 'Dhanbari'],
  Kishoreganj: ['Kishoreganj Sadar', 'Bhairab', 'Bajitpur', 'Katiadi', 'Kuliarchar', 'Pakundia', 'Karimganj', 'Itna', 'Tarail', 'Hossainpur', 'Mithamain', 'Nikli', 'Ashtagram'],
  Manikganj: ['Manikganj Sadar', 'Singair', 'Saturia', 'Ghior', 'Shibalaya', 'Harirampur', 'Daulatpur'],
  Munshiganj: ['Munshiganj Sadar', 'Sreenagar', 'Sirajdikhan', 'Tongibari', 'Louhajang', 'Gazaria'],
  Narsingdi: ['Narsingdi Sadar', 'Palash', 'Shibpur', 'Raipura', 'Monohardi', 'Belabo'],
  Faridpur: ['Faridpur Sadar', 'Boalmari', 'Bhanga', 'Madhukhali', 'Nagarkanda', 'Sadarpur', 'Saltha', 'Charbhadrasan', 'Alfadanga'],
  Gopalganj: ['Gopalganj Sadar', 'Kashiani', 'Kotalipara', 'Muksudpur', 'Tungipara'],
  Madaripur: ['Madaripur Sadar', 'Shibchar', 'Kalkini', 'Rajoir'],
  Rajbari: ['Rajbari Sadar', 'Goalanda', 'Pangsha', 'Baliakandi', 'Kalukhali'],
  Shariatpur: ['Shariatpur Sadar', 'Naria', 'Zajira', 'Damudya', 'Bhedarganj', 'Gosairhat'],

  // Chattogram Division
  Chattogram: [
    'Kotwali',
    'Panchlaish',
    'Pahartali',
    'Halishahar',
    'Double Mooring',
    'Khulshi',
    'Patenga',
    'Bayazid',
    'Chandgaon',
    'Bakalia',
    'Hathazari',
    'Sitakunda',
    'Mirsharai',
    'Patiya',
    'Boalkhali',
    'Anwara',
    'Raozan',
    'Rangunia',
    'Sandwip',
    'Lohagara',
    'Satkania',
    'Banshkhali',
    'Fatikchhari',
    'Karnaphuli',
  ],
  'Cox\'s Bazar': ['Cox\'s Bazar Sadar', 'Chakaria', 'Maheshkhali', 'Teknaf', 'Ramu', 'Ukhiya', 'Pekua', 'Kutubdia'],
  Cumilla: ['Cumilla Sadar', 'Debidwar', 'Chandina', 'Barura', 'Daudkandi', 'Laksham', 'Muradnagar', 'Homna', 'Burichang', 'Brahmanpara', 'Chauddagram', 'Meghna', 'Monohargonj', 'Nangalkot', 'Titas'],
  Feni: ['Feni Sadar', 'Daganbhuiyan', 'Chhagalnaiya', 'Parshuram', 'Fulgazi', 'Sonagazi'],
  Brahmanbaria: ['Brahmanbaria Sadar', 'Ashuganj', 'Sarail', 'Nasirnagar', 'Nabinagar', 'Bancharampur', 'Kasba', 'Akhaura', 'Bijoynagar'],
  Noakhali: ['Noakhali Sadar (Sudharam)', 'Begumganj', 'Chatkhil', 'Companiganj', 'Hatiya', 'Senbagh', 'Subarnachar', 'Kabirhat', 'Sonaimuri'],
  Chandpur: ['Chandpur Sadar', 'Faridganj', 'Hajiganj', 'Haimchar', 'Kachua', 'Matlab Dakshin', 'Matlab Uttar', 'Shahrasti'],
  Lakshmipur: ['Lakshmipur Sadar', 'Raipur', 'Ramganj', 'Ramgati', 'Kamalnagar'],
  Rangamati: ['Rangamati Sadar', 'Kaptai', 'Kawkhali', 'Baghaichhari', 'Barkal', 'Langadu', 'Rajasthali', 'Belaichhari', 'Juraichhari', 'Naniarchar'],
  Bandarban: ['Bandarban Sadar', 'Ruma', 'Thanchi', 'Lama', 'Rowangchhari', 'Ali Kadam', 'Naikhongchhari'],
  Khagrachhari: ['Khagrachhari Sadar', 'Dighinala', 'Panchhari', 'Mahalchhari', 'Matiranga', 'Manikchhari', 'Ramgarh', 'Guimara', 'Lakshmichhari'],

  // Rajshahi Division
  Rajshahi: ['Boalia', 'Rajpara', 'Motihar', 'Shah Makhdum', 'Paba', 'Durgapur', 'Bagmara', 'Charghat', 'Puthia', 'Tanore', 'Mohanpur', 'Godagari', 'Bagha'],
  Bogura: ['Bogura Sadar', 'Shajahanpur', 'Shibganj', 'Sherpur', 'Dhunat', 'Gabtali', 'Kahaloo', 'Nandigram', 'Sariakandi', 'Sonatala', 'Adamdighi', 'Dupchanchia'],
  Pabna: ['Pabna Sadar', 'Ishwardi', 'Sujanagar', 'Santhia', 'Chatmohar', 'Bera', 'Bhangura', 'Faridpur', 'Atgharia'],
  Sirajganj: ['Sirajganj Sadar', 'Belkuchi', 'Chauhali', 'Kamarkhanda', 'Kazipur', 'Raiganj', 'Shahjadpur', 'Tarash', 'Ullapara'],
  Naogaon: ['Naogaon Sadar', 'Mohadevpur', 'Patnitala', 'Dhamoirhat', 'Manda', 'Niamatpur', 'Raninagar', 'Atrai', 'Badalgachhi', 'Porsha', 'Sapahar'],
  Natore: ['Natore Sadar', 'Singra', 'Baraigram', 'Bagatipara', 'Lalpur', 'Gurudaspur', 'Naldanga'],
  Chapainawabganj: ['Chapainawabganj Sadar', 'Shibganj', 'Gomastapur', 'Nachole', 'Bholahat'],
  Joypurhat: ['Joypurhat Sadar', 'Panchbibi', 'Kalai', 'Khetlal', 'Akkelpur'],

  // Khulna Division
  Khulna: ['Khulna Sadar', 'Sonadanga', 'Khalishpur', 'Daulatpur', 'Khan Jahan Ali', 'Dumuria', 'Rupsha', 'Batiaghata', 'Dighalia', 'Phultala', 'Paikgachha', 'Terokhada', 'Dacope', 'Koyra'],
  Jashore: ['Jashore Sadar', 'Jhikargachha', 'Sharsha', 'Manirampur', 'Abhaynagar', 'Bagherpara', 'Chaugachha', 'Keshabpur'],
  Kushtia: ['Kushtia Sadar', 'Kumarkhali', 'Khoksa', 'Mirpur', 'Bheramara', 'Daulatpur'],
  Jhenaidah: ['Jhenaidah Sadar', 'Kaliganj', 'Kotchandpur', 'Maheshpur', 'Shailkupa', 'Harinakunda'],
  Satkhira: ['Satkhira Sadar', 'Assasuni', 'Debhata', 'Kalaroa', 'Kaliganj', 'Shyamnagar', 'Tala'],
  Bagerhat: ['Bagerhat Sadar', 'Mongla', 'Fakirhat', 'Kachua', 'Mollahat', 'Chitalmari', 'Morrelganj', 'Rampal', 'Sarankhola'],
  Chuadanga: ['Chuadanga Sadar', 'Alamdanga', 'Damurhuda', 'Jibannagar'],
  Meherpur: ['Meherpur Sadar', 'Gangni', 'Mujibnagar'],
  Narail: ['Narail Sadar', 'Kalia', 'Lohagara'],
  Magura: ['Magura Sadar', 'Sreepur', 'Mohammadpur', 'Shalikha'],

  // Barishal Division
  Barishal: ['Barishal Sadar', 'Babuganj', 'Bakerganj', 'Banaripara', 'Gaurnadi', 'Hizla', 'Mehendiganj', 'Muladi', 'Wazirpur', 'Agailjhara'],
  Patuakhali: ['Patuakhali Sadar', 'Bauphal', 'Galachipa', 'Dashmina', 'Kalapara', 'Mirzaganj', 'Dumki', 'Rangabali'],
  Bhola: ['Bhola Sadar', 'Burhanuddin', 'Char Fasson', 'Daulatkhan', 'Lalmohan', 'Manpura', 'Tazumuddin'],
  Pirojpur: ['Pirojpur Sadar', 'Bhandaria', 'Mathbaria', 'Kawkhali', 'Nazirpur', 'Nesarabad (Swarupkati)', 'Indurkani'],
  Barguna: ['Barguna Sadar', 'Amtali', 'Bamna', 'Betagi', 'Patharghata', 'Taltali'],
  Jhalokathi: ['Jhalokathi Sadar', 'Kathalia', 'Nalchity', 'Rajapur'],

  // Sylhet Division
  Sylhet: ['Sylhet Sadar', 'Kotwali', 'South Surma', 'Beanibazar', 'Golapganj', 'Balaganj', 'Fenchuganj', 'Bishwanath', 'Gowainghat', 'Jaintiapur', 'Kanaighat', 'Zakiganj', 'Companiganj', 'Osmani Nagar'],
  Moulvibazar: ['Moulvibazar Sadar', 'Sreemangal', 'Kamalganj', 'Kulaura', 'Rajnagar', 'Barlekha', 'Juri'],
  Habiganj: ['Habiganj Sadar', 'Bahubal', 'Madhabpur', 'Chunarughat', 'Nabiganj', 'Baniachong', 'Ajmiriganj', 'Lakhai', 'Shayestaganj'],
  Sunamganj: ['Sunamganj Sadar', 'Chhatak', 'Jagannathpur', 'Derai', 'Dharampasha', 'Tahirpur', 'Bishwamvarpur', 'Jamalganj', 'Shantiganj', 'Dowarabazar', 'Madhyanagar'],

  // Rangpur Division
  Rangpur: ['Rangpur Sadar', 'Kotwali', 'Badarganj', 'Gangachhara', 'Kaunia', 'Mithapukur', 'Pirgachha', 'Pirganj', 'Taraganj'],
  Dinajpur: ['Dinajpur Sadar', 'Birganj', 'Biral', 'Bochaganj', 'Chirirbandar', 'Fulbari', 'Ghoraghat', 'Hakimpur', 'Kaharole', 'Khansama', 'Nawabganj', 'Parbatipur'],
  Gaibandha: ['Gaibandha Sadar', 'Gobindaganj', 'Palashbari', 'Sadullapur', 'Saghata', 'Sundarganj', 'Phulchhari'],
  Kurigram: ['Kurigram Sadar', 'Nageshwari', 'Bhurungamari', 'Phulbari', 'Rajarhat', 'Ulipur', 'Chilmari', 'Rowmari', 'Char Rajibpur'],
  Lalmonirhat: ['Lalmonirhat Sadar', 'Aditmari', 'Kaliganj', 'Hatibandha', 'Patgram'],
  Nilphamari: ['Nilphamari Sadar', 'Saidpur', 'Domar', 'Dimla', 'Jaldhaka', 'Kishoreganj'],
  Panchagarh: ['Panchagarh Sadar', 'Boda', 'Debiganj', 'Atwari', 'Tetulia'],
  Thakurgaon: ['Thakurgaon Sadar', 'Pirganj', 'Ranisankail', 'Baliadangi', 'Haripur'],

  // Mymensingh Division
  Mymensingh: ['Mymensingh Sadar', 'Kotwali', 'Bhaluka', 'Trishal', 'Muktagachha', 'Gaffargaon', 'Ishwarganj', 'Haluaghat', 'Phulpur', 'Dhobaura', 'Nandail', 'Tara Khanda'],
  Jamalpur: ['Jamalpur Sadar', 'Dewanganj', 'Islampur', 'Madarganj', 'Melandaha', 'Sarishabari', 'Bakshiganj'],
  Netrokona: ['Netrokona Sadar', 'Kendua', 'Durgapur', 'Mohanganj', 'Barhatta', 'Kalmakanda', 'Madan', 'Atpara', 'Khaliajuri', 'Purbadhala'],
  Sherpur: ['Sherpur Sadar', 'Nalitabari', 'Nakla', 'Sreebardi', 'Jhenaigati'],
};

/**
 * Format any number into natural Bangladeshi Taka representation.
 * Examples: 1250 -> "৳1,250", 2499 -> "৳2,499"
 */
export const formatBDT = (amount: number | string | undefined | null): string => {
  if (amount === undefined || amount === null || amount === '') return '৳0';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '৳0';
  return `৳${Math.round(num).toLocaleString('en-IN')}`;
};

/**
 * Validate Bangladeshi Mobile Number
 * Valid prefixes: 013, 014, 015, 016, 017, 018, 019
 * Format: 11 digits (e.g. 01712345678) or with country code (+8801712345678)
 */
export const isValidBdPhone = (phone: string): boolean => {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  // Matches: 01[3-9]XXXXXXXX (11 digits) or +8801[3-9]XXXXXXXX or 8801[3-9]XXXXXXXX
  const bdPhoneRegex = /^(?:\+?880|0)?1[3-9]\d{8}$/;
  return bdPhoneRegex.test(cleaned);
};

/**
 * Normalize and format phone number for Bangladesh display (+880 1XXX-XXXXXX)
 */
export const formatBdPhone = (phone: string): string => {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  // If starts with 8801...
  if (digits.startsWith('880') && digits.length === 13) {
    const local = digits.slice(2);
    return `+880 ${local.slice(1, 5)}-${local.slice(5)}`;
  }
  // If starts with 01... (11 digits)
  if (digits.startsWith('01') && digits.length === 11) {
    return `+880 ${digits.slice(1, 5)}-${digits.slice(5)}`;
  }
  return phone;
};

// Delivery Charge Rules: Inside Dhaka District = ৳80, Outside Dhaka District = ৳120
export const DELIVERY_CHARGE_INSIDE_DHAKA = 80;
export const DELIVERY_CHARGE_OUTSIDE_DHAKA = 120;

export const isDhakaDistrict = (district?: string): boolean => {
  if (!district) return false;
  return district.trim().toLowerCase() === 'dhaka';
};

export const calculateDeliveryCharge = (
  district?: string,
  insideFee?: number,
  outsideFee?: number
): number => {
  const inside = typeof insideFee === 'number' && !isNaN(insideFee) ? insideFee : DELIVERY_CHARGE_INSIDE_DHAKA;
  const outside = typeof outsideFee === 'number' && !isNaN(outsideFee) ? outsideFee : DELIVERY_CHARGE_OUTSIDE_DHAKA;
  return isDhakaDistrict(district) ? inside : outside;
};
