export const SERVICE_CATEGORIES_LIST = [
    { value: "GRAPHIC_DESIGN", label: "Desain Grafis & Branding", color: "bg-purple-100 text-purple-700 border-purple-200" },
    { value: "WEB_PROGRAMMING", label: "Web & Pemrograman", color: "bg-blue-100 text-blue-700 border-blue-200" },
    { value: "MOBILE_APPS", label: "Aplikasi Mobile", color: "bg-cyan-100 text-cyan-700 border-cyan-200" },
    { value: "WRITING_TRANSLATION", label: "Penulisan & Penerjemahan", color: "bg-orange-100 text-orange-700 border-orange-200" },
    { value: "VIDEO_ANIMATION", label: "Video & Animasi", color: "bg-rose-100 text-rose-700 border-rose-200" },
    { value: "MUSIC_AUDIO", label: "Musik & Audio", color: "bg-pink-100 text-pink-700 border-pink-200" },
    { value: "DIGITAL_MARKETING", label: "Digital Marketing", color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
    { value: "DATA_ENTRY_ANALYSIS", label: "Data Entry & Analisis", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    { value: "ACADEMIC_TUTORING", label: "Tutor & Akademik", color: "bg-teal-100 text-teal-700 border-teal-200" },
    { value: "BUSINESS_VIRTUAL_ASSISTANT", label: "Bisnis & Virtual Assistant", color: "bg-slate-100 text-slate-700 border-slate-200" },
    { value: "PHOTOGRAPHY", label: "Fotografi & Videografi", color: "bg-sky-100 text-sky-700 border-sky-200" },
    { value: "LIFESTYLE", label: "Gaya Hidup & Hobi", color: "bg-lime-100 text-lime-700 border-lime-200" },
    { value: "AI_SERVICES", label: "AI & Machine Learning", color: "bg-violet-100 text-violet-700 border-violet-200" },
    { value: "OTHER", label: "Lainnya", color: "bg-gray-100 text-gray-700 border-gray-200" },
];

export const CATEGORY_LABELS: Record<string, string> = {
    ...Object.fromEntries(SERVICE_CATEGORIES_LIST.map(c => [c.value, c.label])),
    // Legacy Mappings
    DESIGN: "Desain Grafis (Legacy)",
    DATA: "Data & Analisis (Legacy)",
    CODING: "Pemrograman (Legacy)",
    WRITING: "Penulisan (Legacy)",
    EVENT: "Event Organizer (Legacy)",
    TUTOR: "Tutor (Legacy)",
    TECHNICAL: "Teknis (Legacy)",
};

export const CATEGORY_COLORS: Record<string, string> = {
    ...Object.fromEntries(SERVICE_CATEGORIES_LIST.map(c => [c.value, c.color])),
    // Legacy Mappings
    DESIGN: "bg-purple-100 text-purple-700 border-purple-200",
    DATA: "bg-emerald-100 text-emerald-700 border-emerald-200",
    CODING: "bg-blue-100 text-blue-700 border-blue-200",
    WRITING: "bg-orange-100 text-orange-700 border-orange-200",
    EVENT: "bg-pink-100 text-pink-700 border-pink-200",
    TUTOR: "bg-teal-100 text-teal-700 border-teal-200",
    TECHNICAL: "bg-red-100 text-red-700 border-red-200",
};
