// ================================================
// CARD GAME NUSANTARA - FULL SERVER v2
// main.ts - COMPLETE VERSION WITH ALL FIXES
// ================================================

// Deno global type declaration (for non-Deno IDE/LSP compatibility)
declare const Deno: {
    env: { get(key: string): string | undefined };
    serve(options: { port: number }, handler: (req: Request) => Response | Promise<Response>): void;
    upgradeWebSocket(req: Request): { socket: WebSocket; response: Response };
};

interface Card {
    id: string; name: string; type: string;
    rarity: string; power: number; province: string;
}

interface GamePlayer {
    id: string; name: string; isBot: boolean; socket?: WebSocket;
    hand: Card[]; totalPower: number; hasPlayed: boolean;
    mustDraw: boolean; mustForcePick: boolean; freed: boolean;
    winner: boolean; rank: number; isProcessingAction: boolean;
    afkTimer?: number;
    autoMode: boolean;
    autoModeTimerId?: number;
    disconnectedAt?: number;
    userUid: string;
    leftMatch: boolean;
    statsSaved?: boolean;
}

interface RoundPlay { playerId: string; playerName: string; card: Card | null; power: number; isForcePickPlay?: boolean; }
interface RoundHistory { round: number; plays: RoundPlay[]; }

const ALL_PROVINCES = [
    { name: "Aceh", cards: [
        { name: "Kopi Gayo",                  type: "SDA Unggulan",        rarity: "mythic",      power: 10 },
        { name: "Masjid Raya Baiturrahman",   type: "Bangunan Bersejarah", rarity: "legendary",   power: 9 },
        { name: "Pertanian Kopi",             type: "Sektor Ekonomi",      rarity: "epic",        power: 8 },
        { name: "Rumoh Aceh",                 type: "Rumah Adat",          rarity: "rareplus",    power: 7 },
        { name: "Rencong",                    type: "Senjata Tradisional", rarity: "rarestar",    power: 6 },
        { name: "Ulee Balang",                type: "Pakaian Adat",        rarity: "rare",        power: 5 },
        { name: "Serune Kalee",               type: "Alat Musik",          rarity: "uncommon",    power: 4 },
        { name: "Tari Saman",                 type: "Tarian",              rarity: "uncommonplus",power: 3 },
        { name: "Peusijuek",                  type: "Adat Istiadat",       rarity: "commonplus",  power: 2 },
        { name: "Mie Aceh",                   type: "Makanan Khas",        rarity: "common",      power: 1 },
    ]},
    { name: "Sumatera Utara", cards: [
        { name: "Karet & Kelapa Sawit",       type: "SDA Unggulan",        rarity: "mythic",      power: 10 },
        { name: "Istana Maimun",              type: "Bangunan Bersejarah", rarity: "legendary",   power: 9 },
        { name: "Perkebunan Sawit",           type: "Sektor Ekonomi",      rarity: "epic",        power: 8 },
        { name: "Rumah Bolon",                type: "Rumah Adat",          rarity: "rareplus",    power: 7 },
        { name: "Piso Gaja Dompak",           type: "Senjata Tradisional", rarity: "rarestar",    power: 6 },
        { name: "Ulos",                       type: "Pakaian Adat",        rarity: "rare",        power: 5 },
        { name: "Gondang Sabangunan",         type: "Alat Musik",          rarity: "uncommon",    power: 4 },
        { name: "Tari Tor-Tor",               type: "Tarian",              rarity: "uncommonplus",power: 3 },
        { name: "Mangulosi",                  type: "Adat Istiadat",       rarity: "commonplus",  power: 2 },
        { name: "Bika Ambon",                 type: "Makanan Khas",        rarity: "common",      power: 1 },
    ]},
    { name: "Sumatera Barat", cards: [
        { name: "Gambir & Kulit Manis",       type: "SDA Unggulan",        rarity: "mythic",      power: 10 },
        { name: "Jam Gadang",                 type: "Bangunan Bersejarah", rarity: "legendary",   power: 9 },
        { name: "Perdagangan Rempah",         type: "Sektor Ekonomi",      rarity: "epic",        power: 8 },
        { name: "Rumah Gadang",               type: "Rumah Adat",          rarity: "rareplus",    power: 7 },
        { name: "Karih",                      type: "Senjata Tradisional", rarity: "rarestar",    power: 6 },
        { name: "Bundo Kanduang",             type: "Pakaian Adat",        rarity: "rare",        power: 5 },
        { name: "Saluang",                    type: "Alat Musik",          rarity: "uncommon",    power: 4 },
        { name: "Tari Piring",                type: "Tarian",              rarity: "uncommonplus",power: 3 },
        { name: "Batagak Penghulu",           type: "Adat Istiadat",       rarity: "commonplus",  power: 2 },
        { name: "Rendang",                    type: "Makanan Khas",        rarity: "common",      power: 1 },
    ]},
    { name: "Riau", cards: [
        { name: "Minyak Bumi",                type: "SDA Unggulan",        rarity: "mythic",      power: 10 },
        { name: "Istana Siak",                type: "Bangunan Bersejarah", rarity: "legendary",   power: 9 },
        { name: "Pertambangan Minyak",        type: "Sektor Ekonomi",      rarity: "epic",        power: 8 },
        { name: "Rumah Selaso Jatuh Kembar",  type: "Rumah Adat",          rarity: "rareplus",    power: 7 },
        { name: "Pedang Jenawi",              type: "Senjata Tradisional", rarity: "rarestar",    power: 6 },
        { name: "Teluk Belanga",              type: "Pakaian Adat",        rarity: "rare",        power: 5 },
        { name: "Gambus",                     type: "Alat Musik",          rarity: "uncommon",    power: 4 },
        { name: "Tari Zapin",                 type: "Tarian",              rarity: "uncommonplus",power: 3 },
        { name: "Tepuk Tepung Tawar",         type: "Adat Istiadat",       rarity: "commonplus",  power: 2 },
        { name: "Gulai Belacan",              type: "Makanan Khas",        rarity: "common",      power: 1 },
    ]},
    { name: "Kepulauan Riau", cards: [
        { name: "Bauksit & Timah",            type: "SDA Unggulan",        rarity: "mythic",      power: 10 },
        { name: "Benteng Fort de Kock",       type: "Bangunan Bersejarah", rarity: "legendary",   power: 9 },
        { name: "Perikanan Laut",             type: "Sektor Ekonomi",      rarity: "epic",        power: 8 },
        { name: "Rumah Belah Bubung",         type: "Rumah Adat",          rarity: "rareplus",    power: 7 },
        { name: "Badik Tumbuk Lada",          type: "Senjata Tradisional", rarity: "rarestar",    power: 6 },
        { name: "Kebaya Labuh",               type: "Pakaian Adat",        rarity: "rare",        power: 5 },
        { name: "Gong",                       type: "Alat Musik",          rarity: "uncommon",    power: 4 },
        { name: "Tari Tandak",                type: "Tarian",              rarity: "uncommonplus",power: 3 },
        { name: "Mandi Safar",                type: "Adat Istiadat",       rarity: "commonplus",  power: 2 },
        { name: "Otak-otak",                  type: "Makanan Khas",        rarity: "common",      power: 1 },
    ]},
    { name: "Jambi", cards: [
        { name: "Batubara & Karet",           type: "SDA Unggulan",        rarity: "mythic",      power: 10 },
        { name: "Candi Muaro Jambi",          type: "Bangunan Bersejarah", rarity: "legendary",   power: 9 },
        { name: "Perkebunan Karet",           type: "Sektor Ekonomi",      rarity: "epic",        power: 8 },
        { name: "Rumah Kajang Leko",          type: "Rumah Adat",          rarity: "rareplus",    power: 7 },
        { name: "Keris Siginjai",             type: "Senjata Tradisional", rarity: "rarestar",    power: 6 },
        { name: "Baju Kurung Tanggung",       type: "Pakaian Adat",        rarity: "rare",        power: 5 },
        { name: "Kelintang",                  type: "Alat Musik",          rarity: "uncommon",    power: 4 },
        { name: "Tari Sekapur Sirih",         type: "Tarian",              rarity: "uncommonplus",power: 3 },
        { name: "Betangas",                   type: "Adat Istiadat",       rarity: "commonplus",  power: 2 },
        { name: "Tempoyak",                   type: "Makanan Khas",        rarity: "common",      power: 1 },
    ]},
    { name: "Bengkulu", cards: [
        { name: "Batubara & Emas",            type: "SDA Unggulan",        rarity: "mythic",      power: 10 },
        { name: "Benteng Marlborough",        type: "Bangunan Bersejarah", rarity: "legendary",   power: 9 },
        { name: "Pertambangan Batu Bara",     type: "Sektor Ekonomi",      rarity: "epic",        power: 8 },
        { name: "Rumah Bubungan Lima",        type: "Rumah Adat",          rarity: "rareplus",    power: 7 },
        { name: "Rudus",                      type: "Senjata Tradisional", rarity: "rarestar",    power: 6 },
        { name: "Pakaian Rejang Lebong",      type: "Pakaian Adat",        rarity: "rare",        power: 5 },
        { name: "Dol",                        type: "Alat Musik",          rarity: "uncommon",    power: 4 },
        { name: "Tari Andun",                 type: "Tarian",              rarity: "uncommonplus",power: 3 },
        { name: "Bimbang Adat",               type: "Adat Istiadat",       rarity: "commonplus",  power: 2 },
        { name: "Pendap",                     type: "Makanan Khas",        rarity: "common",      power: 1 },
    ]},
    { name: "Sumatera Selatan", cards: [
        { name: "Minyak & Gas Bumi",          type: "SDA Unggulan",        rarity: "mythic",      power: 10 },
        { name: "Jembatan Ampera",            type: "Bangunan Bersejarah", rarity: "legendary",   power: 9 },
        { name: "Pertambangan Minyak",        type: "Sektor Ekonomi",      rarity: "epic",        power: 8 },
        { name: "Rumah Limas",                type: "Rumah Adat",          rarity: "rareplus",    power: 7 },
        { name: "Tombak Trisula",             type: "Senjata Tradisional", rarity: "rarestar",    power: 6 },
        { name: "Aesan Gede",                 type: "Pakaian Adat",        rarity: "rare",        power: 5 },
        { name: "Accordion Palembang",        type: "Alat Musik",          rarity: "uncommon",    power: 4 },
        { name: "Tari Tanggai",               type: "Tarian",              rarity: "uncommonplus",power: 3 },
        { name: "Nganggung",                  type: "Adat Istiadat",       rarity: "commonplus",  power: 2 },
        { name: "Pempek",                     type: "Makanan Khas",        rarity: "common",      power: 1 },
    ]},
    { name: "Bangka Belitung", cards: [
        { name: "Timah",                      type: "SDA Unggulan",        rarity: "mythic",      power: 10 },
        { name: "Benteng Kuto Panji",         type: "Bangunan Bersejarah", rarity: "legendary",   power: 9 },
        { name: "Pertambangan Timah",         type: "Sektor Ekonomi",      rarity: "epic",        power: 8 },
        { name: "Rumah Rakit",                type: "Rumah Adat",          rarity: "rareplus",    power: 7 },
        { name: "Siwar",                      type: "Senjata Tradisional", rarity: "rarestar",    power: 6 },
        { name: "Pakaian Seting",             type: "Pakaian Adat",        rarity: "rare",        power: 5 },
        { name: "Dambus",                     type: "Alat Musik",          rarity: "uncommon",    power: 4 },
        { name: "Tari Sepen",                 type: "Tarian",              rarity: "uncommonplus",power: 3 },
        { name: "Buang Jong",                 type: "Adat Istiadat",       rarity: "commonplus",  power: 2 },
        { name: "Lempah Kuning",              type: "Makanan Khas",        rarity: "common",      power: 1 },
    ]},
    { name: "Lampung", cards: [
        { name: "Kopi Robusta Lampung",       type: "SDA Unggulan",        rarity: "mythic",      power: 10 },
        { name: "Menara Siger",               type: "Bangunan Bersejarah", rarity: "legendary",   power: 9 },
        { name: "Perkebunan Kopi",            type: "Sektor Ekonomi",      rarity: "epic",        power: 8 },
        { name: "Rumah Nuwou Sesat",          type: "Rumah Adat",          rarity: "rareplus",    power: 7 },
        { name: "Terapang",                   type: "Senjata Tradisional", rarity: "rarestar",    power: 6 },
        { name: "Pakaian Tulang Bawang",      type: "Pakaian Adat",        rarity: "rare",        power: 5 },
        { name: "Gamolan Pekhing",            type: "Alat Musik",          rarity: "uncommon",    power: 4 },
        { name: "Tari Sigeh Penguten",        type: "Tarian",              rarity: "uncommonplus",power: 3 },
        { name: "Cangget",                    type: "Adat Istiadat",       rarity: "commonplus",  power: 2 },
        { name: "Seruit",                     type: "Makanan Khas",        rarity: "common",      power: 1 },
    ]},
    { name: "DKI Jakarta", cards: [
        { name: "Industri & Perdagangan",     type: "SDA Unggulan",        rarity: "mythic",      power: 10 },
        { name: "Kota Tua Jakarta",           type: "Bangunan Bersejarah", rarity: "legendary",   power: 9 },
        { name: "Perdagangan & Jasa",         type: "Sektor Ekonomi",      rarity: "epic",        power: 8 },
        { name: "Rumah Kebaya",               type: "Rumah Adat",          rarity: "rareplus",    power: 7 },
        { name: "Golok",                      type: "Senjata Tradisional", rarity: "rarestar",    power: 6 },
        { name: "Kebaya Encim",               type: "Pakaian Adat",        rarity: "rare",        power: 5 },
        { name: "Tehyan",                     type: "Alat Musik",          rarity: "uncommon",    power: 4 },
        { name: "Tari Yapong",                type: "Tarian",              rarity: "uncommonplus",power: 3 },
        { name: "Palang Pintu",               type: "Adat Istiadat",       rarity: "commonplus",  power: 2 },
        { name: "Kerak Telor",                type: "Makanan Khas",        rarity: "common",      power: 1 },
    ]},
    { name: "Jawa Barat", cards: [
        { name: "Teh & Kina",                 type: "SDA Unggulan",        rarity: "mythic",      power: 10 },
        { name: "Keraton Kasepuhan Cirebon",  type: "Bangunan Bersejarah", rarity: "legendary",   power: 9 },
        { name: "Perkebunan Teh",             type: "Sektor Ekonomi",      rarity: "epic",        power: 8 },
        { name: "Rumah Kasepuhan",            type: "Rumah Adat",          rarity: "rareplus",    power: 7 },
        { name: "Kujang",                     type: "Senjata Tradisional", rarity: "rarestar",    power: 6 },
        { name: "Kebaya Sunda",               type: "Pakaian Adat",        rarity: "rare",        power: 5 },
        { name: "Angklung",                   type: "Alat Musik",          rarity: "uncommon",    power: 4 },
        { name: "Tari Jaipong",               type: "Tarian",              rarity: "uncommonplus",power: 3 },
        { name: "Seren Taun",                 type: "Adat Istiadat",       rarity: "commonplus",  power: 2 },
        { name: "Seblak",                     type: "Makanan Khas",        rarity: "common",      power: 1 },
    ]},
    { name: "Banten", cards: [
        { name: "Baja & Industri",            type: "SDA Unggulan",        rarity: "mythic",      power: 10 },
        { name: "Masjid Agung Banten",        type: "Bangunan Bersejarah", rarity: "legendary",   power: 9 },
        { name: "Industri Baja",              type: "Sektor Ekonomi",      rarity: "epic",        power: 8 },
        { name: "Rumah Baduy",                type: "Rumah Adat",          rarity: "rareplus",    power: 7 },
        { name: "Golok Ciomas",               type: "Senjata Tradisional", rarity: "rarestar",    power: 6 },
        { name: "Pakaian Pangsi",             type: "Pakaian Adat",        rarity: "rare",        power: 5 },
        { name: "Dogdog Lojor",               type: "Alat Musik",          rarity: "uncommon",    power: 4 },
        { name: "Tari Cokek",                 type: "Tarian",              rarity: "uncommonplus",power: 3 },
        { name: "Seba Baduy",                 type: "Adat Istiadat",       rarity: "commonplus",  power: 2 },
        { name: "Sate Bandeng",               type: "Makanan Khas",        rarity: "common",      power: 1 },
    ]},
    { name: "Jawa Tengah", cards: [
        { name: "Batik & Tekstil",            type: "SDA Unggulan",        rarity: "mythic",      power: 10 },
        { name: "Candi Borobudur",            type: "Bangunan Bersejarah", rarity: "legendary",   power: 9 },
        { name: "Industri Tekstil",           type: "Sektor Ekonomi",      rarity: "epic",        power: 8 },
        { name: "Rumah Joglo",                type: "Rumah Adat",          rarity: "rareplus",    power: 7 },
        { name: "Keris",                      type: "Senjata Tradisional", rarity: "rarestar",    power: 6 },
        { name: "Kebaya Jawa",                type: "Pakaian Adat",        rarity: "rare",        power: 5 },
        { name: "Gamelan",                    type: "Alat Musik",          rarity: "uncommon",    power: 4 },
        { name: "Tari Serimpi",               type: "Tarian",              rarity: "uncommonplus",power: 3 },
        { name: "Sekaten",                    type: "Adat Istiadat",       rarity: "commonplus",  power: 2 },
        { name: "Lumpia",                     type: "Makanan Khas",        rarity: "common",      power: 1 },
    ]},
    { name: "DI Yogyakarta", cards: [
        { name: "Batik Yogyakarta",           type: "SDA Unggulan",        rarity: "mythic",      power: 10 },
        { name: "Keraton Yogyakarta",         type: "Bangunan Bersejarah", rarity: "legendary",   power: 9 },
        { name: "Industri Kerajinan",         type: "Sektor Ekonomi",      rarity: "epic",        power: 8 },
        { name: "Bangsal Kencono",            type: "Rumah Adat",          rarity: "rareplus",    power: 7 },
        { name: "Keris Yogyakarta",           type: "Senjata Tradisional", rarity: "rarestar",    power: 6 },
        { name: "Kebaya Kesatrian",           type: "Pakaian Adat",        rarity: "rare",        power: 5 },
        { name: "Gamelan Yogyakarta",         type: "Alat Musik",          rarity: "uncommon",    power: 4 },
        { name: "Tari Kumbang",               type: "Tarian",              rarity: "uncommonplus",power: 3 },
        { name: "Labuhan Merapi",             type: "Adat Istiadat",       rarity: "commonplus",  power: 2 },
        { name: "Gudeg",                      type: "Makanan Khas",        rarity: "common",      power: 1 },
    ]},
    { name: "Jawa Timur", cards: [
        { name: "Garam & Tembakau",           type: "SDA Unggulan",        rarity: "mythic",      power: 10 },
        { name: "Candi Penataran",            type: "Bangunan Bersejarah", rarity: "legendary",   power: 9 },
        { name: "Industri Garam",             type: "Sektor Ekonomi",      rarity: "epic",        power: 8 },
        { name: "Rumah Situbondo",            type: "Rumah Adat",          rarity: "rareplus",    power: 7 },
        { name: "Clurit",                     type: "Senjata Tradisional", rarity: "rarestar",    power: 6 },
        { name: "Pesa'an",                    type: "Pakaian Adat",        rarity: "rare",        power: 5 },
        { name: "Saronen",                    type: "Alat Musik",          rarity: "uncommon",    power: 4 },
        { name: "Tari Remo",                  type: "Tarian",              rarity: "uncommonplus",power: 3 },
        { name: "Karapan Sapi",               type: "Adat Istiadat",       rarity: "commonplus",  power: 2 },
        { name: "Rujak Cingur",               type: "Makanan Khas",        rarity: "common",      power: 1 },
    ]},
    { name: "Bali", cards: [
        { name: "Kopi Kintamani",             type: "SDA Unggulan",        rarity: "mythic",      power: 10 },
        { name: "Pura Besakih",               type: "Bangunan Bersejarah", rarity: "legendary",   power: 9 },
        { name: "Pariwisata Budaya",          type: "Sektor Ekonomi",      rarity: "epic",        power: 8 },
        { name: "Rumah Gapura Candi Bentar",  type: "Rumah Adat",          rarity: "rareplus",    power: 7 },
        { name: "Keris Bali",                 type: "Senjata Tradisional", rarity: "rarestar",    power: 6 },
        { name: "Payas Agung",                type: "Pakaian Adat",        rarity: "rare",        power: 5 },
        { name: "Gamelan Bali",               type: "Alat Musik",          rarity: "uncommon",    power: 4 },
        { name: "Tari Pendet",                type: "Tarian",              rarity: "uncommonplus",power: 3 },
        { name: "Ngaben",                     type: "Adat Istiadat",       rarity: "commonplus",  power: 2 },
        { name: "Ayam Betutu",                type: "Makanan Khas",        rarity: "common",      power: 1 },
    ]},
    { name: "Nusa Tenggara Barat", cards: [
        { name: "Mutiara Lombok",             type: "SDA Unggulan",        rarity: "mythic",      power: 10 },
        { name: "Istana Dalam Loka",          type: "Bangunan Bersejarah", rarity: "legendary",   power: 9 },
        { name: "Budidaya Mutiara",           type: "Sektor Ekonomi",      rarity: "epic",        power: 8 },
        { name: "Rumah Dalam Loka",           type: "Rumah Adat",          rarity: "rareplus",    power: 7 },
        { name: "Keris NTB",                  type: "Senjata Tradisional", rarity: "rarestar",    power: 6 },
        { name: "Lambung",                    type: "Pakaian Adat",        rarity: "rare",        power: 5 },
        { name: "Serunai NTB",                type: "Alat Musik",          rarity: "uncommon",    power: 4 },
        { name: "Tari Gandrung",              type: "Tarian",              rarity: "uncommonplus",power: 3 },
        { name: "Bau Nyale",                  type: "Adat Istiadat",       rarity: "commonplus",  power: 2 },
        { name: "Ayam Taliwang",              type: "Makanan Khas",        rarity: "common",      power: 1 },
    ]},
    { name: "Nusa Tenggara Timur", cards: [
        { name: "Kopi Flores & Cendana",      type: "SDA Unggulan",        rarity: "mythic",      power: 10 },
        { name: "Benteng Portugis Solor",     type: "Bangunan Bersejarah", rarity: "legendary",   power: 9 },
        { name: "Peternakan Sapi",            type: "Sektor Ekonomi",      rarity: "epic",        power: 8 },
        { name: "Rumah Musalaki",             type: "Rumah Adat",          rarity: "rareplus",    power: 7 },
        { name: "Sundu",                      type: "Senjata Tradisional", rarity: "rarestar",    power: 6 },
        { name: "Pakaian Amarasi",            type: "Pakaian Adat",        rarity: "rare",        power: 5 },
        { name: "Sasando",                    type: "Alat Musik",          rarity: "uncommon",    power: 4 },
        { name: "Tari Caci",                  type: "Tarian",              rarity: "uncommonplus",power: 3 },
        { name: "Pati Ka",                    type: "Adat Istiadat",       rarity: "commonplus",  power: 2 },
        { name: "Se'i",                       type: "Makanan Khas",        rarity: "common",      power: 1 },
    ]},
    { name: "Kalimantan Barat", cards: [
        { name: "Bauksit & Emas",             type: "SDA Unggulan",        rarity: "mythic",      power: 10 },
        { name: "Keraton Kadriyah Pontianak", type: "Bangunan Bersejarah", rarity: "legendary",   power: 9 },
        { name: "Pertambangan Bauksit",       type: "Sektor Ekonomi",      rarity: "epic",        power: 8 },
        { name: "Rumah Panjang",              type: "Rumah Adat",          rarity: "rareplus",    power: 7 },
        { name: "Mandau",                     type: "Senjata Tradisional", rarity: "rarestar",    power: 6 },
        { name: "King Baba",                  type: "Pakaian Adat",        rarity: "rare",        power: 5 },
        { name: "Sape",                       type: "Alat Musik",          rarity: "uncommon",    power: 4 },
        { name: "Tari Monong",                type: "Tarian",              rarity: "uncommonplus",power: 3 },
        { name: "Naik Dango",                 type: "Adat Istiadat",       rarity: "commonplus",  power: 2 },
        { name: "Bubur Pedas",                type: "Makanan Khas",        rarity: "common",      power: 1 },
    ]},
    { name: "Kalimantan Tengah", cards: [
        { name: "Rotan & Kayu Ulin",          type: "SDA Unggulan",        rarity: "mythic",      power: 10 },
        { name: "Istana Kuning Sampit",       type: "Bangunan Bersejarah", rarity: "legendary",   power: 9 },
        { name: "Kehutanan & Rotan",          type: "Sektor Ekonomi",      rarity: "epic",        power: 8 },
        { name: "Rumah Betang",               type: "Rumah Adat",          rarity: "rareplus",    power: 7 },
        { name: "Mandau Kalteng",             type: "Senjata Tradisional", rarity: "rarestar",    power: 6 },
        { name: "Sangkarut",                  type: "Pakaian Adat",        rarity: "rare",        power: 5 },
        { name: "Garantung",                  type: "Alat Musik",          rarity: "uncommon",    power: 4 },
        { name: "Tari Giring-giring",         type: "Tarian",              rarity: "uncommonplus",power: 3 },
        { name: "Tiwah",                      type: "Adat Istiadat",       rarity: "commonplus",  power: 2 },
        { name: "Juhu Singkah",               type: "Makanan Khas",        rarity: "common",      power: 1 },
    ]},
    { name: "Kalimantan Selatan", cards: [
        { name: "Intan & Batubara",           type: "SDA Unggulan",        rarity: "mythic",      power: 10 },
        { name: "Masjid Sultan Suriansyah",   type: "Bangunan Bersejarah", rarity: "legendary",   power: 9 },
        { name: "Pertambangan Intan",         type: "Sektor Ekonomi",      rarity: "epic",        power: 8 },
        { name: "Rumah Bubungan Tinggi",      type: "Rumah Adat",          rarity: "rareplus",    power: 7 },
        { name: "Keris Banjar",               type: "Senjata Tradisional", rarity: "rarestar",    power: 6 },
        { name: "Babaju Kun Galung",          type: "Pakaian Adat",        rarity: "rare",        power: 5 },
        { name: "Panting",                    type: "Alat Musik",          rarity: "uncommon",    power: 4 },
        { name: "Tari Baksa Kembang",         type: "Tarian",              rarity: "uncommonplus",power: 3 },
        { name: "Aruh Ganal",                 type: "Adat Istiadat",       rarity: "commonplus",  power: 2 },
        { name: "Soto Banjar",                type: "Makanan Khas",        rarity: "common",      power: 1 },
    ]},
    { name: "Kalimantan Timur", cards: [
        { name: "Minyak & Gas Kaltim",        type: "SDA Unggulan",        rarity: "mythic",      power: 10 },
        { name: "Keraton Kutai Kartanegara",  type: "Bangunan Bersejarah", rarity: "legendary",   power: 9 },
        { name: "Pertambangan Migas",         type: "Sektor Ekonomi",      rarity: "epic",        power: 8 },
        { name: "Rumah Lamin",                type: "Rumah Adat",          rarity: "rareplus",    power: 7 },
        { name: "Mandau Kaltim",              type: "Senjata Tradisional", rarity: "rarestar",    power: 6 },
        { name: "Kustin",                     type: "Pakaian Adat",        rarity: "rare",        power: 5 },
        { name: "Sape Kaltim",                type: "Alat Musik",          rarity: "uncommon",    power: 4 },
        { name: "Tari Gong",                  type: "Tarian",              rarity: "uncommonplus",power: 3 },
        { name: "Erau",                       type: "Adat Istiadat",       rarity: "commonplus",  power: 2 },
        { name: "Nasi Kuning",                type: "Makanan Khas",        rarity: "common",      power: 1 },
    ]},
    { name: "Kalimantan Utara", cards: [
        { name: "Gas Alam & Kelapa Sawit",    type: "SDA Unggulan",        rarity: "mythic",      power: 10 },
        { name: "Benteng Tarakan",            type: "Bangunan Bersejarah", rarity: "legendary",   power: 9 },
        { name: "Perikanan & Kehutanan",      type: "Sektor Ekonomi",      rarity: "epic",        power: 8 },
        { name: "Rumah Baloy",                type: "Rumah Adat",          rarity: "rareplus",    power: 7 },
        { name: "Mandau Kalut",               type: "Senjata Tradisional", rarity: "rarestar",    power: 6 },
        { name: "Ta'a",                       type: "Pakaian Adat",        rarity: "rare",        power: 5 },
        { name: "Sampe",                      type: "Alat Musik",          rarity: "uncommon",    power: 4 },
        { name: "Tari Jepen",                 type: "Tarian",              rarity: "uncommonplus",power: 3 },
        { name: "Iraw Tengkayu",              type: "Adat Istiadat",       rarity: "commonplus",  power: 2 },
        { name: "Kepiting Soka",              type: "Makanan Khas",        rarity: "common",      power: 1 },
    ]},
    { name: "Sulawesi Utara", cards: [
        { name: "Kelapa & Cengkeh",           type: "SDA Unggulan",        rarity: "mythic",      power: 10 },
        { name: "Benteng Moraya",             type: "Bangunan Bersejarah", rarity: "legendary",   power: 9 },
        { name: "Perikanan Laut",             type: "Sektor Ekonomi",      rarity: "epic",        power: 8 },
        { name: "Rumah Walewangko",           type: "Rumah Adat",          rarity: "rareplus",    power: 7 },
        { name: "Keris Sulut",                type: "Senjata Tradisional", rarity: "rarestar",    power: 6 },
        { name: "Laku Tepu",                  type: "Pakaian Adat",        rarity: "rare",        power: 5 },
        { name: "Kolintang",                  type: "Alat Musik",          rarity: "uncommon",    power: 4 },
        { name: "Tari Maengket",              type: "Tarian",              rarity: "uncommonplus",power: 3 },
        { name: "Tulude",                     type: "Adat Istiadat",       rarity: "commonplus",  power: 2 },
        { name: "Bubur Manado",               type: "Makanan Khas",        rarity: "common",      power: 1 },
    ]},
    { name: "Gorontalo", cards: [
        { name: "Jagung & Ikan Tuna",         type: "SDA Unggulan",        rarity: "mythic",      power: 10 },
        { name: "Benteng Otanaha",            type: "Bangunan Bersejarah", rarity: "legendary",   power: 9 },
        { name: "Pertanian Jagung",           type: "Sektor Ekonomi",      rarity: "epic",        power: 8 },
        { name: "Rumah Dulohupa",             type: "Rumah Adat",          rarity: "rareplus",    power: 7 },
        { name: "Wamilo",                     type: "Senjata Tradisional", rarity: "rarestar",    power: 6 },
        { name: "Biliu",                      type: "Pakaian Adat",        rarity: "rare",        power: 5 },
        { name: "Polopalo",                   type: "Alat Musik",          rarity: "uncommon",    power: 4 },
        { name: "Tari Polopalo",              type: "Tarian",              rarity: "uncommonplus",power: 3 },
        { name: "Molonthalo",                 type: "Adat Istiadat",       rarity: "commonplus",  power: 2 },
        { name: "Binte Biluhuta",             type: "Makanan Khas",        rarity: "common",      power: 1 },
    ]},
    { name: "Sulawesi Tengah", cards: [
        { name: "Nikel & Emas Sulteng",       type: "SDA Unggulan",        rarity: "mythic",      power: 10 },
        { name: "Masjid Tua Luwuk",           type: "Bangunan Bersejarah", rarity: "legendary",   power: 9 },
        { name: "Pertambangan Nikel",         type: "Sektor Ekonomi",      rarity: "epic",        power: 8 },
        { name: "Rumah Tambi",                type: "Rumah Adat",          rarity: "rareplus",    power: 7 },
        { name: "Pasatimpo",                  type: "Senjata Tradisional", rarity: "rarestar",    power: 6 },
        { name: "Koje",                       type: "Pakaian Adat",        rarity: "rare",        power: 5 },
        { name: "Ganda",                      type: "Alat Musik",          rarity: "uncommon",    power: 4 },
        { name: "Tari Lumense",               type: "Tarian",              rarity: "uncommonplus",power: 3 },
        { name: "Balia",                      type: "Adat Istiadat",       rarity: "commonplus",  power: 2 },
        { name: "Kaledo",                     type: "Makanan Khas",        rarity: "common",      power: 1 },
    ]},
    { name: "Sulawesi Barat", cards: [
        { name: "Kakao & Kelapa Sulbar",      type: "SDA Unggulan",        rarity: "mythic",      power: 10 },
        { name: "Istana Malaweg",             type: "Bangunan Bersejarah", rarity: "legendary",   power: 9 },
        { name: "Perkebunan Kakao",           type: "Sektor Ekonomi",      rarity: "epic",        power: 8 },
        { name: "Rumah Boyang",               type: "Rumah Adat",          rarity: "rareplus",    power: 7 },
        { name: "Badik Sulbar",               type: "Senjata Tradisional", rarity: "rarestar",    power: 6 },
        { name: "Pattuqduq Towaine",          type: "Pakaian Adat",        rarity: "rare",        power: 5 },
        { name: "Kecapi Sulbar",              type: "Alat Musik",          rarity: "uncommon",    power: 4 },
        { name: "Tari Patuddu",               type: "Tarian",              rarity: "uncommonplus",power: 3 },
        { name: "Sayyang Pattu'du",           type: "Adat Istiadat",       rarity: "commonplus",  power: 2 },
        { name: "Bau Peapi",                  type: "Makanan Khas",        rarity: "common",      power: 1 },
    ]},
    { name: "Sulawesi Selatan", cards: [
        { name: "Nikel & Besi Sulsel",        type: "SDA Unggulan",        rarity: "mythic",      power: 10 },
        { name: "Benteng Rotterdam",          type: "Bangunan Bersejarah", rarity: "legendary",   power: 9 },
        { name: "Pertambangan Nikel",         type: "Sektor Ekonomi",      rarity: "epic",        power: 8 },
        { name: "Rumah Tongkonan",            type: "Rumah Adat",          rarity: "rareplus",    power: 7 },
        { name: "Badik",                      type: "Senjata Tradisional", rarity: "rarestar",    power: 6 },
        { name: "Baju Bodo",                  type: "Pakaian Adat",        rarity: "rare",        power: 5 },
        { name: "Kecapi Sulsel",              type: "Alat Musik",          rarity: "uncommon",    power: 4 },
        { name: "Tari Kipas Pakarena",        type: "Tarian",              rarity: "uncommonplus",power: 3 },
        { name: "Rambu Solo",                 type: "Adat Istiadat",       rarity: "commonplus",  power: 2 },
        { name: "Coto Makassar",              type: "Makanan Khas",        rarity: "common",      power: 1 },
    ]},
    { name: "Sulawesi Tenggara", cards: [
        { name: "Nikel & Aspal Buton",        type: "SDA Unggulan",        rarity: "mythic",      power: 10 },
        { name: "Benteng Keraton Buton",      type: "Bangunan Bersejarah", rarity: "legendary",   power: 9 },
        { name: "Pertambangan Aspal",         type: "Sektor Ekonomi",      rarity: "epic",        power: 8 },
        { name: "Rumah Istana Buton",         type: "Rumah Adat",          rarity: "rareplus",    power: 7 },
        { name: "Keris Sultra",               type: "Senjata Tradisional", rarity: "rarestar",    power: 6 },
        { name: "Babu Nggawi",                type: "Pakaian Adat",        rarity: "rare",        power: 5 },
        { name: "Ladolado",                   type: "Alat Musik",          rarity: "uncommon",    power: 4 },
        { name: "Tari Lulo",                  type: "Tarian",              rarity: "uncommonplus",power: 3 },
        { name: "Posuo",                      type: "Adat Istiadat",       rarity: "commonplus",  power: 2 },
        { name: "Lapa-lapa",                  type: "Makanan Khas",        rarity: "common",      power: 1 },
    ]},
    { name: "Maluku", cards: [
        { name: "Pala & Cengkeh Maluku",      type: "SDA Unggulan",        rarity: "mythic",      power: 10 },
        { name: "Benteng Belgica Banda",      type: "Bangunan Bersejarah", rarity: "legendary",   power: 9 },
        { name: "Perkebunan Rempah",          type: "Sektor Ekonomi",      rarity: "epic",        power: 8 },
        { name: "Rumah Baileo",               type: "Rumah Adat",          rarity: "rareplus",    power: 7 },
        { name: "Parang Salawaku",            type: "Senjata Tradisional", rarity: "rarestar",    power: 6 },
        { name: "Baju Cele",                  type: "Pakaian Adat",        rarity: "rare",        power: 5 },
        { name: "Tifa",                       type: "Alat Musik",          rarity: "uncommon",    power: 4 },
        { name: "Tari Cakalele",              type: "Tarian",              rarity: "uncommonplus",power: 3 },
        { name: "Pukul Sapu",                 type: "Adat Istiadat",       rarity: "commonplus",  power: 2 },
        { name: "Papeda",                     type: "Makanan Khas",        rarity: "common",      power: 1 },
    ]},
    { name: "Maluku Utara", cards: [
        { name: "Nikel & Cengkeh Malut",      type: "SDA Unggulan",        rarity: "mythic",      power: 10 },
        { name: "Benteng Tolukko Ternate",    type: "Bangunan Bersejarah", rarity: "legendary",   power: 9 },
        { name: "Pertambangan Nikel",         type: "Sektor Ekonomi",      rarity: "epic",        power: 8 },
        { name: "Rumah Sasadu",               type: "Rumah Adat",          rarity: "rareplus",    power: 7 },
        { name: "Parang Malut",               type: "Senjata Tradisional", rarity: "rarestar",    power: 6 },
        { name: "Manteren Lamo",              type: "Pakaian Adat",        rarity: "rare",        power: 5 },
        { name: "Tifa Malut",                 type: "Alat Musik",          rarity: "uncommon",    power: 4 },
        { name: "Tari Lenso",                 type: "Tarian",              rarity: "uncommonplus",power: 3 },
        { name: "Kololi Kie",                 type: "Adat Istiadat",       rarity: "commonplus",  power: 2 },
        { name: "Gohu Ikan",                  type: "Makanan Khas",        rarity: "common",      power: 1 },
    ]},
    { name: "Papua", cards: [
        { name: "Emas & Tembaga Freeport",    type: "SDA Unggulan",        rarity: "mythic",      power: 10 },
        { name: "Tugu MacArthur Jayapura",    type: "Bangunan Bersejarah", rarity: "legendary",   power: 9 },
        { name: "Pertambangan Emas",          type: "Sektor Ekonomi",      rarity: "epic",        power: 8 },
        { name: "Rumah Honai",                type: "Rumah Adat",          rarity: "rareplus",    power: 7 },
        { name: "Pisau Belati Papua",         type: "Senjata Tradisional", rarity: "rarestar",    power: 6 },
        { name: "Koteka",                     type: "Pakaian Adat",        rarity: "rare",        power: 5 },
        { name: "Tifa Papua",                 type: "Alat Musik",          rarity: "uncommon",    power: 4 },
        { name: "Tari Musyoh",                type: "Tarian",              rarity: "uncommonplus",power: 3 },
        { name: "Bakar Batu",                 type: "Adat Istiadat",       rarity: "commonplus",  power: 2 },
        { name: "Papeda Papua",               type: "Makanan Khas",        rarity: "common",      power: 1 },
    ]},
    { name: "Papua Barat", cards: [
        { name: "Gas Alam & Ikan Laut",       type: "SDA Unggulan",        rarity: "mythic",      power: 10 },
        { name: "Tugu Jepang Manokwari",      type: "Bangunan Bersejarah", rarity: "legendary",   power: 9 },
        { name: "Perikanan & Migas",          type: "Sektor Ekonomi",      rarity: "epic",        power: 8 },
        { name: "Rumah Mod Aki Aksa",         type: "Rumah Adat",          rarity: "rareplus",    power: 7 },
        { name: "Pisau Pabar",                type: "Senjata Tradisional", rarity: "rarestar",    power: 6 },
        { name: "Ewer",                       type: "Pakaian Adat",        rarity: "rare",        power: 5 },
        { name: "Tifa Pabar",                 type: "Alat Musik",          rarity: "uncommon",    power: 4 },
        { name: "Tari Suanggi",               type: "Tarian",              rarity: "uncommonplus",power: 3 },
        { name: "Wor",                        type: "Adat Istiadat",       rarity: "commonplus",  power: 2 },
        { name: "Ikan Bakar Manokwari",       type: "Makanan Khas",        rarity: "common",      power: 1 },
    ]},
    { name: "Papua Selatan", cards: [
        { name: "Kayu & Hasil Hutan",         type: "SDA Unggulan",        rarity: "mythic",      power: 10 },
        { name: "Situs Megalitik Okaba",      type: "Bangunan Bersejarah", rarity: "legendary",   power: 9 },
        { name: "Kehutanan",                  type: "Sektor Ekonomi",      rarity: "epic",        power: 8 },
        { name: "Rumah Gotad",                type: "Rumah Adat",          rarity: "rareplus",    power: 7 },
        { name: "Pisau Pasel",                type: "Senjata Tradisional", rarity: "rarestar",    power: 6 },
        { name: "Pummi",                      type: "Pakaian Adat",        rarity: "rare",        power: 5 },
        { name: "Tifa Pasel",                 type: "Alat Musik",          rarity: "uncommon",    power: 4 },
        { name: "Tari Gatzi",                 type: "Tarian",              rarity: "uncommonplus",power: 3 },
        { name: "Yi Ha",                      type: "Adat Istiadat",       rarity: "commonplus",  power: 2 },
        { name: "Sagu Sep",                   type: "Makanan Khas",        rarity: "common",      power: 1 },
    ]},
    { name: "Papua Tengah", cards: [
        { name: "Emas & Hasil Hutan Pateng",  type: "SDA Unggulan",        rarity: "mythic",      power: 10 },
        { name: "Situs Prasejarah Lembah Baliem", type: "Bangunan Bersejarah", rarity: "legendary", power: 9 },
        { name: "Pertanian & Kehutanan",      type: "Sektor Ekonomi",      rarity: "epic",        power: 8 },
        { name: "Rumah Karapao",              type: "Rumah Adat",          rarity: "rareplus",    power: 7 },
        { name: "Pisau Pateng",               type: "Senjata Tradisional", rarity: "rarestar",    power: 6 },
        { name: "Sali",                       type: "Pakaian Adat",        rarity: "rare",        power: 5 },
        { name: "Tifa Pateng",                type: "Alat Musik",          rarity: "uncommon",    power: 4 },
        { name: "Tari Yuw",                   type: "Tarian",              rarity: "uncommonplus",power: 3 },
        { name: "Bakar Batu Pateng",          type: "Adat Istiadat",       rarity: "commonplus",  power: 2 },
        { name: "Sagu Bakar",                 type: "Makanan Khas",        rarity: "common",      power: 1 },
    ]},
    { name: "Papua Pegunungan", cards: [
        { name: "Hasil Hutan & Kopi",         type: "SDA Unggulan",        rarity: "mythic",      power: 10 },
        { name: "Monumen Yalimo",             type: "Bangunan Bersejarah", rarity: "legendary",   power: 9 },
        { name: "Pertanian Pegunungan",       type: "Sektor Ekonomi",      rarity: "epic",        power: 8 },
        { name: "Rumah Honai Pegunungan",     type: "Rumah Adat",          rarity: "rareplus",    power: 7 },
        { name: "Pisau Peg",                  type: "Senjata Tradisional", rarity: "rarestar",    power: 6 },
        { name: "Yokal",                      type: "Pakaian Adat",        rarity: "rare",        power: 5 },
        { name: "Pikon",                      type: "Alat Musik",          rarity: "uncommon",    power: 4 },
        { name: "Tari Selamat Datang",        type: "Tarian",              rarity: "uncommonplus",power: 3 },
        { name: "Festival Lembah Baliem",     type: "Adat Istiadat",       rarity: "commonplus",  power: 2 },
        { name: "Udang Selingkuh",            type: "Makanan Khas",        rarity: "common",      power: 1 },
    ]},
    { name: "Papua Barat Daya", cards: [
        { name: "Ikan & Mutiara Sorong",      type: "SDA Unggulan",        rarity: "mythic",      power: 10 },
        { name: "Benteng VOC Sorong",         type: "Bangunan Bersejarah", rarity: "legendary",   power: 9 },
        { name: "Perikanan & Pariwisata",     type: "Sektor Ekonomi",      rarity: "epic",        power: 8 },
        { name: "Rumah Kambik",               type: "Rumah Adat",          rarity: "rareplus",    power: 7 },
        { name: "Pisau Pabarday",             type: "Senjata Tradisional", rarity: "rarestar",    power: 6 },
        { name: "Boe",                        type: "Pakaian Adat",        rarity: "rare",        power: 5 },
        { name: "Tifa Pabarday",              type: "Alat Musik",          rarity: "uncommon",    power: 4 },
        { name: "Tari Aluyen",                type: "Tarian",              rarity: "uncommonplus",power: 3 },
        { name: "Injak Piring",               type: "Adat Istiadat",       rarity: "commonplus",  power: 2 },
        { name: "Udang Karang",               type: "Makanan Khas",        rarity: "common",      power: 1 },
    ]},
];

const ALL_CARDS: Card[] = [];
ALL_PROVINCES.forEach(province => {
    province.cards.forEach(card => {
        ALL_CARDS.push({ ...card, province: province.name, id: `${province.name}-${card.name}` });
    });
});

// =============================================
// FIREBASE REST API CLIENT (no external deps)
// =============================================
const FB_DB_URL = Deno.env.get("FIREBASE_DATABASE_URL")
    || "https://rex-server-8a176-default-rtdb.asia-southeast1.firebasedatabase.app";

// deno-lint-ignore no-explicit-any
let fbServiceAccount: any = null;
let fbTokenCache: { token: string; expiry: number } | null = null;

(function loadServiceAccount() {
    const raw = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
    if (!raw) { console.warn("⚠️  FIREBASE_SERVICE_ACCOUNT tidak diset — rank disimpan oleh client sebagai fallback"); return; }
    try { fbServiceAccount = JSON.parse(raw); console.log("✅ Firebase service account loaded"); }
    catch (e) { console.error("❌ FIREBASE_SERVICE_ACCOUNT JSON invalid:", e); }
})();

async function fbGetToken(): Promise<string | null> {
    if (!fbServiceAccount) return null;
    const now = Math.floor(Date.now() / 1000);
    if (fbTokenCache && fbTokenCache.expiry > now + 60) return fbTokenCache.token;
    try {
        const b64url = (obj: object) =>
            btoa(JSON.stringify(obj)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
        const header  = { alg: "RS256", typ: "JWT" };
        const payload = {
            iss: fbServiceAccount.client_email, sub: fbServiceAccount.client_email,
            aud: "https://oauth2.googleapis.com/token",
            iat: now, exp: now + 3600,
            scope: "https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email"
        };
        const input   = `${b64url(header)}.${b64url(payload)}`;
        const pemBody = fbServiceAccount.private_key
            .replace(/-----BEGIN PRIVATE KEY-----/g, "")
            .replace(/-----END PRIVATE KEY-----/g, "")
            .replace(/\n/g, "");
        const der = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));
        const key = await crypto.subtle.importKey(
            "pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]
        );
        const sig    = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(input));
        const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
            .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
        const jwt    = `${input}.${sigB64}`;
        const resp   = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`
        });
        const json = await resp.json();
        if (!json.access_token) throw new Error(JSON.stringify(json));
        fbTokenCache = { token: json.access_token, expiry: now + 3590 };
        return fbTokenCache.token;
    } catch (e) { console.error("❌ fbGetToken error:", e); return null; }
}

// deno-lint-ignore no-explicit-any
async function fbTransaction(path: string, updateFn: (cur: any) => any): Promise<boolean> {
    const token = await fbGetToken();
    if (!token) return false;
    const url = `${FB_DB_URL}${path}.json`;
    for (let attempt = 0; attempt < 3; attempt++) {
        const getRes = await fetch(url, { headers: { Authorization: `Bearer ${token}`, "X-Firebase-ETag": "true" } });
        const etag   = getRes.headers.get("ETag") ?? "*";
        const cur    = await getRes.json();
        const next   = updateFn(cur === null ? undefined : cur);
        if (next === undefined) return false;
        const putRes = await fetch(url, {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "if-match": etag },
            body: JSON.stringify(next)
        });
        if (putRes.ok)          return true;
        if (putRes.status === 412) continue; // conflict → retry
        const errText = await putRes.text().catch(() => "");
        console.error(`❌ fbTransaction PUT failed ${putRes.status}: ${errText}`);
        return false;
    }
    return false;
}

async function fbPush(path: string, value: unknown): Promise<boolean> {
    const token = await fbGetToken();
    if (!token) return false;
    const res = await fetch(`${FB_DB_URL}${path}.json`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(value)
    });
    if (!res.ok) {
        const errText = await res.text().catch(() => "");
        console.error(`❌ fbPush POST failed ${res.status} path=${path}: ${errText}`);
    }
    return res.ok;
}

async function fbSet(path: string, value: unknown): Promise<boolean> {
    const token = await fbGetToken();
    if (!token) return false;
    const res = await fetch(`${FB_DB_URL}${path}.json`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(value)
    });
    if (!res.ok) {
        const errText = await res.text().catch(() => "");
        console.error(`❌ fbSet PUT failed ${res.status}: ${errText}`);
    }
    return res.ok;
}

// =============================================
// RANK SYSTEM (SERVER-SIDE)
// =============================================
const RANKS = [
    "Bronze III", "Bronze II", "Bronze I",
    "Silver III", "Silver II", "Silver I",
    "Gold III",   "Gold II",   "Gold I",
    "Diamond III","Diamond II","Diamond I",
    "Platinum III","Platinum II","Platinum I",
    "Platinum MAX"
];
const RANK_CHANGES: Record<string, number[]> = {
    Bronze:   [20, 10,  5,  -5],
    Silver:   [16,  8,  4, -12],
    Gold:     [12,  6,  3, -20],
    Diamond:  [ 8,  4,  2, -28],
    Platinum: [ 5,  2,  1, -35],
};
function rankTier(name: string): string {
    if (name === "Platinum MAX") return "Platinum";
    return ["Bronze","Silver","Gold","Diamond","Platinum"].find(t => name.startsWith(t)) || "Bronze";
}
function calcRank(name: string, pts: number, pos: number): { name: string; pts: number } {
    const change = RANK_CHANGES[rankTier(name)][pos - 1];
    const idx    = RANKS.indexOf(name);
    if (name === "Platinum MAX") return { name: "Platinum MAX", pts: Math.max(0, pts + change) };
    let np = pts + change, nn = name;
    if (np >= 100 && idx < RANKS.length - 1) { nn = RANKS[idx + 1]; np -= 100; }
    else if (np < 0) { if (name === "Bronze III") np = 0; else { nn = RANKS[idx - 1]; np = Math.max(0, 100 + np); } }
    return { name: nn, pts: np };
}

async function savePlayerStats(userUid: string, playerName: string, position: number): Promise<boolean> {
    if (!fbServiceAccount || !userUid || userUid === "BOT") return false;
    try {
        const base = `/users/${userUid}`;
        // RankData dulu agar bisa catat perubahan ke history
        let _rankBefore = "Bronze III", _rankAfter = "Bronze III", _ptsChange = 0, _ptsBefore = 0, _ptsAfter = 0;
        let _peakRank = "Bronze III";
        const rankOk = await fbTransaction(`${base}/rankData`, (r) => {
            if (!r) r = { rankName: "Bronze III", points: 0, peakRank: "Bronze III", peakRankIndex: 0 };
            _rankBefore = r.rankName || "Bronze III";
            _ptsBefore  = r.points   || 0;
            _ptsChange  = RANK_CHANGES[rankTier(_rankBefore)][position - 1];
            const res   = calcRank(_rankBefore, _ptsBefore, position);
            _rankAfter  = res.name;
            _ptsAfter   = res.pts;
            r.rankName  = res.name; r.points = res.pts;
            const ni    = RANKS.indexOf(res.name);
            if (ni > (r.peakRankIndex || 0)) {
                r.peakRank = res.name; r.peakRankIndex = ni; r.peakRankPoints = res.pts;
            } else if (res.name === r.peakRank && res.pts > (r.peakRankPoints || 0)) {
                r.peakRankPoints = res.pts;
            }
            _peakRank = r.peakRank || res.name;
            return r;
        });
        // Update stats dulu agar hasilnya bisa dimasukkan ke leaderboard node
        // deno-lint-ignore no-explicit-any
        let _updatedStats: any = null;
        const statsOk = await fbTransaction(`${base}/stats`, (s) => {
            if (!s) s = { totalMatches: 0, rank1: 0, rank2: 0, rank3: 0, rank4: 0 };
            s.totalMatches = (s.totalMatches || 0) + 1;
            s[`rank${position}`] = (s[`rank${position}`] || 0) + 1;
            _updatedStats = { ...s };
            return s;
        });
        // Push history dengan retry (hingga 3x, 800ms antar percobaan)
        // karena POST ke Firebase sesekali gagal karena network hiccup.
        let histOk = false;
        for (let hi = 0; hi < 3 && !histOk; hi++) {
            if (hi > 0) await new Promise(r => setTimeout(r, 800));
            histOk = await fbPush(`${base}/history`, {
                rank: position, date: Date.now(),
                rankBefore: _rankBefore, rankAfter: _rankAfter,
                ptsBefore: _ptsBefore, ptsAfter: _ptsAfter, ptsChange: _ptsChange
            });
        }
        // Update leaderboard secara paralel (non-kritis)
        const [lbOk] = await Promise.all([
            // Sinkronisasi node leaderboard: rank + stats lengkap agar tampil benar di leaderboard
            fbSet(`/leaderboard/${userUid}`, {
                name: playerName,
                rankName: _rankAfter,
                points: _ptsAfter,
                peakRank: _peakRank,
                totalMatches: _updatedStats?.totalMatches ?? 0,
                rank1: _updatedStats?.rank1 ?? 0,
                rank2: _updatedStats?.rank2 ?? 0,
                rank3: _updatedStats?.rank3 ?? 0,
                rank4: _updatedStats?.rank4 ?? 0,
                updatedAt: Date.now()
            })
        ]);
        // lbOk bersifat non-kritis: kegagalan leaderboard tidak boleh memicu client fallback
        const ok = statsOk && histOk && rankOk;
        console.log(`${ok ? "✅" : "⚠️ "} savePlayerStats uid=${userUid} pos=${position} stats=${statsOk} hist=${histOk} rank=${rankOk} lb=${lbOk}`);
        return ok;
    } catch (e) {
        console.error(`❌ savePlayerStats uid=${userUid}:`, e);
        return false;
    }
}

class GameEngine {
    roomId: string;
    onGameOver?: () => void;

    gs: {
        round: number; phase: number; phase1Player: string | null;
        drawPile: Card[]; discardPile: Card[]; topCard: Card[];
        currentProvince: string | null; players: GamePlayer[];
        forcePickMode: boolean; forcePickPlayers: GamePlayer[];
        forcePickProcessing: boolean; isHandlingForcePick: boolean;
        isEndingRound: boolean; isStartingPhase: boolean;
        currentRoundPlays: RoundPlay[]; roundHistory: RoundHistory[];
        winners: GamePlayer[]; gameOver: boolean; surrenderCount: number;
    };

    constructor(roomId: string) {
        this.roomId = roomId;
        this.gs = {
            round: 1, phase: 1, phase1Player: null,
            drawPile: [], discardPile: [], topCard: [],
            currentProvince: null, players: [],
            forcePickMode: false, forcePickPlayers: [],
            forcePickProcessing: false, isHandlingForcePick: false,
            isEndingRound: false, isStartingPhase: false,
            currentRoundPlays: [], roundHistory: [],
            winners: [], gameOver: false, surrenderCount: 0
        };
    }

    addPlayer(p: { id: string; name: string; isBot: boolean; socket?: WebSocket; userUid: string }) {
        const player: GamePlayer = {
            id: p.id, name: p.name, isBot: p.isBot, socket: p.socket,
            hand: [], totalPower: 0, hasPlayed: false, mustDraw: false,
            mustForcePick: false, freed: false, winner: false, rank: 0,
            isProcessingAction: false, autoMode: false, userUid: p.userUid || '',
            leftMatch: false, statsSaved: false
        };
        this.gs.players.push(player);
    }

    addBot(name: string) {
        this.addPlayer({ id: `bot_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, name, isBot: true, userUid: 'BOT' });
    }

    static BOT_NAMES = ['Miya','Nayla','Aldi','Marcel','Zoe','Kara','Mega','Genta','Flex','Angel','Teorita','Miko','Luba','Nana','Kong','Walka'];
    static usedBotNames: string[] = [];

    static pickBotName(): string {
        const available = GameEngine.BOT_NAMES.filter(n => !GameEngine.usedBotNames.includes(n));
        const pool = available.length > 0 ? available : GameEngine.BOT_NAMES;
        const name = pool[Math.floor(Math.random() * pool.length)];
        GameEngine.usedBotNames.push(name);
        if (GameEngine.usedBotNames.length > GameEngine.BOT_NAMES.length) GameEngine.usedBotNames = [];
        return name;
    }

    private shuffle<T>(arr: T[]): T[] {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    private getActivePlayers() { return this.gs.players.filter(p => !p.winner); }
    private updatePower(p: GamePlayer) { p.totalPower = p.hand.reduce((s, c) => s + c.power, 0); }

    private checkWin(player: GamePlayer) {
        if (player.hand.length === 0 && !player.winner) {
            player.winner = true;
            // Cari rank TERBAIK (terkecil) yang belum dipakai.
            // Penting: jika ada surrenderer yang sudah ambil rank besar (misal rank 4),
            // pemain yang menang duluan tetap dapat rank 1, bukan winners.length+1.
            const takenRanks = new Set(this.gs.winners.map(w => w.rank));
            let rank = 1;
            while (takenRanks.has(rank)) rank++;
            player.rank = rank;
            this.gs.winners.push(player);
            const medals = ['🥇','🥈','🥉','🎖️'];
            this.broadcastLog(`${medals[player.rank-1] || '🏅'} ${player.name} MENANG! Peringkat: ${player.rank}`);

            // Simpan stats segera saat pemain menang (mirip pola handleSurrender).
            // Dilakukan di sini karena socket masih terbuka — STATS_SAVED / SAVE_STATS_CLIENT
            // masih bisa dikirim ke client. Flag statsSaved mencegah double-save di endGame().
            if (!player.isBot && player.userUid && player.userUid !== "BOT" && !player.statsSaved) {
                player.statsSaved = true;
                const _p = player;
                savePlayerStats(_p.userUid, _p.name, _p.rank).then(ok => {
                    if (ok) {
                        if (_p.socket && _p.socket.readyState === 1) {
                            try { _p.socket.send(JSON.stringify({ type: 'STATS_SAVED', rank: _p.rank })); } catch (_) { /* noop */ }
                        }
                    } else {
                        _p.statsSaved = false;
                        if (_p.socket && _p.socket.readyState === 1) {
                            // Socket masih terbuka → minta client lakukan fallback save
                            try { _p.socket.send(JSON.stringify({ type: 'SAVE_STATS_CLIENT', rank: _p.rank })); } catch (_) { /* noop */ }
                        } else {
                            // Socket sudah tutup (player sudah meninggalkan match) → retry server-side
                            console.log(`⚠️ checkWin save gagal (socket tutup) → retry server-side uid=${_p.userUid}`);
                            _p.statsSaved = true;
                            setTimeout(() => {
                                savePlayerStats(_p.userUid, _p.name, _p.rank).then(ok2 => {
                                    if (ok2) {
                                        console.log(`✅ checkWin retry berhasil uid=${_p.userUid}`);
                                    } else {
                                        _p.statsSaved = false;
                                        console.log(`❌ checkWin retry juga gagal uid=${_p.userUid}`);
                                    }
                                });
                            }, 2000);
                        }
                    }
                });
            }
        }
    }

    private clearAfkTimer(p: GamePlayer) {
        if (p.afkTimer) { clearTimeout(p.afkTimer); p.afkTimer = undefined; }
    }

    private clearAllAfkTimers() { this.gs.players.forEach(p => this.clearAfkTimer(p)); }

    private setAfkTimer(player: GamePlayer, action: () => void, delay = 25000) {
        this.clearAfkTimer(player);
        if (player.isBot) return;
        player.afkTimer = setTimeout(() => {
            if (!this.gs.gameOver) {
                this.broadcastLog(`⏰ ${player.name} AFK - aksi otomatis`);
                action();
            }
        }, delay) as unknown as number;
    }

    private dealCard(player: GamePlayer, maxRetry = 50): boolean {
        if (this.gs.drawPile.length === 0) {
            player.mustForcePick = true; player.mustDraw = false;
            this.broadcastLog(`⚠️ Draw Pile habis! ${player.name} → Force Pick`);
            return false;
        }
        const usedIds = new Set([
            ...this.gs.topCard.map(c => c.id),
            ...this.gs.players.flatMap(p => p.hand.map(c => c.id))
        ]);
        for (let attempt = 0; attempt < maxRetry; attempt++) {
            if (this.gs.drawPile.length === 0) break;
            const card = this.gs.drawPile.pop()!;
            if (!usedIds.has(card.id)) { player.hand.push(card); this.updatePower(player); return true; }
            this.gs.drawPile.splice(Math.floor(Math.random() * this.gs.drawPile.length), 0, card);
        }
        player.mustForcePick = true; player.mustDraw = false;
        return false;
    }

    startGame() {
        this.gs.drawPile = this.shuffle([...ALL_CARDS]);
        const usedIds = new Set<string>();

        // Distribusi per pemain: 1 Legendary, 1 Epic, 3 Rare, 3 Uncommon, 2 Common
        const DEAL_PLAN: { rarity: string; count: number }[] = [
            { rarity: 'legendary', count: 1 },
            { rarity: 'epic',      count: 1 },
            { rarity: 'rare',      count: 3 },
            { rarity: 'uncommon',  count: 3 },
            { rarity: 'common',    count: 2 },
        ];

        this.gs.players.forEach(player => {
            for (const slot of DEAL_PLAN) {
                let dealt = 0;
                // Cari kartu dari drawPile sesuai rarity
                for (let attempt = 0; attempt < this.gs.drawPile.length * 2 && dealt < slot.count; attempt++) {
                    const idx = this.gs.drawPile.findIndex(c => c.rarity === slot.rarity && !usedIds.has(c.id));
                    if (idx === -1) break;
                    const card = this.gs.drawPile.splice(idx, 1)[0];
                    player.hand.push(card);
                    usedIds.add(card.id);
                    this.updatePower(player);
                    dealt++;
                }
            }
        });

        this.broadcastLog(`🎮 Game dimulai! Setiap pemain mendapat 10 kartu (1L/1E/3R/3U/2C).`);
        setTimeout(() => this.startPhase1(), 500);
    }

    private startPhase1() {
        if (this.gs.gameOver || this.gs.isStartingPhase) return;
        this.gs.isStartingPhase = true;
        this.gs.phase = 1;
        this.gs.topCard = []; this.gs.currentProvince = null;
        this.gs.currentRoundPlays = [];
        this.gs.forcePickMode = false; this.gs.forcePickPlayers = [];
        this.gs.forcePickProcessing = false; this.gs.isHandlingForcePick = false;
        this.gs.players.forEach(p => {
            p.hasPlayed = false; p.mustDraw = false; p.mustForcePick = false;
            p.freed = false; p.isProcessingAction = false;
            this.clearAfkTimer(p);
        });
        setTimeout(() => { this.gs.isStartingPhase = false; }, 100);

        if (this.gs.round === 1) {
            this.broadcastGameState();
            setTimeout(() => this.systemPlayPhase1(), 800);
            return;
        }

        const lastRound = this.gs.roundHistory[this.gs.roundHistory.length - 1];
        const validPlays = (lastRound?.plays || []).filter(play => {
            if (play.power === 0) return false;
            if (play.isForcePickPlay) return false;
            const p = this.gs.players.find(p => p.id === play.playerId);
            return p && !p.winner;
        });

        if (validPlays.length === 0) {
            this.broadcastGameState();
            setTimeout(() => this.systemPlayPhase1(), 800);
            return;
        }

        validPlays.sort((a, b) => b.power - a.power);
        const phase1Player = this.gs.players.find(p => p.id === validPlays[0].playerId);
        if (!phase1Player) {
            this.broadcastGameState();
            setTimeout(() => this.systemPlayPhase1(), 800);
            return;
        }

        this.gs.phase1Player = phase1Player.id;
        this.broadcastLog(`🎯 👤 ${phase1Player.name} mendapat giliran Tahap 1!`);

        if (phase1Player.isBot) {
            this.broadcastGameState();
            setTimeout(() => this.botPlayPhase1(phase1Player), 1000);
        } else {
            this.setAfkTimer(phase1Player, () => {
                if (!phase1Player.hasPlayed && phase1Player.hand.length > 0)
                    this.botPlayPhase1(phase1Player);
            });
            this.broadcastGameState();
            // Jika phase1Player sedang auto-mode (disconnect), trigger aksi cepat (3s bukan 30s)
            if (phase1Player.autoMode) setTimeout(() => this.runAutoAction(phase1Player), 500);
        }
    }

    private systemPlayPhase1() {
        let card: Card | undefined;
        if (this.gs.drawPile.length > 0) {
            card = this.gs.drawPile.pop()!;
        } else if (this.gs.discardPile.length > 0) {
            card = this.gs.discardPile.splice(Math.floor(Math.random() * this.gs.discardPile.length), 1)[0];
            this.broadcastLog(`♻️ Draw Pile habis! Ambil dari Discard Pile`);
        } else {
            this.broadcastLog(`❌ Tidak ada kartu tersisa! Game berakhir.`);
            this.endGame(); return;
        }
        this.gs.currentProvince = card.province;
        this.gs.topCard = [card];
        this.gs.phase1Player = 'system';
        this.gs.currentRoundPlays.push({ playerId: 'system', playerName: 'Sistem', card, power: card.power });
        this.broadcastLog(`🎴 Sistem menjatuhkan ${card.name} (${card.province}) - Power ${card.power}`);
        this.broadcastGameState();
        setTimeout(() => this.startPhase2(), 1500);
    }

    private botPlayPhase1(bot: GamePlayer) {
        if (bot.hasPlayed || bot.hand.length === 0) return;
        const card = [...bot.hand].sort((a, b) => a.power - b.power)[0];
        this.gs.currentProvince = card.province;
        this.gs.topCard = [card];
        bot.hand.splice(bot.hand.findIndex(c => c.id === card.id), 1);
        bot.hasPlayed = true;
        this.updatePower(bot);
        this.gs.currentRoundPlays.push({ playerId: bot.id, playerName: bot.name, card, power: card.power });
        this.broadcastLog(`👤 ${bot.name} menjatuhkan ${card.name} (${card.province}) - Power ${card.power}`);
        this.checkWin(bot);
        this.broadcastGameState();
        setTimeout(() => this.startPhase2(), 1000);
    }

    private startPhase2() {
        if (this.gs.gameOver) return;
        this.gs.phase = 2;
        this.gs.forcePickProcessing = false;
        this.gs.isHandlingForcePick = false;
        this.broadcastLog(`📍 Tahap 2 dimulai! Provinsi aktif: ${this.gs.currentProvince}`); 
        const drawPileEmpty = this.gs.drawPile.length === 0;

        this.getActivePlayers().forEach(player => {
            if (player.hasPlayed) return;
            const hasMatching = player.hand.some(c => c.province === this.gs.currentProvince);
            if (!hasMatching) {
                if (drawPileEmpty) {
                    player.mustForcePick = true;
                } else {
                    player.mustDraw = true;
                    if (!player.isBot) {
                        this.setAfkTimer(player, () => {
                            if (player.mustDraw && !player.hasPlayed) this.handleDrawCardInternal(player);
                        });
                    }
                }
            } else if (!player.isBot) {
                this.setAfkTimer(player, () => {
                    if (!player.hasPlayed && !player.mustDraw && !player.mustForcePick) {
                        const matching = player.hand.filter(c => c.province === this.gs.currentProvince);
                        if (matching.length > 0) this.handlePlayCardInternal(player, matching.sort((a,b) => a.power - b.power)[0]);
                    }
                });
            }
        });

        this.broadcastGameState();
        // Trigger aksi cepat untuk pemain yang sedang auto-mode (disconnect)
        this.getActivePlayers()
            .filter(p => !p.isBot && p.autoMode && !p.hasPlayed)
            .forEach(p => setTimeout(() => this.runAutoAction(p), 500));
        setTimeout(() => this.botsPlayPhase2(), 1000);
    }

    private botsPlayPhase2() {
        const bots = this.getActivePlayers().filter(p => p.isBot && !p.hasPlayed);
        if (bots.length === 0) { setTimeout(() => this.checkPhase2End(), 500); return; }
        let done = 0;
        bots.forEach((bot, idx) => {
            setTimeout(() => {
                this.botPlayPhase2(bot);
                if (++done === bots.length) setTimeout(() => this.checkPhase2End(), 800);
            }, (idx + 1) * 700);
        });
    }

    private botPlayPhase2(bot: GamePlayer) {
        if (bot.hasPlayed) return;
        if (bot.mustDraw) {
            if (this.dealCard(bot)) {
                bot.mustDraw = false; bot.hasPlayed = true;
                this.gs.currentRoundPlays.push({ playerId: bot.id, playerName: bot.name, card: null, power: 0 });
                this.broadcastLog(`👤 ${bot.name} melakukan Draw Card`);
            }
            // Jika dealCard gagal, mustForcePick sudah di-set oleh dealCard → ditangani checkPhase2End
            this.broadcastGameState(); return;
        }
        const matching = bot.hand.filter(c => c.province === this.gs.currentProvince);
        if (matching.length > 0) {
            // Cari kartu yang TIDAK duplikat di topCard (sorted asc power)
            const playable = matching.sort((a,b) => a.power - b.power).filter(c => !this.gs.topCard.some(t => t.id === c.id));
            if (playable.length > 0) {
                const card = playable[0];
                bot.hand.splice(bot.hand.findIndex(c => c.id === card.id), 1);
                this.gs.topCard.push(card);
                bot.hasPlayed = true;
                this.updatePower(bot);
                this.gs.currentRoundPlays.push({ playerId: bot.id, playerName: bot.name, card, power: card.power });
                this.checkWin(bot);
                this.broadcastGameState();
            } else {
                // Edge case: semua matching card sudah ada di topCard (duplikat)
                // Paksa draw/force-pick agar game tidak stuck
                if (this.gs.drawPile.length === 0) {
                    bot.mustForcePick = true;
                } else if (this.dealCard(bot)) {
                    bot.mustDraw = false; bot.hasPlayed = true;
                    this.gs.currentRoundPlays.push({ playerId: bot.id, playerName: bot.name, card: null, power: 0 });
                    this.broadcastLog(`👤 ${bot.name} melakukan Draw Card (fallback duplikat)`);
                }
                this.broadcastGameState();
            }
        }
    }
    private checkPhase2End() {
        if (this.gs.gameOver || this.gs.isHandlingForcePick || this.gs.isEndingRound) return;
        const human = this.gs.players.find(p => !p.isBot && !p.winner);
        if (human && !human.hasPlayed && !human.mustForcePick && !human.autoMode) return;
        const activePlayers = this.getActivePlayers();
        if (!activePlayers.every(p => p.hasPlayed || p.mustForcePick)) return;
        const fpPlayers = activePlayers.filter(p => p.mustForcePick && !p.hasPlayed);
        if (fpPlayers.length === 0) { this.endRound(); return; }
        if (this.gs.isHandlingForcePick) return;
        this.gs.isHandlingForcePick = true;
        setTimeout(() => this.handleForcePickDecision(fpPlayers), 500);
    }

    private handleForcePickDecision(fpPlayers: GamePlayer[]) {
        const totalJatuhkan = this.gs.currentRoundPlays.filter(p => p.card?.province === this.gs.currentProvince).length;
        const totalFP = fpPlayers.length;

        if (totalJatuhkan >= totalFP) {
            this.broadcastLog(`⚠️ Tidak ada pembebasan - semua Force Pick harus ambil kartu`);
            this.processForcePick(fpPlayers, []);
        } else {
            const jumlahBebas = totalFP - totalJatuhkan;
            const sorted = [...fpPlayers].sort((a, b) => {
                if (a.hand.length !== b.hand.length) return b.hand.length - a.hand.length;
                if (a.totalPower !== b.totalPower) return a.totalPower - b.totalPower;
                return Math.random() - 0.5;
            });
            for (let i = 0; i < jumlahBebas; i++) {
                sorted[i].mustForcePick = false; sorted[i].hasPlayed = true; sorted[i].freed = true;
                this.broadcastLog(`✅ 👤 ${sorted[i].name} DIBEBASKAN dari Force Pick!`);
            }
            this.processForcePick(sorted.slice(jumlahBebas), sorted.slice(0, jumlahBebas));
        }
    }

    private processForcePick(mustPickPlayers: GamePlayer[], freedPlayers: GamePlayer[]) {
        const humanMustPick = mustPickPlayers.find(p => !p.isBot);
        if (humanMustPick) {
            this.gs.forcePickMode = true;
            this.gs.forcePickPlayers = mustPickPlayers;
            this.gs.forcePickProcessing = false;
            this.broadcastLog(`⚠️ ${humanMustPick.name} harus memilih kartu dari Top Card!`);
            this.broadcastGameState();
            this.setAfkTimer(humanMustPick, () => {
                if (!humanMustPick.hasPlayed && this.gs.topCard.length > 0) {
                    this.handleForcePickCardInternal(humanMustPick, this.gs.topCard[0].id);
                    this.broadcastLog(`⏰ ${humanMustPick.name} auto-force-pick (AFK)`);
                }
            });
        } else {
            mustPickPlayers.forEach(bot => {
                if (this.gs.topCard.length > 0) {
                    const chosen = [...this.gs.topCard].sort((a,b) => b.power - a.power)[0];
                    this.gs.topCard.splice(this.gs.topCard.findIndex(c => c.id === chosen.id), 1);
                    bot.hand.push(chosen); bot.mustForcePick = false; bot.hasPlayed = true;
                    this.updatePower(bot);
                    this.gs.currentRoundPlays.push({ playerId: bot.id, playerName: bot.name, card: chosen, power: chosen.power, isForcePickPlay: true });
                    this.broadcastLog(`👤 ${bot.name} Mengambil kartu: ${chosen.name} (Power: ${chosen.power})`);
                }
            });
            this.gs.forcePickMode = false;
            this.broadcastGameState();
            setTimeout(() => { this.gs.isHandlingForcePick = false; if (!this.gs.isEndingRound) this.endRound(); }, 500);
        }
    }

    private handlePlayCardInternal(player: GamePlayer, card: Card) {
        this.clearAfkTimer(player);
        if (this.gs.phase === 1) {
            player.hand.splice(player.hand.findIndex(c => c.id === card.id), 1);
            player.hasPlayed = true;
            this.gs.currentProvince = card.province; this.gs.topCard = [card];
            this.updatePower(player);
            this.gs.currentRoundPlays.push({ playerId: player.id, playerName: player.name, card, power: card.power });
            this.broadcastLog(`👤 ${player.name} menjatuhkan ${card.name} (${card.province}) - Power ${card.power}`);
            this.checkWin(player); this.broadcastGameState();
            setTimeout(() => this.startPhase2(), 800);
        } else {
            player.hand.splice(player.hand.findIndex(c => c.id === card.id), 1);
            this.gs.topCard.push(card); player.hasPlayed = true;
            this.updatePower(player);
            this.gs.currentRoundPlays.push({ playerId: player.id, playerName: player.name, card, power: card.power });
            this.broadcastLog(`👤 ${player.name} menjatuhkan ${card.name} - Power ${card.power}`);
            this.checkWin(player); this.broadcastGameState();
            setTimeout(() => this.checkPhase2End(), 500);
        }
    }

    private handleDrawCardInternal(player: GamePlayer) {
        this.clearAfkTimer(player);
        if (this.dealCard(player)) {
            player.mustDraw = false; player.hasPlayed = true;
            this.gs.currentRoundPlays.push({ playerId: player.id, playerName: player.name, card: null, power: 0 });
            this.broadcastLog(`👤 ${player.name} melakukan Draw Card`);
        } else {
            // dealCard mengembalikan false → drawPile habis → mustForcePick sudah di-set
            // Pastikan mustDraw di-clear agar checkPhase2End melihat kondisi yang benar
            player.mustDraw = false;
            this.broadcastLog(`⚠️ ${player.name} gagal Draw - Draw Pile habis → Force Pick`);
        }
        this.broadcastGameState();
        setTimeout(() => this.checkPhase2End(), 500);
    }

    private handleForcePickCardInternal(player: GamePlayer, cardId: string) {
        this.clearAfkTimer(player);
        const card = this.gs.topCard.find(c => c.id === cardId);
        if (!card) return;
        this.gs.topCard.splice(this.gs.topCard.findIndex(c => c.id === cardId), 1);
        player.hand.push(card);
        player.mustForcePick = false;
        player.hasPlayed = true;
        this.updatePower(player);
        this.gs.currentRoundPlays.push({ playerId: player.id, playerName: player.name, card, power: card.power, isForcePickPlay: true });
        this.broadcastLog(`👤 ${player.name} Mengambil kartu: ${card.name} (Power: ${card.power})`);

        this.gs.forcePickPlayers.filter(p => p.isBot && !p.hasPlayed).forEach(bot => {
            if (this.gs.topCard.length > 0) {
                const chosen = [...this.gs.topCard].sort((a,b) => b.power - a.power)[0];
                this.gs.topCard.splice(this.gs.topCard.findIndex(c => c.id === chosen.id), 1);
                bot.hand.push(chosen); bot.mustForcePick = false; bot.hasPlayed = true;
                this.updatePower(bot);
                this.gs.currentRoundPlays.push({ playerId: bot.id, playerName: bot.name, card: chosen, power: chosen.power, isForcePickPlay: true });
                this.broadcastLog(`👤 ${bot.name} Mengambil kartu: ${chosen.name} (Power: ${chosen.power})`);
            }
        });
        this.gs.forcePickMode = false;
        this.broadcastGameState();
        setTimeout(() => { this.gs.isHandlingForcePick = false; if (!this.gs.isEndingRound) this.endRound(); }, 500);
    }

    handlePlayerAction(playerId: string, action: any) {
        const player = this.gs.players.find(p => p.id === playerId);
        if (!player || player.winner || this.gs.gameOver) return;

        if (player.autoMode) {
            player.disconnectedAt = undefined;
            this.broadcastLog(`✅ ${player.name} kembali aktif`);
        }

        if (action.type === 'PLAY_CARD') {
            if (player.hasPlayed || player.isProcessingAction) { return; } // silent ignore — race condition biasa
            const card = player.hand.find(c => c.id === action.cardId);
            if (!card) { this.sendToPlayer(playerId, { type:'ERROR', message:'Kartu tidak ditemukan!' }); return; }
            
            if (this.gs.phase === 1) {
                if (this.gs.phase1Player !== playerId) { this.sendToPlayer(playerId, { type:'ERROR', message:'Bukan giliran Anda di Tahap 1!' }); return; }
            }

            if (this.gs.phase === 2) {
                if (player.mustDraw) { this.sendToPlayer(playerId, { type:'ERROR', message:'Anda harus Draw Card!' }); return; }
                if (card.province !== this.gs.currentProvince) { this.sendToPlayer(playerId, { type:'ERROR', message:`Kartu bukan dari provinsi ${this.gs.currentProvince}!` }); return; }
                if (this.gs.topCard.some(c => c.id === card.id)) { this.sendToPlayer(playerId, { type:'ERROR', message:'Kartu duplikat!' }); return; }
            }
            this.handlePlayCardInternal(player, card);

        } else if (action.type === 'DRAW_CARD') {
            if (!player.mustDraw || player.hasPlayed) { return; } // silent ignore
            this.handleDrawCardInternal(player);
        } else if (action.type === 'FORCE_PICK_CARD') {
            if (!this.gs.forcePickMode) { return; } // silent ignore
            if (!this.gs.forcePickPlayers.some(p => p.id === playerId)) { return; } // silent ignore
            if (player.hasPlayed) { return; } // silent ignore
            if (!this.gs.topCard.find(c => c.id === action.cardId)) { this.sendToPlayer(playerId, { type:'ERROR', message:'Kartu tidak ada di Top Card!' }); return; }
            this.handleForcePickCardInternal(player, action.cardId);
        }
    }

    handleSurrender(playerId: string) {
        const player = this.gs.players.find(p => p.id === playerId);
        if (!player || player.winner || player.isBot || this.gs.gameOver) return;

        // Surrendering player mendapat rank TERBURUK yang belum dipakai.
        // Contoh: 4 pemain, A menang (rank 1), B menyerah pertama → rank 4, C menyerah kedua → rank 3, dst.
        const totalPlayers = this.gs.players.length;
        const takenRanks   = new Set(this.gs.winners.map(w => w.rank));
        let worstRank      = totalPlayers;
        while (worstRank > 0 && takenRanks.has(worstRank)) worstRank--;
        player.rank = worstRank > 0 ? worstRank : totalPlayers;
        player.winner = true;
        this.gs.winners.push(player);

        // Simpan stats langsung saat menyerah — socket masih terbuka, sehingga
        // SAVE_STATS_CLIENT bisa dikirim ke client jika server-save gagal.
        // Flag statsSaved = true (optimistic) mencegah double-save di endGame().
        if (player.userUid && player.userUid !== "BOT") {
            player.statsSaved = true;
            const _p = player;
            savePlayerStats(_p.userUid, _p.name, _p.rank).then(ok => {
                if (!ok) {
                    _p.statsSaved = false;
                    if (_p.socket && _p.socket.readyState === 1) {
                        try { _p.socket.send(JSON.stringify({ type: 'SAVE_STATS_CLIENT', rank: _p.rank })); } catch (_) { /* noop */ }
                    }
                }
            });
        }

        // Kartu player yang menyerah masuk ke discardPile
        this.gs.discardPile.push(...player.hand);
        this.broadcastLog(`🏳️ ${player.name} menyerah! (Peringkat ${player.rank})`);
        player.hand = [];
        player.totalPower = 0;
        player.hasPlayed = true;

        this.broadcastGameState();

        // Cek apakah game harus berakhir
        const remaining = this.getActivePlayers();
        if (remaining.length <= 1) {
            if (remaining.length === 1) {
                const lastOne = remaining[0];
                const totalPlayers = this.gs.players.length;
                const allRanks = Array.from({length: totalPlayers}, (_, i) => i + 1);
                const takenRanksAfterSurrender = this.gs.winners.map(w => w.rank);
                lastOne.rank = allRanks.find(r => !takenRanksAfterSurrender.includes(r)) || 0;
                lastOne.winner = true;
                this.gs.winners.push(lastOne);
                this.broadcastLog(`🏆 ${lastOne.name} menang sebagai Peringkat ${lastOne.rank}!`);
            }
            setTimeout(() => this.endGame(), 1000);
        } else {
            // Game masih berlanjut, pastikan ronde/fase lanjut
            if (this.gs.phase === 2 && !this.gs.isHandlingForcePick && !this.gs.isEndingRound) {
                setTimeout(() => this.checkPhase2End(), 500);
            } else if (this.gs.phase === 1 && this.gs.phase1Player === playerId) {
                // Jika yang menyerah adalah phase1Player, lanjutkan ke system play
                this.gs.phase1Player = null;
                setTimeout(() => this.systemPlayPhase1(), 500);
            }
        }
    }
    private endRound() {
        if (this.gs.isEndingRound) return;
        this.gs.isEndingRound = true;
        this.clearAllAfkTimers();
        this.gs.roundHistory.push({ round: this.gs.round, plays: [...this.gs.currentRoundPlays] });
        this.broadcastLog(`🏁 Ronde ${this.gs.round} selesai`);

        // Tunggu 1500ms agar kartu top card masih terlihat sebelum hilang dengan animasi
        setTimeout(() => {
            this.gs.discardPile.push(...this.gs.topCard);
            this.gs.topCard = []; this.gs.currentProvince = null;
            this.gs.forcePickMode = false; this.gs.forcePickPlayers = [];
            this.broadcastGameState(); // ← trigger zoom-out di client

            const activePlayers = this.getActivePlayers();
            if (activePlayers.length === 0) {
                setTimeout(() => { this.gs.isEndingRound = false; this.endGame(); }, 1000); return;
            }
            if (activePlayers.length === 1) {
                const loser = activePlayers[0];
                // Cari rank terbaik (terkecil) yang belum dipakai, agar tidak tabrakan dengan surrenderer
                const takenRanks = new Set(this.gs.winners.map(w => w.rank));
                let loserRank = this.gs.winners.length + 1;
                while (takenRanks.has(loserRank)) loserRank++;
                loser.rank = loserRank; loser.winner = true;
                this.gs.winners.push(loser);
                this.broadcastLog(`💀 ${loser.name} mendapat peringkat terakhir`);
                setTimeout(() => { this.gs.isEndingRound = false; this.endGame(); }, 1000); return;
            }
            this.gs.round++;
            this.broadcastLog(`🎮 === RONDE ${this.gs.round} DIMULAI ===`);
            setTimeout(() => {
                this.gs.isEndingRound = false; this.gs.isHandlingForcePick = false;
                this.gs.forcePickProcessing = false; this.startPhase1();
            }, 1500);
        }, 1500);
    }

    private endGame() {
        this.gs.gameOver = true;
        this.clearAllAfkTimers();
        // Assign rank untuk pemain yang belum punya rank, hindari tabrakan dengan surrenderer
        const takenRanks = new Set(this.gs.winners.map(w => w.rank));
        let nextRank = this.gs.winners.length + 1;
        this.gs.players.filter(p => !p.winner).forEach(p => {
            while (takenRanks.has(nextRank)) nextRank++;
            p.rank = nextRank;
            takenRanks.add(nextRank);
            nextRank++;
        });
        // Safety net final: pastikan tidak ada pemain dengan rank 0
        let safeMax = Math.max(0, ...this.gs.players.map(p => p.rank));
        this.gs.players.filter(p => p.rank === 0).forEach(p => { p.rank = ++safeMax; });

        this.broadcastToAll({
            type: 'GAME_OVER',
            players: this.gs.players.map(p => ({ id: p.id, name: p.name, rank: p.rank, hand: p.hand, isBot: p.isBot }))
        });

        // Server-side: simpan stats + rank setiap pemain manusia
        // Kirim STATS_SAVED jika berhasil, SAVE_STATS_CLIENT jika gagal (fallback ke client)
        this.gs.players
            .filter(p => !p.isBot && p.userUid && p.userUid !== "BOT" && !p.statsSaved)
            .forEach(p => {
                const sock = p.socket;
                savePlayerStats(p.userUid, p.name, p.rank).then(ok => {
                    // Kirim STATS_SAVED agar client tahu data Firebase sudah update
                    if (sock && sock.readyState === 1) {
                        try {
                            sock.send(JSON.stringify({
                                type: ok ? "STATS_SAVED" : "SAVE_STATS_CLIENT",
                                rank: p.rank
                            }));
                        } catch (_) {}
                    }
                });
            });

        // Beritahu matchmaking: game selesai, room bisa di-cleanup
        if (this.onGameOver) setTimeout(() => this.onGameOver!(), 2000);
    }

    // Dipanggil ketika player secara eksplisit menekan "Kembali ke Home".
    // Jika semua pemain manusia sudah meninggalkan match, langsung cleanup.
    markPlayerLeft(playerId: string): boolean {
        const player = this.gs.players.find(p => p.id === playerId);
        if (!player || player.isBot) return false;
        player.leftMatch = true;

        const humans = this.gs.players.filter(p => !p.isBot);
        const leftCount = humans.filter(p => p.leftMatch).length;
        console.log(`🚪 ${player.name} keluar (${leftCount}/${humans.length} manusia pergi)`);

        if (leftCount >= humans.length) {
            this.cleanupMatch();
            return true; // sinyal ke MatchmakingQueue untuk set status 'finished'
        }
        return false;
    }

    // Dipanggil ketika semua pemain manusia sudah pergi (tidak ada yang menonton).
    // Hentikan semua timer dan tandai game selesai tanpa broadcast.
    cleanupMatch() {
        if (this.gs.gameOver) return;
        this.gs.gameOver = true;
        this.clearAllAfkTimers();
        console.log(`🧹 Match ${this.roomId} dibersihkan (semua pemain manusia telah pergi)`);

        // Safety net: simpan stats pemain manusia yang sudah punya rank tapi belum tersimpan.
        // Kasus: pemain menang (checkWin) lalu langsung LEAVE_MATCH sebelum savePlayerStats selesai,
        // atau koneksi putus sebelum endGame() dipanggil.
        this.gs.players
            .filter(p => !p.isBot && p.userUid && p.userUid !== "BOT" && !p.statsSaved && p.winner && p.rank > 0)
            .forEach(p => {
                p.statsSaved = true;
                savePlayerStats(p.userUid, p.name, p.rank).then(ok => {
                    if (!ok) p.statsSaved = false;
                    console.log(`${ok ? '✅' : '⚠️'} cleanupMatch saveStats uid=${p.userUid} pos=${p.rank}`);
                });
            });
    }

    getFullState() {
        return {
            round: this.gs.round, phase: this.gs.phase, phase1Player: this.gs.phase1Player,
            currentProvince: this.gs.currentProvince, topCard: this.gs.topCard,
            drawPile: this.gs.drawPile.map(c => ({ id: c.id })),
            discardPile: this.gs.discardPile.map(c => ({ id: c.id })),
            forcePickMode: this.gs.forcePickMode,
            forcePickPlayers: this.gs.forcePickPlayers.map(p => ({ id: p.id })),
            forcePickProcessing: this.gs.forcePickProcessing,
            isHandlingForcePick: this.gs.isHandlingForcePick,
            isEndingRound: this.gs.isEndingRound,
            players: this.gs.players.map(p => ({
                id: p.id, name: p.name, isBot: p.isBot, hand: p.hand,
                totalPower: p.totalPower, hasPlayed: p.hasPlayed, mustDraw: p.mustDraw,
                mustForcePick: p.mustForcePick, freed: p.freed, winner: p.winner,
                rank: p.rank, isProcessingAction: p.isProcessingAction,
                autoMode: p.autoMode,
                disconnectedAt: p.disconnectedAt
            })),
            roundHistory: this.gs.roundHistory.slice(-10), // kirim 10 ronde terakhir saja
            winners: this.gs.winners.map(p => ({ id: p.id, name: p.name, rank: p.rank })),
            gameOver: this.gs.gameOver
        };
    }

    broadcastGameState() {
        const state = this.getFullState();
        this.gs.players.forEach(p => {
            if (!p.isBot && p.socket) {
                try { p.socket.send(JSON.stringify({ type: 'GAME_STATE_UPDATE', state })); } catch(e) {}
            }
        });
    }

    private broadcastLog(message: string) {
        console.log(`📝 LOG: ${message}`);
        this.broadcastToAll({ type: 'LOG', message });
    }

    private sendToPlayer(playerId: string, message: any) {
        const p = this.gs.players.find(p => p.id === playerId);
        if (p && !p.isBot && p.socket) { try { p.socket.send(JSON.stringify(message)); } catch(e) {} }
    }

    broadcastToAll(message: any) {
        this.gs.players.forEach(p => {
            if (!p.isBot && p.socket) { try { p.socket.send(JSON.stringify(message)); } catch(e) {} }
        });
    }

    updatePlayerSocket(playerId: string, socket: WebSocket) {
        const p = this.gs.players.find(p => p.id === playerId);
        if (p) { p.socket = socket; console.log(`🔄 Socket updated: ${p.name}`); }
    }

    getPlayerById(playerId: string): GamePlayer | undefined {
        return this.gs.players.find(p => p.id === playerId);
    }

    setPlayerAutoMode(playerId: string, enabled: boolean) {
        const player = this.gs.players.find(p => p.id === playerId);
        if (!player || player.isBot || player.winner) return;

        player.autoMode = enabled;

        if (enabled) {
            player.disconnectedAt = Date.now();
            console.log(`👤 AUTO-MODE ON: ${player.name}`);
            this.broadcastLog(`👤 ${player.name} disconnect - mode otomatis aktif`);
            this.runAutoAction(player);
        } else {
            // Batalkan timer auto-action yang mungkin masih pending
            if (player.autoModeTimerId) {
                clearTimeout(player.autoModeTimerId);
                player.autoModeTimerId = undefined;
            }
            player.disconnectedAt = undefined;
            console.log(`👤 AUTO-MODE OFF: ${player.name}`);
            this.broadcastLog(`✅ ${player.name} kembali ke pertandingan`);
        }
        this.broadcastGameState();
    }

    private runAutoAction(player: GamePlayer) {
        if (!player.autoMode || player.hasPlayed || player.winner || this.gs.gameOver) return;
        // Batalkan timer sebelumnya agar tidak ada duplikasi
        if (player.autoModeTimerId) {
            clearTimeout(player.autoModeTimerId);
            player.autoModeTimerId = undefined;
        }
        const delay = 3000;
        player.autoModeTimerId = setTimeout(() => {
            player.autoModeTimerId = undefined;
            if (!player.autoMode || player.hasPlayed || player.winner || this.gs.gameOver) return;

            // Auto Phase 1
            if (this.gs.phase === 1 && this.gs.phase1Player === player.id && !player.hasPlayed) {
                if (player.hand.length > 0) {
                    const card = [...player.hand].sort((a, b) => a.power - b.power)[0];
                    this.broadcastLog(`👤 AUTO: ${player.name} menjatuhkan ${card.name}`);
                    this.handlePlayCardInternal(player, card);
                }
                return;
            }

            // Auto Phase 2 - Draw Card
            if (this.gs.phase === 2 && player.mustDraw && !player.hasPlayed) {
                this.broadcastLog(`👤 AUTO: ${player.name} Draw Card`);
                this.handleDrawCardInternal(player);
                return;
            }

            // Auto Phase 2 - Play Card
            if (this.gs.phase === 2 && !player.hasPlayed && !player.mustDraw && !player.mustForcePick) {
                const matching = player.hand.filter(c => c.province === this.gs.currentProvince);
                if (matching.length > 0) {
                    const card = matching.sort((a, b) => a.power - b.power)[0];
                    this.broadcastLog(`👤 AUTO: ${player.name} menjatuhkan ${card.name}`);
                    this.handlePlayCardInternal(player, card);
                }
                return;
            }

            // Auto Force Pick
            if (this.gs.phase === 2 && player.mustForcePick && !player.hasPlayed && this.gs.forcePickMode) {
                if (this.gs.topCard.length > 0) {
                    const card = [...this.gs.topCard].sort((a, b) => b.power - a.power)[0];
                    this.broadcastLog(`👤 AUTO: ${player.name} Mengambil kartu: ${card.name}`);
                    this.handleForcePickCardInternal(player, card.id);
                }
                return;
            }
        }, delay) as unknown as number;
    }
}

interface Player {
    id: string;
    name: string;
    socket: WebSocket;
    joinTime: number;
    timeoutId?: number;
    userUid: string;
}

interface GameRoom {
    id: string;
    players: Player[];
    bots: number;
    status: 'starting' | 'playing' | 'finished';
    gameEngine: GameEngine;
    createdAt: number;
    finishedAt?: number;
}

class MatchmakingQueue {
    private queue: Player[] = [];
    private rooms: Map<string, GameRoom> = new Map();
    private readonly MATCH_SIZE = 4;
    private readonly WAIT_TIMEOUT = 30000;

    addPlayer(player: Player) {
        console.log(`✅ ${player.name} masuk antrian. Total: ${this.queue.length + 1}`);
        this.queue.push(player);
        this.queue.forEach(p => {
            try { p.socket.send(JSON.stringify({ type: 'QUEUE_STATUS', message: `Mencari lawan... (${this.queue.length}/4)` })); } catch(e) {}
        });
        this.checkAndCreateMatch();
    }

    private checkAndCreateMatch() {
        if (this.queue.length >= this.MATCH_SIZE) {
            const players = this.queue.splice(0, this.MATCH_SIZE);
            players.forEach(p => {
                if (p.timeoutId) clearTimeout(p.timeoutId);
                try { p.socket.send(JSON.stringify({ type: 'MATCH_STARTING', humans: this.MATCH_SIZE, bots: 0 })); } catch(e) {}
            });
            this.createMatch(players, 0);
        } else if (this.queue.length > 0 && !this.queue[0].timeoutId) {
            this.queue[0].timeoutId = setTimeout(() => this.handleTimeout(), this.WAIT_TIMEOUT) as unknown as number;
        }
    }

    private handleTimeout() {
        if (this.queue.length === 0) return;
        const waitingPlayers = this.queue.splice(0, this.queue.length);
        const botsNeeded = this.MATCH_SIZE - waitingPlayers.length;
        waitingPlayers.forEach(p => {
            if (p.timeoutId) clearTimeout(p.timeoutId);
            try { p.socket.send(JSON.stringify({ type: 'MATCH_STARTING', humans: waitingPlayers.length, bots: botsNeeded })); } catch(e) {}
        });
        this.createMatch(waitingPlayers, botsNeeded);
    }

    private createMatch(players: Player[], botCount: number) {
        const roomId = `room_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
        const gameEngine = new GameEngine(roomId);
        players.forEach(p => gameEngine.addPlayer({ 
            id: p.id, name: p.name, isBot: false, socket: p.socket, userUid: p.userUid 
        }));
        for (let i = 0; i < botCount; i++) gameEngine.addBot(GameEngine.pickBotName());

        const room: GameRoom = { id: roomId, players, bots: botCount, status: 'starting', gameEngine, createdAt: Date.now() };
        this.rooms.set(roomId, room);

        // Callback: tandai room finished saat game over
        gameEngine.onGameOver = () => {
            room.status = 'finished';
            room.finishedAt = Date.now();
            console.log(`🏁 Room ${roomId} selesai - akan di-cleanup dalam 5 menit`);
        };

        setTimeout(() => {
            room.status = 'playing';
            gameEngine.startGame();
            players.forEach(p => {
                try { p.socket.send(JSON.stringify({ type: 'GAME_STARTED', roomId, playerId: p.id, state: gameEngine.getFullState() })); } catch(e) {}
            });
        }, 3000);
    }

    removePlayer(playerId: string) {
        const idx = this.queue.findIndex(p => p.id === playerId);
        if (idx !== -1) {
            const p = this.queue[idx];
            if (p.timeoutId) clearTimeout(p.timeoutId);
            this.queue.splice(idx, 1);
        }
    }

    getRoom(roomId: string) { return this.rooms.get(roomId); }

    rejoinRoom(roomId: string, playerId: string, playerName: string, userUid: string, socket: WebSocket): boolean {
        const room = this.rooms.get(roomId);
        // Izinkan rejoin saat status 'starting' maupun 'playing'
        if (!room || (room.status !== 'playing' && room.status !== 'starting')) return false;

        // Validasi: pastikan userUid cocok dengan player yang punya playerId ini
        const gamePlayer = room.gameEngine.getPlayerById(playerId);
        if (!gamePlayer) return false;
        if (gamePlayer.userUid && gamePlayer.userUid !== userUid) {
            console.log(`🚫 REJOIN DITOLAK: uid tidak cocok. Expected ${gamePlayer.userUid}, got ${userUid}`);
            return false;
        }

        // Bersihkan flag leftMatch agar tidak salah di-cleanup
        gamePlayer.leftMatch = false;

        room.gameEngine.updatePlayerSocket(playerId, socket);
        const rp = room.players.find(p => p.id === playerId);
        if (rp) rp.socket = socket;
        return true;
    }

    // Cleanup room yang sudah 'finished' (5 menit) atau stuck di 'playing'/'starting' (2 jam)
    cleanupFinishedRooms() {
        const now = Date.now();
        const MAX_FINISHED_AGE  = 5 * 60 * 1000;        // 5 menit setelah selesai
        const MAX_PLAYING_AGE   = 2 * 60 * 60 * 1000;   // 2 jam — mencegah memory leak room stuck
        this.rooms.forEach((room, roomId) => {
            if (room.status === 'finished') {
                const finishedTime = room.finishedAt ?? room.createdAt;
                if ((now - finishedTime) > MAX_FINISHED_AGE) {
                    console.log(`🗑️ Cleanup finished room ${roomId}`);
                    this.rooms.delete(roomId);
                }
            } else if ((now - room.createdAt) > MAX_PLAYING_AGE) {
                // Room stuck di 'playing' atau 'starting' lebih dari 2 jam
                console.log(`🗑️ Cleanup stale room ${roomId} (status: ${room.status}, age: ${Math.round((now - room.createdAt)/60000)}m)`);
                try { room.gameEngine.cleanupMatch(); } catch(_) {}
                this.rooms.delete(roomId);
            }
        });
    }

    getStats() {
        const playing = [...this.rooms.values()].filter(r => r.status === 'playing').length;
        const finished = [...this.rooms.values()].filter(r => r.status === 'finished').length;
        return { waiting: this.queue.length, activeRooms: playing, finishedRooms: finished, totalCards: ALL_CARDS.length };
    }

    setPlayerAutoModeInAllRooms(playerId: string, enabled: boolean) {
        this.rooms.forEach((room) => {
            if (room.status === 'playing') {
                // Validasi player benar-benar ada di room ini sebelum ubah auto mode
                const gp = room.gameEngine.getPlayerById(playerId);
                if (gp) room.gameEngine.setPlayerAutoMode(playerId, enabled);
            }
        });
    }
}

const matchmaking = new MatchmakingQueue();
setInterval(() => matchmaking.cleanupFinishedRooms(), 60000);

console.log(`🎮 Card Game Nusantara Server v2`);
console.log(`📦 Total kartu: ${ALL_CARDS.length} (${ALL_PROVINCES.length} provinsi × 5)`);

Deno.serve({ port: parseInt(Deno.env.get("PORT") || "8000") }, async (req) => {
    const url = new URL(req.url);

    if (url.pathname === "/stats") return Response.json(matchmaking.getStats());
    if (url.pathname === "/health") return new Response("OK", { status: 200 });

    if (url.pathname === "/leaderboard") {
        const token = await fbGetToken();
        if (!token) return Response.json({ error: "Firebase not configured" }, { status: 503 });
        const limit = Math.min(parseInt(url.searchParams.get("limit") || "100"), 500);
        const res = await fetch(
            `${FB_DB_URL}/leaderboard.json?orderBy="rankName"&limitToLast=${limit}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) return Response.json({ error: "Failed to fetch leaderboard" }, { status: 502 });
        // deno-lint-ignore no-explicit-any
        const raw: Record<string, any> | null = await res.json();
        if (!raw) return Response.json([]);
        const entries = Object.entries(raw).map(([uid, d]) => ({
            uid, name: d.name, rankName: d.rankName, points: d.points,
            peakRank: d.peakRank, updatedAt: d.updatedAt
        }));
        // Sort: rank index desc, lalu points desc
        entries.sort((a, b) => {
            const ai = RANKS.indexOf(a.rankName ?? "Bronze III");
            const bi = RANKS.indexOf(b.rankName ?? "Bronze III");
            if (bi !== ai) return bi - ai;
            return (b.points ?? 0) - (a.points ?? 0);
        });
        return Response.json(entries.slice(0, limit), {
            headers: { "Access-Control-Allow-Origin": "*" }
        });
    }

    if (req.headers.get("upgrade") === "websocket") {
        const { socket, response } = Deno.upgradeWebSocket(req);
        let currentPlayer: Player | null = null;

        socket.onopen = () => console.log("🔌 New connection");

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log(`📨 [${currentPlayer?.name || 'unknown'}] ${data.type}`);

                switch (data.type) {
                    case 'JOIN_MATCHMAKING':
                        currentPlayer = {
                            id: `player_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
                            name: data.playerName || `Player_${Math.floor(Math.random()*9999)}`,
                            socket, joinTime: Date.now(),
                            userUid: data.userUid || ''
                        };
                        matchmaking.addPlayer(currentPlayer);
                        break;

                    case 'LEAVE_QUEUE':
                        if (currentPlayer) matchmaking.removePlayer(currentPlayer.id);
                        break;

                    case 'PLAY_CARD':
                    case 'DRAW_CARD':
                    case 'FORCE_PICK_CARD':
                        if (currentPlayer && data.roomId) {
                            const room = matchmaking.getRoom(data.roomId);
                            if (room) room.gameEngine.handlePlayerAction(currentPlayer.id, data);
                        }
                        break;

                    case 'SET_AUTO_MODE':
                        if (currentPlayer && data.roomId) {
                            const room = matchmaking.getRoom(data.roomId);
                            if (room) {
                                room.gameEngine.setPlayerAutoMode(currentPlayer.id, data.enabled);
                            }
                        }
                        break;

                    case 'PLAYER_ACTIVE':
                        // Player kembali aktif, matikan auto mode
                        if (currentPlayer && data.roomId) {
                            const room = matchmaking.getRoom(data.roomId);
                            if (room) {
                                room.gameEngine.setPlayerAutoMode(currentPlayer.id, false);
                                const state = room.gameEngine.getFullState();
                                try { socket.send(JSON.stringify({ type: 'GAME_STATE_UPDATE', state })); } catch(e) {}
                            }
                        }
                        break;

                    case 'SURRENDER':
                        if (currentPlayer && data.roomId) {
                            const room = matchmaking.getRoom(data.roomId);
                            if (room) room.gameEngine.handleSurrender(currentPlayer.id);
                        }
                        break;

                    case 'LEAVE_MATCH':
                        // Player secara eksplisit memilih "Kembali ke Home"
                        if (currentPlayer && data.roomId) {
                            const room = matchmaking.getRoom(data.roomId);
                            if (room && room.status === 'playing') {
                                const allLeft = room.gameEngine.markPlayerLeft(currentPlayer.id);
                                if (allLeft) {
                                    room.status = 'finished';
                                    room.finishedAt = Date.now();
                                    console.log(`🏁 Room ${data.roomId} selesai - semua pemain manusia telah pergi`);
                                }
                            }
                        }
                        break;

                    case 'PONG':
                        // Keepalive dari client — tidak ada aksi, abaikan diam-diam
                        break;

                    case 'REJOIN_ROOM':
                        if (data.roomId && data.playerId) {
                            const success = matchmaking.rejoinRoom(
                                data.roomId, data.playerId, data.playerName || 'Player',
                                data.userUid || '',
                                socket
                            );
                            if (success) {
                                currentPlayer = { id: data.playerId, name: data.playerName || 'Player', socket, joinTime: Date.now(), userUid: data.userUid || '' };
                                const room = matchmaking.getRoom(data.roomId);
                                if (room) {
                                    room.gameEngine.setPlayerAutoMode(data.playerId, false);
                                    socket.send(JSON.stringify({ type: 'GAME_STATE_UPDATE', state: room.gameEngine.getFullState() }));
                                    console.log(`🔄 ${data.playerId} rejoined ${data.roomId}`);
                                }
                            } else {
                                // Cek apakah room sudah finished — kirim ulang GAME_OVER agar client bisa simpan stats
                                const finishedRoom = matchmaking.getRoom(data.roomId);
                                if (finishedRoom && finishedRoom.status === 'finished') {
                                    const gp = finishedRoom.gameEngine.getPlayerById(data.playerId);
                                    const uidOk = gp && (!gp.userUid || gp.userUid === (data.userUid || ''));
                                    if (uidOk) {
                                        socket.send(JSON.stringify({
                                            type: 'GAME_OVER',
                                            players: finishedRoom.gameEngine.gs.players.map(p => ({
                                                id: p.id, name: p.name, rank: p.rank, hand: p.hand, isBot: p.isBot
                                            }))
                                        }));
                                        // Kirim SAVE_STATS_CLIENT agar client menyimpan stats sebagai fallback
                                        // (server sudah mencoba simpan saat game selesai, tapi socket lama mungkin sudah putus)
                                        if (gp && gp.rank > 0) {
                                            try {
                                                socket.send(JSON.stringify({ type: 'SAVE_STATS_CLIENT', rank: gp.rank }));
                                            } catch (_) {}
                                        }
                                        console.log(`📤 GAME_OVER dikirim ulang ke ${data.playerId} (late rejoin - room sudah finished)`);
                                    } else {
                                        socket.send(JSON.stringify({ type: 'ERROR', message: 'Akun tidak cocok.' }));
                                    }
                                } else {
                                    socket.send(JSON.stringify({ type: 'ERROR', message: 'Room tidak ditemukan atau sudah berakhir.' }));
                                }
                            }
                        }
                        break;

                    default:
                        console.log(`❓ Unknown: ${data.type}`);
                }
            } catch (error) {
                console.error("❌ Error:", error);
            }
        };

        socket.onclose = () => {
            console.log(`🔌 Disconnected: ${currentPlayer?.name || 'unknown'}`);
            if (currentPlayer) {
                matchmaking.removePlayer(currentPlayer.id);
                // Tunda auto-mode 5 detik agar player punya waktu reconnect
                setTimeout(() => {
                    matchmaking.setPlayerAutoModeInAllRooms(currentPlayer!.id, true);
                }, 5000);
            }
        };

        socket.onerror = (e) => console.error("❌ WS Error:", e);

        return response;
    }

    return new Response(
        `🎮 Card Game Nusantara Server v2\nStats: /stats\nHealth: /health\nTotal Kartu: ${ALL_CARDS.length}`,
        { status: 200, headers: { "Content-Type": "text/plain" } }
    );
});
