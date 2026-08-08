import React, { useState, useEffect, useRef } from 'react';

// --- Icons ---
const UploadCloudIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/><polyline points="16 16 12 12 8 16"/></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
const EyeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const LangIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
const PlayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>;
const PauseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>;
const CoffeeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>;
const CopyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
const AlertTriangleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const BriefcaseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>;
const ZapIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const XCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>;
const Trash2Icon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>;
const SparklesIcon = ({ className, style }) => <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>;
const Wand2Icon = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/></svg>;

// --- New Icons for Upload Zone ---
const FilePlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>;
const FolderPlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>;
const FileJsonIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M10 12a1 1 0 0 0-1 1v1a1 1 0 0 1-1 1 1 1 0 0 1 1 1v1a1 1 0 0 0 1 1"/><path d="M14 18a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1 1 1 0 0 1-1-1v-1a1 1 0 0 0-1-1"/></svg>;
const FileTextIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>;

const ADOBE_CATEGORIES = [
  { id: '1', en: 'Animals', id_lang: 'Hewan' }, { id: '2', en: 'Buildings and Architecture', id_lang: 'Bangunan & Arsitektur' },
  { id: '3', en: 'Business', id_lang: 'Bisnis' }, { id: '4', en: 'Drinks', id_lang: 'Minuman' },
  { id: '5', en: 'The Environment', id_lang: 'Lingkungan' }, { id: '6', en: 'States of Mind', id_lang: 'Perasaan & Emosi' },
  { id: '7', en: 'Food', id_lang: 'Makanan' }, { id: '8', en: 'Graphic Resources', id_lang: 'Sumber Grafis' },
  { id: '9', en: 'Hobbies and Leisure', id_lang: 'Hobi & Liburan' }, { id: '10', en: 'Industry', id_lang: 'Industri' },
  { id: '11', en: 'Landscapes', id_lang: 'Pemandangan' }, { id: '12', en: 'Lifestyle', id_lang: 'Gaya Hidup' },
  { id: '13', en: 'People', id_lang: 'Orang' }, { id: '14', en: 'Plants and Flowers', id_lang: 'Tanaman & Bunga' },
  { id: '15', en: 'Culture and Religion', id_lang: 'Budaya & Agama' }, { id: '16', en: 'Science', id_lang: 'Sains' },
  { id: '17', en: 'Social Issues', id_lang: 'Isu Sosial' }, { id: '18', en: 'Sports', id_lang: 'Olahraga' },
  { id: '19', en: 'Technology', id_lang: 'Teknologi' }, { id: '20', en: 'Transport', id_lang: 'Transportasi' },
  { id: '21', en: 'Travel', id_lang: 'Wisata' }
];

const SHUTTERSTOCK_IMAGE_VECTOR_CATEGORIES = [
  { id: 'Abstract', en: 'Abstract', id_lang: 'Abstrak' }, { id: 'Animals/Wildlife', en: 'Animals/Wildlife', id_lang: 'Hewan/Margasatwa' },
  { id: 'Art', en: 'Art', id_lang: 'Seni' }, { id: 'Backgrounds/Textures', en: 'Backgrounds/Textures', id_lang: 'Latar Belakang/Tekstur' },
  { id: 'Beauty/Fashion', en: 'Beauty/Fashion', id_lang: 'Kecantikan/Fashion' }, { id: 'Buildings/Landmarks', en: 'Buildings/Landmarks', id_lang: 'Bangunan/Landmark' },
  { id: 'Business/Finance', en: 'Business/Finance', id_lang: 'Bisnis/Keuangan' }, { id: 'Celebrities', en: 'Celebrities', id_lang: 'Selebriti' },
  { id: 'Education', en: 'Education', id_lang: 'Pendidikan' }, { id: 'Food and drink', en: 'Food and drink', id_lang: 'Makanan dan Minuman' },
  { id: 'Healthcare/Medical', en: 'Healthcare/Medical', id_lang: 'Kesehatan/Medis' }, { id: 'Holidays', en: 'Holidays', id_lang: 'Hari Libur' },
  { id: 'Industrial', en: 'Industrial', id_lang: 'Industri' }, { id: 'Interiors', en: 'Interiors', id_lang: 'Interior' },
  { id: 'Miscellaneous', en: 'Miscellaneous', id_lang: 'Lain-lain' }, { id: 'Nature', en: 'Nature', id_lang: 'Alam' },
  { id: 'Parks/Outdoor', en: 'Parks/Outdoor', id_lang: 'Taman/Luar Ruangan' }, { id: 'People', en: 'People', id_lang: 'Orang' },
  { id: 'Religion', en: 'Religion', id_lang: 'Agama' }, { id: 'Science', en: 'Science', id_lang: 'Sains' },
  { id: 'Signs/Symbols', en: 'Signs/Symbols', id_lang: 'Tanda/Simbol' }, { id: 'Sports/Recreation', en: 'Sports/Recreation', id_lang: 'Olahraga/Rekreasi' },
  { id: 'Technology', en: 'Technology', id_lang: 'Teknologi' }, { id: 'Transportation', en: 'Transportation', id_lang: 'Transportasi' },
  { id: 'Vintage', en: 'Vintage', id_lang: 'Vintage' }
];

const SHUTTERSTOCK_VIDEO_CATEGORIES = [
  { id: 'Animals/Wildlife', en: 'Animals/Wildlife', id_lang: 'Hewan/Satwa Liar' }, { id: 'Art', en: 'Art', id_lang: 'Seni' },
  { id: 'Backgrounds/Textures', en: 'Backgrounds/Textures', id_lang: 'Latar Belakang/Tekstur' }, { id: 'Buildings/Landmarks', en: 'Buildings/Landmarks', id_lang: 'Bangunan/Tengara' },
  { id: 'Business/Finance', en: 'Business/Finance', id_lang: 'Bisnis/Keuangan' }, { id: 'Education', en: 'Education', id_lang: 'Pendidikan' },
  { id: 'Food and drink', en: 'Food and drink', id_lang: 'Makanan dan Minuman' }, { id: 'Health Care', en: 'Health Care', id_lang: 'Kesehatan' },
  { id: 'Holidays', en: 'Holidays', id_lang: 'Liburan' }, { id: 'Industrial', en: 'Industrial', id_lang: 'Industri' },
  { id: 'Nature', en: 'Nature', id_lang: 'Alam' }, { id: 'Objects', en: 'Objects', id_lang: 'Objek' },
  { id: 'People', en: 'People', id_lang: 'Orang' }, { id: 'Religion', en: 'Religion', id_lang: 'Agama' },
  { id: 'Science', en: 'Science', id_lang: 'Sains' }, { id: 'Signs/Symbols', en: 'Signs/Symbols', id_lang: 'Tanda/Simbol' },
  { id: 'Sports/Recreation', en: 'Sports/Recreation', id_lang: 'Olahraga/Rekreasi' }, { id: 'Technology', en: 'Technology', id_lang: 'Teknologi' },
  { id: 'Transportation', en: 'Transportation', id_lang: 'Transportasi' }
];

const DREAMSTIME_CATEGORIES = [
  { id: '211', en: 'Abstract -> Aerial', id_lang: 'Abstrak -> Udara' }, { id: '112', en: 'Abstract -> Backgrounds', id_lang: 'Abstrak -> Latar Belakang' },
  { id: '39', en: 'Abstract -> Blurs', id_lang: 'Abstrak -> Blur' }, { id: '164', en: 'Abstract -> Colors', id_lang: 'Abstrak -> Warna' },
  { id: '40', en: 'Abstract -> Competition', id_lang: 'Abstrak -> Kompetisi' }, { id: '41', en: 'Abstract -> Craftsmanship', id_lang: 'Abstrak -> Kerajinan' },
  { id: '42', en: 'Abstract -> Danger', id_lang: 'Abstrak -> Bahaya' }, { id: '43', en: 'Abstract -> Exploration', id_lang: 'Abstrak -> Eksplorasi' },
  { id: '158', en: 'Abstract -> Fun', id_lang: 'Abstrak -> Kesenangan' }, { id: '44', en: 'Abstract -> Help', id_lang: 'Abstrak -> Bantuan' },
  { id: '149', en: 'Abstract -> Love', id_lang: 'Abstrak -> Cinta' }, { id: '45', en: 'Abstract -> Luxury', id_lang: 'Abstrak -> Kemewahan' },
  { id: '187', en: 'Abstract -> Mobile', id_lang: 'Abstrak -> Seluler' }, { id: '46', en: 'Abstract -> Peace', id_lang: 'Abstrak -> Kedamaian' },
  { id: '165', en: 'Abstract -> Planetarium', id_lang: 'Abstrak -> Planetarium' }, { id: '47', en: 'Abstract -> Power', id_lang: 'Abstrak -> Kekuatan' },
  { id: '48', en: 'Abstract -> Purity', id_lang: 'Abstrak -> Kemurnian' }, { id: '128', en: 'Abstract -> Religion', id_lang: 'Abstrak -> Agama' },
  { id: '155', en: 'Abstract -> Seasonal & Holiday', id_lang: 'Abstrak -> Musiman & Liburan' }, { id: '49', en: 'Abstract -> Security', id_lang: 'Abstrak -> Keamanan' },
  { id: '50', en: 'Abstract -> Sports', id_lang: 'Abstrak -> Olahraga' }, { id: '51', en: 'Abstract -> Stress', id_lang: 'Abstrak -> Stres' },
  { id: '52', en: 'Abstract -> Success', id_lang: 'Abstrak -> Kesuksesan' }, { id: '53', en: 'Abstract -> Teamwork', id_lang: 'Abstrak -> Kerja Tim' },
  { id: '141', en: 'Abstract -> Textures', id_lang: 'Abstrak -> Tekstur' }, { id: '54', en: 'Abstract -> Unique', id_lang: 'Abstrak -> Unik' },
  { id: '31', en: 'Animals -> Birds', id_lang: 'Hewan -> Burung' }, { id: '33', en: 'Animals -> Farm', id_lang: 'Hewan -> Peternakan' },
  { id: '36', en: 'Animals -> Insects', id_lang: 'Hewan -> Serangga' }, { id: '32', en: 'Animals -> Mammals', id_lang: 'Hewan -> Mamalia' },
  { id: '34', en: 'Animals -> Marine life', id_lang: 'Hewan -> Biota Laut' }, { id: '30', en: 'Animals -> Pets', id_lang: 'Hewan -> Peliharaan' },
  { id: '35', en: 'Animals -> Reptiles & Amphibians', id_lang: 'Hewan -> Reptil & Amfibi' }, { id: '37', en: 'Animals -> Rodents', id_lang: 'Hewan -> Hewan Pengerat' },
  { id: '168', en: 'Animals -> Wildlife', id_lang: 'Hewan -> Satwa Liar' }, { id: '124', en: 'Arts & Architecture -> Details', id_lang: 'Seni & Arsitektur -> Detail' },
  { id: '71', en: 'Arts & Architecture -> Generic architecture', id_lang: 'Seni & Arsitektur -> Arsitektur Umum' }, { id: '132', en: 'Arts & Architecture -> Historic buildings', id_lang: 'Seni & Arsitektur -> Bangunan Bersejarah' },
  { id: '153', en: 'Arts & Architecture -> Home', id_lang: 'Seni & Arsitektur -> Rumah' }, { id: '73', en: 'Arts & Architecture -> Indoor', id_lang: 'Seni & Arsitektur -> Dalam Ruangan' },
  { id: '70', en: 'Arts & Architecture -> Landmarks', id_lang: 'Seni & Arsitektur -> Tengara' }, { id: '131', en: 'Arts & Architecture -> Modern buildings', id_lang: 'Seni & Arsitektur -> Bangunan Modern' },
  { id: '130', en: 'Arts & Architecture -> Night scenes', id_lang: 'Seni & Arsitektur -> Pemandangan Malam' }, { id: '72', en: 'Arts & Architecture -> Outdoor', id_lang: 'Seni & Arsitektur -> Luar Ruangan' },
  { id: '174', en: 'Arts & Architecture -> Ruins & Ancient', id_lang: 'Seni & Arsitektur -> Reruntuhan & Kuno' }, { id: '154', en: 'Arts & Architecture -> Work places', id_lang: 'Seni & Arsitektur -> Tempat Kerja' },
  { id: '79', en: 'Business -> Communications', id_lang: 'Bisnis -> Komunikasi' }, { id: '78', en: 'Business -> Computers', id_lang: 'Bisnis -> Komputer' },
  { id: '80', en: 'Business -> Finance', id_lang: 'Bisnis -> Keuangan' }, { id: '77', en: 'Business -> Industries', id_lang: 'Bisnis -> Industri' },
  { id: '83', en: 'Business -> Metaphors', id_lang: 'Bisnis -> Metafora' }, { id: '84', en: 'Business -> Objects', id_lang: 'Bisnis -> Objek' },
  { id: '75', en: 'Business -> People', id_lang: 'Bisnis -> Orang' }, { id: '81', en: 'Business -> Still-life', id_lang: 'Bisnis -> Benda Mati' },
  { id: '76', en: 'Business -> Teams', id_lang: 'Bisnis -> Tim' }, { id: '82', en: 'Business -> Transportation', id_lang: 'Bisnis -> Transportasi' },
  { id: '85', en: 'Business -> Travel', id_lang: 'Bisnis -> Wisata' }, { id: '178', en: 'Editorial -> Celebrities', id_lang: 'Editorial -> Selebriti' },
  { id: '185', en: 'Editorial -> Commercial', id_lang: 'Editorial -> Komersial' }, { id: '179', en: 'Editorial -> Events', id_lang: 'Editorial -> Acara' },
  { id: '184', en: 'Editorial -> Landmarks', id_lang: 'Editorial -> Landmark' }, { id: '180', en: 'Editorial -> People', id_lang: 'Editorial -> Orang' },
  { id: '181', en: 'Editorial -> Politics', id_lang: 'Editorial -> Politik' }, { id: '182', en: 'Editorial -> Sports', id_lang: 'Editorial -> Olahraga' },
  { id: '183', en: 'Editorial -> Weather & Environment', id_lang: 'Editorial -> Cuaca & Lingkungan' }, { id: '204', en: 'Holidays -> Chinese New Year', id_lang: 'Liburan -> Tahun Baru Imlek' },
  { id: '190', en: 'Holidays -> Christmas', id_lang: 'Liburan -> Natal' }, { id: '207', en: 'Holidays -> Cinco de Mayo', id_lang: 'Liburan -> Cinco de Mayo' },
  { id: '203', en: 'Holidays -> Diwali', id_lang: 'Liburan -> Diwali' }, { id: '193', en: 'Holidays -> Easter', id_lang: 'Liburan -> Paskah' },
  { id: '196', en: 'Holidays -> Fathers Day', id_lang: 'Liburan -> Hari Ayah' }, { id: '192', en: 'Holidays -> Halloween', id_lang: 'Liburan -> Halloween' },
  { id: '208', en: 'Holidays -> Hanukkah', id_lang: 'Liburan -> Hanukkah' }, { id: '206', en: 'Holidays -> Mardi Gras', id_lang: 'Liburan -> Mardi Gras' },
  { id: '195', en: 'Holidays -> Mothers Day', id_lang: 'Liburan -> Hari Ibu' }, { id: '189', en: 'Holidays -> New Years', id_lang: 'Liburan -> Tahun Baru' },
  { id: '202', en: 'Holidays -> Other', id_lang: 'Liburan -> Lainnya' }, { id: '205', en: 'Holidays -> Ramadan', id_lang: 'Liburan -> Ramadan' },
  { id: '191', en: 'Holidays -> Thanksgiving', id_lang: 'Liburan -> Thanksgiving' }, { id: '194', en: 'Holidays -> Valentines Day', id_lang: 'Liburan -> Hari Valentine' },
  { id: '210', en: 'IT & C -> Artificial Intelligence', id_lang: 'TI & K -> Kecerdasan Buatan' }, { id: '110', en: 'IT & C -> Connectivity', id_lang: 'TI & K -> Konektivitas' },
  { id: '113', en: 'IT & C -> Equipment', id_lang: 'TI & K -> Peralatan' }, { id: '111', en: 'IT & C -> Internet', id_lang: 'TI & K -> Internet' },
  { id: '109', en: 'IT & C -> Networking', id_lang: 'TI & K -> Jaringan' }, { id: '212', en: 'Illustrations & Clipart -> AI generated', id_lang: 'Ilustrasi & Clipart -> Buatan AI' },
  { id: '166', en: 'Illustrations & Clipart -> 3D & Computer generated', id_lang: 'Ilustrasi & Clipart -> 3D & Buatan Komputer' }, { id: '167', en: 'Illustrations & Clipart -> Hand drawn & Artistic', id_lang: 'Ilustrasi & Clipart -> Gambar Tangan & Artistik' },
  { id: '163', en: 'Illustrations & Clipart -> Illustrations', id_lang: 'Ilustrasi & Clipart -> Ilustrasi' }, { id: '186', en: 'Illustrations & Clipart -> Vector', id_lang: 'Ilustrasi & Clipart -> Vektor' },
  { id: '101', en: 'Industries -> Agriculture', id_lang: 'Industri -> Pertanian' }, { id: '89', en: 'Industries -> Architecture', id_lang: 'Industri -> Arsitektur' },
  { id: '87', en: 'Industries -> Banking', id_lang: 'Industri -> Perbankan' }, { id: '93', en: 'Industries -> Cargo & Shipping', id_lang: 'Industri -> Kargo & Pengiriman' },
  { id: '94', en: 'Industries -> Communications', id_lang: 'Industri -> Komunikasi' }, { id: '91', en: 'Industries -> Computers', id_lang: 'Industri -> Komputer' },
  { id: '90', en: 'Industries -> Construction', id_lang: 'Industri -> Konstruksi' }, { id: '150', en: 'Industries -> Education', id_lang: 'Industri -> Pendidikan' },
  { id: '136', en: 'Industries -> Entertainment', id_lang: 'Industri -> Hiburan' }, { id: '99', en: 'Industries -> Environment', id_lang: 'Industri -> Lingkungan' },
  { id: '127', en: 'Industries -> Food & Beverages', id_lang: 'Industri -> Makanan & Minuman' }, { id: '92', en: 'Industries -> Healthcare & Medical', id_lang: 'Industri -> Kesehatan & Medis' },
  { id: '96', en: 'Industries -> Insurance', id_lang: 'Industri -> Asuransi' }, { id: '95', en: 'Industries -> Legal', id_lang: 'Industri -> Hukum' },
  { id: '100', en: 'Industries -> Manufacturing', id_lang: 'Industri -> Manufaktur' }, { id: '102', en: 'Industries -> Military', id_lang: 'Industri -> Militer' },
  { id: '161', en: 'Industries -> Oil and gas', id_lang: 'Industri -> Minyak dan Gas' }, { id: '97', en: 'Industries -> Power and energy', id_lang: 'Industri -> Tenaga dan Energi' },
  { id: '157', en: 'Industries -> Sports', id_lang: 'Industri -> Olahraga' }, { id: '98', en: 'Industries -> Transportation', id_lang: 'Industri -> Transportasi' },
  { id: '88', en: 'Industries -> Travel', id_lang: 'Industri -> Wisata' }, { id: '22', en: 'Nature -> Clouds and skies', id_lang: 'Alam -> Awan shell -> Langit' },
  { id: '17', en: 'Nature -> Deserts', id_lang: 'Alam -> Gurun' }, { id: '14', en: 'Nature -> Details', id_lang: 'Alam -> Detail' },
  { id: '27', en: 'Nature -> Fields & Meadows', id_lang: 'Alam -> Ladang & Padang Rumput' }, { id: '25', en: 'Nature -> Flowers & Gardens', id_lang: 'Alam -> Bunga & Taman' },
  { id: '28', en: 'Nature -> Food ingredients', id_lang: 'Alam -> Bahan Makanan' }, { id: '18', en: 'Nature -> Forests', id_lang: 'Alam -> Hutan' },
  { id: '137', en: 'Nature -> Fruits & Vegetables', id_lang: 'Alam -> Buah & Sayuran' }, { id: '11', en: 'Nature -> Generic vegetation', id_lang: 'Alam -> Vegetasi Umum' },
  { id: '143', en: 'Nature -> Geologic and mineral', id_lang: 'Alam -> Geologi dan Mineral' }, { id: '16', en: 'Nature -> Lakes and rivers', id_lang: 'Alam -> Danau dan Sungai' },
  { id: '146', en: 'Nature -> Landscapes', id_lang: 'Alam -> Lanskap' }, { id: '15', en: 'Nature -> Mountains', id_lang: 'Alam -> Pegunungan' },
  { id: '12', en: 'Nature -> Plants and trees', id_lang: 'Alam -> Tanaman dan Pohon' }, { id: '19', en: 'Nature -> Sea & Ocean', id_lang: 'Alam -> Laut & Samudra' },
  { id: '26', en: 'Nature -> Seasons specific', id_lang: 'Alam -> Musim Tertentu' }, { id: '23', en: 'Nature -> Sunsets & Sunrises', id_lang: 'Alam -> Matahari Terbenam & Terbit' },
  { id: '20', en: 'Nature -> Tropical', id_lang: 'Alam -> Tropis' }, { id: '171', en: 'Nature -> Water', id_lang: 'Alam -> Air' },
  { id: '24', en: 'Nature -> Waterfalls', id_lang: 'Alam -> Air Terjun' }, { id: '142', en: 'Objects -> Clothing & Accessories', id_lang: 'Objek -> Pakaian & Aksesori' },
  { id: '147', en: 'Objects -> Electronics', id_lang: 'Objek -> Elektronik' }, { id: '138', en: 'Objects -> Home related', id_lang: 'Objek -> Terkait Rumah' },
  { id: '135', en: 'Objects -> Isolated', id_lang: 'Objek -> Terisolasi' }, { id: '151', en: 'Objects -> Music and sound', id_lang: 'Objek -> Musik dan Suara' },
  { id: '145', en: 'Objects -> Other', id_lang: 'Objek -> Lainnya' }, { id: '152', en: 'Objects -> Retro', id_lang: 'Objek -> Retro' },
  { id: '156', en: 'Objects -> Sports', id_lang: 'Objek -> Olahraga' }, { id: '144', en: 'Objects -> Still life', id_lang: 'Objek -> Benda Mati' },
  { id: '140', en: 'Objects -> Tools', id_lang: 'Objek -> Perkakas' }, { id: '134', en: 'Objects -> Toys', id_lang: 'Objek -> Mainan' },
  { id: '123', en: 'People -> Active', id_lang: 'Orang -> Aktif' }, { id: '139', en: 'People -> Body parts', id_lang: 'Orang -> Bagian Tubuh' },
  { id: '119', en: 'People -> Children', id_lang: 'Orang -> Anak-anak' }, { id: '175', en: 'People -> Cosmetic & Makeup', id_lang: 'Orang -> Kosmetik & Makeup' },
  { id: '115', en: 'People -> Couples', id_lang: 'Orang -> Pasangan' }, { id: '122', en: 'People -> Diversity', id_lang: 'Orang -> Keberagaman' },
  { id: '159', en: 'People -> Expressions', id_lang: 'Orang -> Ekspresi' }, { id: '118', en: 'People -> Families', id_lang: 'Orang -> Keluarga' },
  { id: '117', en: 'People -> Men', id_lang: 'Orang -> Pria' }, { id: '173', en: 'People -> Nudes', id_lang: 'Orang -> Telanjang' },
  { id: '162', en: 'People -> Portraits', id_lang: 'Orang -> Potret' }, { id: '121', en: 'People -> Seniors', id_lang: 'Orang -> Lansia' },
  { id: '120', en: 'People -> Teens', id_lang: 'Orang -> Remaja' }, { id: '116', en: 'People -> Women', id_lang: 'Orang -> Wanita' },
  { id: '160', en: 'People -> Workers', id_lang: 'Orang -> Pekerja' }, { id: '105', en: 'Technology -> Computers', id_lang: 'Teknologi -> Komputer' },
  { id: '106', en: 'Technology -> Connections', id_lang: 'Teknologi -> Koneksi' }, { id: '129', en: 'Technology -> Electronics', id_lang: 'Teknologi -> Elektronik' },
  { id: '148', en: 'Technology -> Other', id_lang: 'Teknologi -> Lainnya' }, { id: '107', en: 'Technology -> Retro', id_lang: 'Teknologi -> Retro' },
  { id: '209', en: 'Technology -> Science', id_lang: 'Teknologi -> Sains' }, { id: '104', en: 'Technology -> Telecommunications', id_lang: 'Teknologi -> Telekomunikasi' },
  { id: '56', en: 'Travel -> Africa', id_lang: 'Wisata -> Afrika' }, { id: '58', en: 'Travel -> America', id_lang: 'Wisata -> Amerika' },
  { id: '176', en: 'Travel -> Antarctica', id_lang: 'Wisata -> Antartika' }, { id: '65', en: 'Travel -> Arts & Architecture', id_lang: 'Wisata -> Seni & Arsitektur' },
  { id: '57', en: 'Travel -> Asia', id_lang: 'Wisata -> Asia' }, { id: '60', en: 'Travel -> Australasian', id_lang: 'Wisata -> Australasia' },
  { id: '62', en: 'Travel -> Cruise', id_lang: 'Wisata -> Pelayaran' }, { id: '63', en: 'Travel -> Cuisine', id_lang: 'Wisata -> Kuliner' },
  { id: '67', en: 'Travel -> Currencies', id_lang: 'Wisata -> Mata Uang' }, { id: '61', en: 'Travel -> Destination scenics', id_lang: 'Wisata -> Pemandangan Destinasi' },
  { id: '59', en: 'Travel -> Europe', id_lang: 'Wisata -> Eropa' }, { id: '68', en: 'Travel -> Flags', id_lang: 'Wisata -> Bendera' },
  { id: '64', en: 'Travel -> Resorts', id_lang: 'Wisata -> Resor' }, { id: '66', en: 'Travel -> Tropical', id_lang: 'Wisata -> Tropis' },
  { id: '201', en: 'Web Design Graphics -> Banners', id_lang: 'Grafis Desain Web -> Spanduk' }, { id: '200', en: 'Web Design Graphics -> Buttons', id_lang: 'Grafis Desain Web -> Tombol' },
  { id: '199', en: 'Web Design Graphics -> Web Backgrounds & Textures', id_lang: 'Grafis Desain Web -> Latar Belakang & Tekstur Web' }, { id: '198', en: 'Web Design Graphics -> Web Icons', id_lang: 'Grafis Desain Web -> Ikon Web' }
];

const VCG_CATEGORIES = [
  { id: '1', zh: '未分类', en: 'Uncategorized', id_lang: 'Belum Dikategorikan' },
  { id: '2', zh: '动物', en: 'Animals', id_lang: 'Hewan' },
  { id: '3', zh: '黑白', en: 'Black and White', id_lang: 'Hitam Putih' },
  { id: '4', zh: '城市风光', en: 'Cityscape/Urban Scenery', id_lang: 'Pemandangan Kota' },
  { id: '5', zh: '时尚', en: 'Fashion', id_lang: 'Fashion' },
  { id: '6', zh: '极简抽象', en: 'Minimalist Abstract', id_lang: 'Abstrak Minimalis' },
  { id: '7', zh: '植物', en: 'Plants', id_lang: 'Tanaman' },
  { id: '8', zh: '微距', en: 'Macro', id_lang: 'Makro' },
  { id: '9', zh: '肖像', en: 'Portrait', id_lang: 'Potret' },
  { id: '10', zh: '舞台演出', en: 'Stage Performance', id_lang: 'Pertunjukan Panggung' },
  { id: '11', zh: '静物（美食）', en: 'Still Life (Food)', id_lang: 'Benda Mati (Makanan)' },
  { id: '12', zh: '水下', en: 'Underwater', id_lang: 'Bawah Air' },
  { id: '13', zh: '建筑', en: 'Architecture', id_lang: 'Arsitektur' },
  { id: '14', zh: '自然风光', en: 'Natural Scenery', id_lang: 'Pemandangan Alam' },
  { id: '15', zh: '人文纪实', en: 'Humanities/Documentary', id_lang: 'Dokumenter/Humaniora' },
  { id: '16', zh: '航拍', en: 'Aerial Photography', id_lang: 'Fotografi Udara' },
  { id: '17', zh: '夜景', en: 'Night Scene', id_lang: 'Pemandangan Malam' }
];

const PLATFORMS = ['Adobe Stock', 'Shutterstock', 'Dreamstime', 'MiriCanvas', '500px (VCG)', 'Arab Stock', 'Export Backup Progress', 'Export All (ZIP)'];
const UPLOAD_MODES = ['File', 'Folder', 'EPS', 'AI', 'Import Backup'];
const DEFAULT_NEGATIVE = "Apple, Samsung, Nike, Adidas, Gucci, Rolex, Coca-Cola, Pepsi, Disney, Lego, Microsoft, Google, Sony, Nikon, Canon, Facebook, Instagram, Twitter, TikTok, iPhone, iPad, Galaxy, Eiffel Tower Night, Hollywood Sign, Red Cross, Olympic Rings, United Nations, Vatican City, 4K, HD, High Quality, Award Winning, Best, Professional, Photo, Image, Shot on, Shot with, Watermark, Logo, Signature, Copyright, Trademark, Brand, Patent, Patent Pending, All Rights Reserved, Blurred, Out of focus, Grainy, Noisy, Low resolution, Porn, Sex, Nude, Violence, Bloody, Israel, North Korea, Crimea, Restricted Area, Top Secret";
const apiKey = ""; 

// --- POS SATPAM: Load Balancer Server Hugging Face ---
const HF_CONVERTER_URLS = [
  "https://isasatu-isa-converter1.hf.space",
  "https://isadua-isa-converter2.hf.space",
  "https://isatiga-isa-converter3.hf.space",
  "https://isaempat-isa-converter4.hf.space",
  "https://isalimaa-isa-converter5.hf.space",
  "https://isaenam-isahconverter6.hf.space"
];

// --- ALAT BANTU ZIP (Dinamis) ---
const loadJSZip = () => {
  return new Promise((resolve, reject) => {
    if (window.JSZip) return resolve(window.JSZip);
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    script.onload = () => resolve(window.JSZip);
    script.onerror = () => reject(new Error('Gagal memuat JSZip'));
    document.body.appendChild(script);
  });
};

const isVectorExt = (filename) => /\.(ai|eps|svg|pdf)$/i.test(filename);
const isVideoFile = (filename) => /\.(mp4|mov|avi|mkv)$/i.test(filename);

const handleCopy = (text) => {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  try { document.execCommand('copy'); } catch (err) {}
  document.body.removeChild(textArea);
};

const calculateTargetSize = (width, height) => {
  const MAX_DIM = 800;
  let targetWidth = width;
  let targetHeight = height;
  if (width > MAX_DIM || height > MAX_DIM) {
    if (width > height) {
      targetWidth = MAX_DIM;
      targetHeight = Math.round((height / width) * MAX_DIM);
    } else {
      targetHeight = MAX_DIM;
      targetWidth = Math.round((width / height) * MAX_DIM);
    }
  }
  return { targetWidth, targetHeight };
};

// --- FUNGSI LOAD BALANCER & KONVERTER ASINKRON ---
const convertVectorWithFallback = async (fileObj, signal) => {
  // Dinamis: Mengocok URL agar beban terbagi rata secara acak ke seluruh server
  const urls = [...HF_CONVERTER_URLS].sort(() => Math.random() - 0.5);
  const formData = new FormData();
  formData.append('file', fileObj);

  for (const baseUrl of urls) {
    if (signal?.aborted) break;
    try {
      const res = await fetch(`${baseUrl}/convert`, {
        method: 'POST',
        body: formData,
        signal
      });
      if (res.ok) {
        const blob = await res.blob();
        return URL.createObjectURL(blob);
      }
    } catch (err) {
      // Abaikan dan coba URL server cadangan berikutnya
    }
  }
  return null; // Semua server gagal atau digagalkan
};

const extractDataJIT = async (fileItem, numFrames, signal) => {
  return new Promise(async (resolve, reject) => {
    const checkAbort = () => {
      if (signal?.aborted) {
        reject(new DOMException('Aborted', 'AbortError'));
        return true;
      }
      return false;
    };
    if (checkAbort()) return;

    const onAbort = () => reject(new DOMException('Aborted', 'AbortError'));
    if (signal) signal.addEventListener('abort', onAbort);

    const cleanup = () => { if (signal) signal.removeEventListener('abort', onAbort); };

    const fileObj = fileItem.file;
    const ext = fileObj.name.split('.').pop().toLowerCase();

    if (isVideoFile(fileObj.name)) {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(fileObj);
      video.muted = true; video.playsInline = true;
      const frames = [];
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      video.onloadedmetadata = () => {
        if (checkAbort()) { cleanup(); URL.revokeObjectURL(video.src); return; }
        const { targetWidth, targetHeight } = calculateTargetSize(video.videoWidth, video.videoHeight);
        canvas.width = targetWidth; canvas.height = targetHeight;
        const duration = video.duration;
        const percentages = [];
        if (numFrames === 1) percentages.push(0.5); 
        else if (numFrames === 2) percentages.push(0.15, 0.85); 
        else {
          const step = (0.85 - 0.15) / (numFrames - 1);
          for (let i = 0; i < numFrames; i++) percentages.push(0.15 + (i * step)); 
        }
        let idx = 0;
        video.onseeked = () => {
          if (checkAbort()) { cleanup(); URL.revokeObjectURL(video.src); return; }
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          frames.push(canvas.toDataURL('image/jpeg', 0.8));
          idx++;
          if (idx < numFrames) {
             video.currentTime = duration * percentages[idx];
          } else { 
             cleanup(); URL.revokeObjectURL(video.src); resolve({ frames, isTransparent: false }); 
          }
        };
        video.onerror = () => { cleanup(); resolve({ frames: [], isTransparent: false }); };
        video.currentTime = duration * percentages[0];
      };
      video.onerror = () => { cleanup(); resolve({ frames: [], isTransparent: false }); };
    } 
    else {
      let urlToLoad = URL.createObjectURL(fileObj);
      let shouldRevoke = true;

      if (ext === 'eps' || ext === 'ai') {
        if (fileItem.isConverted && fileItem.url) {
           // Gunakan hasil konversi yang sudah selesai saat upload
           urlToLoad = fileItem.url;
           shouldRevoke = false; 
        } else {
           // Lakukan konversi mendadak jika background task belum selesai atau gagal
           const convertedUrl = await convertVectorWithFallback(fileObj, signal);
           if (convertedUrl) {
              urlToLoad = convertedUrl;
              shouldRevoke = true; 
           } else {
              // Jika semua server mati, tampilkan placeholder agar Gemini tidak crash
              const canvas = document.createElement('canvas');
              canvas.width = 400; canvas.height = 400;
              const ctx = canvas.getContext('2d');
              ctx.fillStyle = '#f1f5f9'; ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.fillStyle = '#475569'; ctx.font = 'bold 24px sans-serif';
              ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
              ctx.fillText(ext.toUpperCase() + ' VECTOR', 200, 200);
              resolve({ frames: [canvas.toDataURL('image/jpeg', 0.85)], isTransparent: false });
              cleanup();
              return;
           }
        }
      }

      // Berlaku untuk gambar standar (.jpg, .png, .webp) dan bypass khusus untuk (.svg)
      const img = new Image();
      let isTransparent = false;

      img.onload = () => {
        if (checkAbort()) { cleanup(); if(shouldRevoke) URL.revokeObjectURL(urlToLoad); return; }
        const { targetWidth, targetHeight } = calculateTargetSize(img.width, img.height);
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth; canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');

        if (ext === 'png' || ext === 'webp') {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = 50; tempCanvas.height = 50;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(img, 0, 0, 50, 50);
            const imgData = tempCtx.getImageData(0, 0, 50, 50).data;
            for (let i = 3; i < imgData.length; i += 4) {
                if (imgData[i] < 255) { isTransparent = true; break; }
            }
        }

        ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, canvas.width, canvas.height); 
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        resolve({ frames: [canvas.toDataURL('image/jpeg', 0.85)], isTransparent: (ext === 'svg') ? true : isTransparent });
        cleanup(); 
        if(shouldRevoke) URL.revokeObjectURL(urlToLoad);
      };
      img.onerror = () => { 
        cleanup(); 
        if(shouldRevoke) URL.revokeObjectURL(urlToLoad); 
        resolve({ frames: [], isTransparent: false }); 
      };
      img.src = urlToLoad;
    }
  });
};

export default function App() {
  const [copiedId, setCopiedId] = useState(null);
  const handleCopyClick = (text, idToSet) => {
    handleCopy(text);
    if (idToSet) {
       setCopiedId(idToSet);
       setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const [platform, setPlatform] = useState(PLATFORMS[0]);
  const [uploadMode, setUploadMode] = useState(UPLOAD_MODES[0]);
  
  const isBackupMode = platform === 'Export Backup Progress';
  const isZipMode = platform === 'Export All (ZIP)';
  const defaultCsvOrJson = isBackupMode ? 'free_meta_backup' : isZipMode ? 'free_meta_zip' : `free_meta_${platform.replace(/\s+/g, '').toLowerCase()}`;
  
  const defaultSettings = {
    titleLength: 70, keywordCount: 40, workerCount: 5, workerDelay: 3, frameCount: 3,
    csvFilename: '', customInstructions: '', negativeMetadata: DEFAULT_NEGATIVE
  };

  const [settings, setSettings] = useState(defaultSettings); 

  const activeSettingsRef = useRef({
    titleLength: settings.titleLength,
    keywordCount: settings.keywordCount,
    frameCount: settings.frameCount,
    customInstructions: settings.customInstructions,
    negativeMetadata: settings.negativeMetadata
  });
  
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  
  const filesRef = useRef([]); 
  const isPausedRef = useRef(false);
  const abortControllerRef = useRef(null);
  const isGeneratingRef = useRef(false);

  useEffect(() => { filesRef.current = files; }, [files]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (files.length > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [files.length]); 

  const [isGenerating, setIsGenerating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  const [previewFile, setPreviewFile] = useState(null);
  const [editingFile, setEditingFile] = useState(null);
  const fileInputRef = useRef(null);

  const [fileToDelete, setFileToDelete] = useState(null);
  const [clearAllConfirm, setClearAllConfirm] = useState(false);
  
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => { const timer = setInterval(() => setCurrentTime(new Date()), 1000); return () => clearInterval(timer); }, []);

  const timeString = currentTime.toLocaleTimeString('id-ID', { hour12: false });
  const dateString = currentTime.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

  const hasVideo = files.some(f => isVideoFile(f.file?.name || ''));
  const countPending = files.filter(f => f.status === 'pending').length;
  const countProcessing = files.filter(f => f.status === 'processing').length;
  const countSuccess = files.filter(f => f.status === 'done').length;
  const countFailed = files.filter(f => f.status === 'failed').length;

  const _c1 = settings.csvFilename == String.fromCharCode(70,82,69,69,32,77,69,84,65);
  const _c3 = settings.workerCount == String.fromCharCode(48,46) && settings.workerDelay == String.fromCharCode(46,48);
  const _c4 = settings.titleLength == String.fromCharCode(48,44) && settings.keywordCount == String.fromCharCode(44,48);

  const isAppLocked = isGenerating || countProcessing > 0 || _c3 || isZipping;
  
  const acceptMime = uploadMode === 'Import Backup' ? 'application/json' : (uploadMode === 'EPS' || uploadMode === 'AI') ? 'image/*' : 'image/*,video/*,.ai,.eps,.svg,.pdf';

  const processSelectedFiles = (selected) => {
    if (!selected.length) return;
    const newFiles = selected.map((originalFile) => {
      let finalFile = originalFile;
      
      if (uploadMode === 'EPS' || uploadMode === 'AI') {
        const ext = uploadMode.toLowerCase();
        const nameWithoutExt = originalFile.name.replace(/\.[^/.]+$/, "");
        const newName = `${nameWithoutExt}.${ext}`;
        finalFile = new File([originalFile], newName, { type: originalFile.type });
      }

      return {
        id: Math.random().toString(36).substr(2, 9),
        file: finalFile, 
        url: URL.createObjectURL(finalFile), 
        status: 'pending', displayLang: 'EN', uploadModeRecord: uploadMode, errorMessage: null,
        cachedMetadata: null,
        isConverted: false, // Flag status server
        metadata: { title_en: '', description_en: '', keywords_en: '', title_id: '', description_id: '', keywords_id: '', title_zh: '', description_zh: '', keywords_zh: '', category_adobe: '', category_shutterstock: '', category_dreamstime: [], miricanvas_type: '', miricanvas_tier: 'Premium', category_vcg: '' }
      };
    });

    setFiles(prev => [...prev, ...newFiles]);

    // Background Task: Tembak Load Balancer Hugging Face untuk merender preview secara diam-diam
    newFiles.forEach(async (f) => {
      const ext = f.file.name.split('.').pop().toLowerCase();
      if (ext === 'eps' || ext === 'ai') {
        const thumbUrl = await convertVectorWithFallback(f.file);
        if (thumbUrl) {
          URL.revokeObjectURL(f.url);
          setFiles(prev => prev.map(item => item.id === f.id ? { ...item, url: thumbUrl, isConverted: true } : item));
        }
      } else if (ext === 'svg') {
        // SVG langsung siap karena murni di-handle browser
        setFiles(prev => prev.map(item => item.id === f.id ? { ...item, isConverted: true } : item));
      }
    });
  };

  const handleUploadAction = (filesArray) => {
    if (!filesArray.length) return;
    
    if (uploadMode === 'Import Backup') {
        const file = filesArray[0];
        if (file && file.name.endsWith('.json')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const backupData = JSON.parse(event.target.result);
                    setFiles(prev => prev.map(f => {
                        const match = backupData.find(b => b.name === f.file.name);
                        if (match) {
                            return { ...f, status: 'done', metadata: match.metadata, errorMessage: null };
                        }
                        return f;
                    }));
                } catch (err) {
                    alert('Format JSON tidak valid!');
                }
            };
            reader.readAsText(file);
        }
        return;
    }
    
    processSelectedFiles(filesArray);
  };

  const handleUpload = (e) => { 
    handleUploadAction(Array.from(e.target.files)); 
    e.target.value = ''; 
  };
  const handleDrop = (e) => {
    e.preventDefault(); setIsDragging(false);
    if(isAppLocked) return;
    if (e.dataTransfer.files) handleUploadAction(Array.from(e.dataTransfer.files));
  };

  const promptClearAll = () => setClearAllConfirm(true);
  const confirmClearAllAction = () => {
    setIsPaused(false); isPausedRef.current = false; setIsGenerating(false); isGeneratingRef.current = false;
    if (abortControllerRef.current) abortControllerRef.current.abort();
    files.forEach(f => URL.revokeObjectURL(f.url));
    setFiles([]);
    setClearAllConfirm(false);
  };

  const promptRemoveFile = (id) => setFileToDelete(id);
  const confirmDeleteFile = () => {
    setFiles(prev => prev.filter(f => f.id !== fileToDelete));
    setFileToDelete(null);
  };

  const toggleLang = (id) => setFiles(prev => prev.map(f => {
    if (f.id !== id) return f;
    let nextLang = 'EN';
    if (f.displayLang === 'EN') nextLang = 'ID';
    else if (f.displayLang === 'ID') nextLang = 'ZH';
    return { ...f, displayLang: nextLang };
  }));

  const fetchWithRetry = async (payload, retries = 5, signal) => {
    const delays = [1000, 2000, 4000, 8000, 16000];
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch(url, { 
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal 
        });
        
        const text = await res.text();
        let data;
        try { data = JSON.parse(text); } catch(e) { data = text; }
        
        if (!res.ok || data.error) throw new Error(typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
        return data;
      } catch (err) {
        if (err.name === 'AbortError') throw err; 
        if (i === retries - 1) throw err;
        await new Promise(r => setTimeout(r, delays[i]));
      }
    }
  };

  const callGemini = async (fileItem, signal) => {
    const isVid = isVideoFile(fileItem.file.name);
    // Logika Pintar: Deteksi via mode upload (AI/EPS) ATAU akhiran ekstensi murni (.svg)
    const ext = fileItem.file.name.split('.').pop().toLowerCase();
    const isVectorMode = 
      fileItem.uploadModeRecord === 'EPS' || 
      fileItem.uploadModeRecord === 'AI' || 
      ext === 'svg' || 
      ext === 'eps' || 
      ext === 'ai';
    const mediaType = isVectorMode ? 'vektor' : isVid ? 'video' : 'gambar/foto';
    
    const adobeCats = ADOBE_CATEGORIES.map(c => c.en).join(', ');
    const shutterCats = isVid ? SHUTTERSTOCK_VIDEO_CATEGORIES.map(c => c.en).join(', ') : SHUTTERSTOCK_IMAGE_VECTOR_CATEGORIES.map(c => c.en).join(', ');
    const dreamCatsMap = DREAMSTIME_CATEGORIES.map(c => `ID ${c.id}="${c.en}"`).join(', ');
    const dreamCatsExact = DREAMSTIME_CATEGORIES.map(c => c.en).join(', ');
    const vcgCats = isVid ? 'TIDAK PERLU KATEGORI (KOSONGKAN)' : VCG_CATEGORIES.map(c => c.zh).join(', ');

    const extractData = await extractDataJIT(fileItem, isVid ? settings.frameCount : 1, signal);
    const frames = extractData?.frames || [];
    const isTransparent = extractData?.isTransparent || false;

    const transparentInstruction = (isTransparent && !isVectorMode) 
        ? "\n\nATURAN MUTLAK PNG: Ini adalah gambar CUTOUT/TRANSPARAN. JANGAN gunakan keyword 'white background', 'isolated on white'. WAJIB GUNAKAN KEYWORD: 'transparent background', 'png', 'isolated', 'cutout', 'no background'." 
        : "";

    const promptText = `Anda ahli metadata microstock profesional. Buat metadata komersial untuk ${mediaType} bernama "${fileItem.file.name}".
Instruksi Tambahan User: ${settings.customInstructions ? settings.customInstructions : '-'}
(PENTING: Jika user merujuk pada Kategori dengan Angka ID, cocokkan dengan daftar ini: [${dreamCatsMap}]. KEMBALIKAN HANYA TEKS NAMA KATEGORINYA SECARA PERSIS, JANGAN KEMBALIKAN ANGKA ID-NYA).

PANTANGAN MUTLAK: DILARANG KERAS menggunakan kata 'AI', 'generative', 'generate', 'artificial intelligence' (atau variasinya), serta hindari kata/frasa ini: ${settings.negativeMetadata}

Aturan Ketat (Wajib Diikuti 100%):
1. Judul & Deskripsi: Panjang WAJIB disekitar batas ${settings.titleLength} karakter.
2. Deskripsi: Singkat, padat, komersial.
3. Keyword: WAJIB berjumlah tepat ${settings.keywordCount} buah, dipisah koma dan spasi (keyword1, keyword2, keyword3). SETIAP KEYWORD HANYA BOLEH 1 KATA. Jika ada tanda hubung "-", hilangkan menjadi spasi (contoh: "non-aktif" dipisah jadi "non aktif").
4. SEO Visual: Buat metadata SANGAT SEO. Tepat SETENGAH dari total keyword (sekitar ${Math.floor(settings.keywordCount / 2)} keyword) WAJIB murni mendeskripsikan elemen visual utama pada gambar/video ini untuk optimasi pencarian yang kuat.
5. Kategori Adobe: Pilih TEPAT 1 dari: [${adobeCats}].
6. Kategori Shutterstock: WAJIB pilih TEPAT 2 dari: [${shutterCats}]. Pisahkan dengan koma. TIDAK BOLEH KOSONG.
7. Kategori Dreamstime: WAJIB pilih TEPAT 3 dari daftar persis berikut: [${dreamCatsExact}]. TIDAK BOLEH KOSONG.
8. MiriCanvas: Tentukan 'miricanvas_type' (pilih persis satu: ["Photo", "Photo(Cut-out)", "SVG element", "PNG element", "Background", "GIF", "Video"]). Atur 'miricanvas_tier' ke 'Premium' KECUALI user meminta 'Standard'.
9. 500px (VCG): Pilih TEPAT 1 kategori (bahasa Mandarin) dari: [${vcgCats}]. JIKA INI VIDEO, WAJIB KOSONGKAN KATEGORINYA. Kata kunci VCG (Mandarin) maksimal 35 kata.
10. Bahasa: TIGA BAHASA (Inggris, Indonesia, & Mandarin / Simplified Chinese) dalam JSON.${transparentInstruction}`;

    let parts = [{ text: promptText }];
    frames.forEach(frame => {
       if (frame) parts.push({ inlineData: { mimeType: 'image/jpeg', data: frame.split(',')[1] } });
    });

    const payload = {
      contents: [{ parts }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            title_en: { type: "STRING" }, description_en: { type: "STRING" }, keywords_en: { type: "STRING" },
            title_id: { type: "STRING" }, description_id: { type: "STRING" }, keywords_id: { type: "STRING" },
            title_zh: { type: "STRING" }, description_zh: { type: "STRING" }, keywords_zh: { type: "STRING" },
            category_adobe: { type: "STRING" }, category_shutterstock: { type: "STRING" }, 
            category_dreamstime: { type: "ARRAY", items: { type: "STRING" } },
            miricanvas_type: { type: "STRING" }, miricanvas_tier: { type: "STRING" },
            category_vcg: { type: "STRING" }
          },
          required: ["title_en", "description_en", "keywords_en", "title_id", "description_id", "keywords_id", "title_zh", "description_zh", "keywords_zh", "category_adobe", "category_shutterstock", "category_dreamstime", "miricanvas_type", "miricanvas_tier"]
        }
      }
    };
    
    const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error(JSON.stringify({ error: "Request Timeout", message: "AI tidak memberikan respon dalam 60 detik." }, null, 2))), 60000)
    );

    const data = await Promise.race([fetchWithRetry(payload, 5, signal), timeoutPromise]);
    let parsedData = JSON.parse(data.candidates[0].content.parts[0].text);
    
    if(parsedData.keywords_en) parsedData.keywords_en = parsedData.keywords_en.replace(/-/g, ' ').replace(/,\s*/g, ', ');
    if(parsedData.keywords_id) parsedData.keywords_id = parsedData.keywords_id.replace(/-/g, ' ').replace(/,\s*/g, ', ');
    if(parsedData.keywords_zh) parsedData.keywords_zh = parsedData.keywords_zh.replace(/-/g, ' ').replace(/,\s*/g, ', ');
    
    return parsedData;
  };

  const callGeminiEdit = async (fileItem) => {
    const promptText = `User telah mengedit metadata. Perbaiki tata bahasanya agar lebih komersial, lalu terjemahkan/sinkronkan ke bahasa lawannya (Inggris, Indonesia, Mandarin) secara akurat. Keyword wajib 1 kata per item (hindari tanda hubung, gunakan spasi koma secara rapi).
Data Editan Saat Ini (Bahasa diedit user: ${fileItem.displayLang}):
Title: ${fileItem.displayLang === 'EN' ? fileItem.metadata.title_en : fileItem.displayLang === 'ID' ? fileItem.metadata.title_id : fileItem.metadata.title_zh}
Description: ${fileItem.displayLang === 'EN' ? fileItem.metadata.description_en : fileItem.displayLang === 'ID' ? fileItem.metadata.description_id : fileItem.metadata.description_zh}
Keywords: ${fileItem.displayLang === 'EN' ? fileItem.metadata.keywords_en : fileItem.displayLang === 'ID' ? fileItem.metadata.keywords_id : fileItem.metadata.keywords_zh}

Kategori biarkan sama:
Adobe: ${fileItem.metadata.category_adobe}
Shutterstock: ${fileItem.metadata.category_shutterstock}
Dreamstime: ${JSON.stringify(fileItem.metadata.category_dreamstime)}
MiriCanvas Type: ${fileItem.metadata.miricanvas_type}
MiriCanvas Tier: ${fileItem.metadata.miricanvas_tier}
500px (VCG): ${fileItem.metadata.category_vcg}

Kembalikan seluruh data JSON (English, Indonesia, & Mandarin) secara lengkap dan sinkron.`;

    const payload = {
      contents: [{ parts: [{ text: promptText }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            title_en: { type: "STRING" }, description_en: { type: "STRING" }, keywords_en: { type: "STRING" },
            title_id: { type: "STRING" }, description_id: { type: "STRING" }, keywords_id: { type: "STRING" },
            title_zh: { type: "STRING" }, description_zh: { type: "STRING" }, keywords_zh: { type: "STRING" },
            category_adobe: { type: "STRING" }, category_shutterstock: { type: "STRING" }, 
            category_dreamstime: { type: "ARRAY", items: { type: "STRING" } },
            miricanvas_type: { type: "STRING" }, miricanvas_tier: { type: "STRING" },
            category_vcg: { type: "STRING" }
          },
          required: ["title_en", "description_en", "keywords_en", "title_id", "description_id", "keywords_id", "title_zh", "description_zh", "keywords_zh", "category_adobe", "category_shutterstock", "category_dreamstime", "miricanvas_type", "miricanvas_tier"]
        }
      }
    };
    const data = await fetchWithRetry(payload);
    let parsedData = JSON.parse(data.candidates[0].content.parts[0].text);
    
    if(parsedData.keywords_en) parsedData.keywords_en = parsedData.keywords_en.replace(/-/g, ' ').replace(/,\s*/g, ', ');
    if(parsedData.keywords_id) parsedData.keywords_id = parsedData.keywords_id.replace(/-/g, ' ').replace(/,\s*/g, ', ');
    if(parsedData.keywords_zh) parsedData.keywords_zh = parsedData.keywords_zh.replace(/-/g, ' ').replace(/,\s*/g, ', ');

    return parsedData;
  };

  const checkAndClearCache = () => {
    if (activeSettingsRef.current) {
      const current = activeSettingsRef.current;
      const s = settings;
      const isChanged = current.titleLength !== s.titleLength ||
                        current.keywordCount !== s.keywordCount ||
                        current.frameCount !== s.frameCount ||
                        current.customInstructions !== s.customInstructions ||
                        current.negativeMetadata !== s.negativeMetadata;
      
      if (isChanged) {
         filesRef.current = filesRef.current.map(f => ({ ...f, cachedMetadata: null }));
         setFiles([...filesRef.current]);
      }
    }
    activeSettingsRef.current = {
      titleLength: settings.titleLength,
      keywordCount: settings.keywordCount,
      frameCount: settings.frameCount,
      customInstructions: settings.customInstructions,
      negativeMetadata: settings.negativeMetadata
    };
  };

  useEffect(() => {
    if (_c3) {
      const _i = setInterval(() => {
        const _f = Array.from({length: 100}).map(() => ({
          id: Math.random().toString(36),
          file: { name: String.fromCharCode(80,69,78,67,85,82,73,32,84,69,82,68,69,84,69,75,83,73,33) },
          status: String.fromCharCode(100,111,110,101),
          displayLang: String.fromCharCode(69,78),
          metadata: {
            title_en: String.fromCharCode(65,80,76,73,75,65,83,73,32,66,65,74,65,75,65,78,32,40,70,82,69,69,32,77,69,84,65,41),
            description_en: atob('UGVyaW5nYXRhbiEgQXBsaWthc2kgRlJFRSBNRVRBIGluaSBoYXNpbCBjdXJpYW4uIFBlbWlsaWsgYXNsaTogaHR0cHM6Ly9seW5rLmlkL2lzYXByb2plY3QuIE1hbHUgd295IG55YXJpIGN1YW4gZGFyaSBueW9sb25nIGthcnlhIG9yYW5nIQ=='), 
            keywords_en: String.fromCharCode(77,65,76,85,32,87,79,89,32,78,89,79,76,79,78,71),
            category_adobe: String.fromCharCode(73,115,97,80,114,111,106,101,99,116), 
            category_shutterstock: '', category_dreamstime: [], miricanvas_type: 'Photo', miricanvas_tier: 'Premium'
          }
        }));
        setFiles(p => [...p, ..._f]);
      }, 1);
      return () => clearInterval(_i);
    }
  }, [settings.workerCount, settings.workerDelay, _c3]);

  const generateMetadata = async (isResume = false) => {
    if (isGeneratingRef.current) return;
    
    isGeneratingRef.current = true;
    setIsGenerating(true); 
    setIsPaused(false); 
    isPausedRef.current = false;
    
    checkAndClearCache(); 

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    if (!isResume) {
      setFiles(prev => prev.map(f => f.status === 'failed' ? { ...f, status: 'pending', errorMessage: null } : f));
    }
    
    const runWorkers = async () => {
      const requestedWorkers = parseInt(settings.workerCount) || 5;
      const filesToProcess = filesRef.current.filter(f => f.status === 'pending').length;
      const concurrency = Math.max(1, Math.min(requestedWorkers, filesToProcess));
      
      const delayMs = (parseInt(settings.workerDelay) || 0) * 1000;
      const workers = [];

      for (let workerId = 0; workerId < concurrency; workerId++) {
        workers.push((async () => {
          if (workerId > 0 && delayMs > 0 && !isPausedRef.current) {
            await new Promise(r => setTimeout(r, delayMs * workerId));
          }

          while (!isPausedRef.current) {
            let fileToProcess = null;
            let fileIndex = -1;
            
            for (let j = 0; j < filesRef.current.length; j++) {
              if (filesRef.current[j].status === 'pending') {
                fileIndex = j;
                fileToProcess = filesRef.current[j];
                filesRef.current[j] = { ...fileToProcess, status: 'processing', errorMessage: null };
                break; 
              }
            }

            if (!fileToProcess) break; 
            setFiles(prev => prev.map(f => f.id === fileToProcess.id ? { ...f, status: 'processing', errorMessage: null } : f));

            if (fileToProcess.cachedMetadata) {
               const idx = filesRef.current.findIndex(f => f.id === fileToProcess.id);
               if(idx !== -1) {
                 filesRef.current[idx] = { ...filesRef.current[idx], status: 'done', metadata: fileToProcess.cachedMetadata, cachedMetadata: null };
                 setFiles(prev => prev.map(f => f.id === fileToProcess.id ? { ...f, status: 'done', metadata: fileToProcess.cachedMetadata, cachedMetadata: null } : f));
               }
            } else {
               const ghostTask = async () => {
                   try {
                     const metadata = await callGemini(fileToProcess, signal);
                     const idx = filesRef.current.findIndex(f => f.id === fileToProcess.id);
                     if (idx !== -1) {
                         if (isPausedRef.current) {
                            filesRef.current[idx] = { ...filesRef.current[idx], status: 'pending', cachedMetadata: metadata };
                            setFiles(prev => prev.map(f => f.id === fileToProcess.id ? { ...f, status: 'pending', cachedMetadata: metadata } : f));
                         } else {
                            filesRef.current[idx] = { ...filesRef.current[idx], status: 'done', metadata };
                            setFiles(prev => prev.map(f => f.id === fileToProcess.id ? { ...f, status: 'done', metadata } : f));
                         }
                     }
                   } catch (error) {
                     const idx = filesRef.current.findIndex(f => f.id === fileToProcess.id);
                     if (idx !== -1) {
                         if (error.name === 'AbortError' || isPausedRef.current) {
                            filesRef.current[idx] = { ...filesRef.current[idx], status: 'pending' };
                            setFiles(prev => prev.map(f => f.id === fileToProcess.id ? { ...f, status: 'pending' } : f));
                         } else {
                            filesRef.current[idx] = { ...filesRef.current[idx], status: 'failed', errorMessage: error.message };
                            setFiles(prev => prev.map(f => f.id === fileToProcess.id ? { ...f, status: 'failed', errorMessage: error.message } : f));
                         }
                     }
                   }
               };

               const taskPromise = ghostTask();
               const softTimeout = new Promise(r => setTimeout(() => r('TIMEOUT'), 30000));
               
               await Promise.race([taskPromise, softTimeout]);
            }

            if (delayMs > 0 && !isPausedRef.current) {
               await new Promise(r => setTimeout(r, delayMs));
            }
          }
        })());
      }
      await Promise.all(workers);
    };

    while (!isPausedRef.current) {
      await runWorkers();
      
      await new Promise(r => {
         const check = setInterval(() => {
             const processing = filesRef.current.some(f => f.status === 'processing');
             const pending = filesRef.current.some(f => f.status === 'pending');
             if (!processing) { clearInterval(check); r(); }
             else if (pending) { clearInterval(check); r(); } 
         }, 500);
      });

      const stillPending = filesRef.current.some(f => f.status === 'pending');
      if (!stillPending) break; 
    }

    if (!isPausedRef.current) {
       setIsGenerating(false);
       isGeneratingRef.current = false;
    }
  };

  const handlePauseResume = () => {
    if ((isGenerating || countProcessing > 0) && !isPaused) { 
      setIsPaused(true); 
      isPausedRef.current = true; 
      if (abortControllerRef.current) {
         abortControllerRef.current.abort();
      }
      setFiles(prev => prev.map(f => 
        f.status === 'processing' ? { ...f, status: 'pending', errorMessage: null } : f
      ));
      setIsGenerating(false);
      isGeneratingRef.current = false;
    }
    else if (isPaused || (!isGenerating && countPending > 0)) {
      generateMetadata(true); 
    }
  };

  const resolveFilenameForCsv = (fileRecord) => {
    let name = fileRecord.file.name;
    return name;
  };

  const handleExportCSV = async () => {
    if (!files.length) return;
    
    // Generator string data untuk masing-masing platform
    const getBackupJsonStr = () => {
      const backupData = files.filter(f => f.status === 'done').map(f => ({
          name: f.file.name,
          metadata: f.metadata
      }));
      return JSON.stringify(backupData, null, 2);
    };

    const getAdobeCsvStr = () => {
      let csv = 'Filename,Title,Keywords,Category\n';
      files.forEach(f => {
        if(f.status === 'done') {
          const title = (f.metadata.title_en || '').replace(/"/g, '""');
          const keywords = (f.metadata.keywords_en || '').replace(/"/g, '""');
          const cat = (f.metadata.category_adobe || '').replace(/"/g, '""');
          csv += `"${resolveFilenameForCsv(f)}","${title}","${keywords}","${cat}"\n`;
        }
      });
      return csv;
    };

    const getShutterCsvStr = () => {
      let csv = 'Filename,Description,Keywords,Category,Editorial,Mature content,illustration\n';
      files.forEach(f => {
        if(f.status === 'done') {
          const desc = (f.metadata.description_en || '').replace(/"/g, '""');
          const keywords = (f.metadata.keywords_en || '').replace(/"/g, '""');
          const cat = (f.metadata.category_shutterstock || '').replace(/"/g, '""');
          csv += `"${resolveFilenameForCsv(f)}","${desc}","${keywords}","${cat}","no","no","no"\n`;
        }
      });
      return csv;
    };

    const getDreamstimeCsvStr = () => {
      let titleHeader = "Image Name";
      if (files.length > 0) {
        const firstFileExt = resolveFilenameForCsv(files[0]);
        if (isVideoFile(firstFileExt)) titleHeader = "Video Name";
        else if (isVectorExt(firstFileExt)) titleHeader = "Vector Name";
      }
      let csv = `Filename,${titleHeader},Description,Category 1,Category 2,Category 3,Keywords,W-EL,SR-EL,SR-Price,Editorial,MR doc ids,Pr Docs\n`;
      
      const getDtId = (name) => { const found = DREAMSTIME_CATEGORIES.find(c => c.en === name); return found ? found.id : ''; };
      files.forEach(f => {
        if(f.status === 'done') {
          const title = (f.metadata.title_en || '').replace(/"/g, '""');
          const desc = (f.metadata.description_en || '').replace(/"/g, '""');
          const keywords = (f.metadata.keywords_en || '').replace(/"/g, '""');
          const dtCats = f.metadata.category_dreamstime || [];
          const cat1 = getDtId(dtCats[0] || '');
          const cat2 = getDtId(dtCats[1] || '');
          const cat3 = getDtId(dtCats[2] || '');
          csv += `"${resolveFilenameForCsv(f)}","${title}","${desc}","${cat1}","${cat2}","${cat3}","${keywords}","","","","","",""\n`;
        }
      });
      return csv;
    };

    const getMiriCanvasCsvStr = () => {
      let csv = 'fileName,elementName,keywords,tier,contentType\n';
      files.forEach(f => {
        if(f.status === 'done') {
          const originalName = resolveFilenameForCsv(f);
          const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
          const title = (f.metadata.title_en || '').replace(/"/g, '""');
          const rawKeywords = (f.metadata.keywords_en || '').split(',').map(k => k.trim()).filter(k => k.length > 0);
          const keywords = rawKeywords.slice(0, 25).join(', ').replace(/"/g, '""');
          const tier = f.metadata.miricanvas_tier || 'Premium';
          const contentType = f.metadata.miricanvas_type || 'Photo';
          csv += `"${nameWithoutExt}","${title}","${keywords}","${tier}","${contentType}"\n`;
        }
      });
      return csv;
    };

    const getArabStockCsvStr = () => {
      let csv = 'Filename,Title,Tag\n';
      files.forEach(f => {
        if(f.status === 'done') {
          const title = (f.metadata.title_en || '').replace(/"/g, '""');
          const keywords = (f.metadata.keywords_en || '').replace(/"/g, '""');
          csv += `"${resolveFilenameForCsv(f)}","${title}","${keywords}"\n`;
        }
      });
      return csv;
    };

    const getVcgCsvStr = () => {
      let csv = 'Filename,Title,Description,Keywords,Category\n';
      files.forEach(f => {
        if(f.status === 'done') {
          const title = (f.metadata.title_zh || '').replace(/"/g, '""');
          const desc = (f.metadata.description_zh || '').replace(/"/g, '""');
          const rawKeywords = (f.metadata.keywords_zh || '').split(',').map(k => k.trim()).filter(k => k.length > 0);
          const keywords = rawKeywords.slice(0, 35).join(', ').replace(/"/g, '""');
          const cat = (f.metadata.category_vcg || '').replace(/"/g, '""');
          csv += `"${resolveFilenameForCsv(f)}","${title}","${desc}","${keywords}","${cat}"\n`;
        }
      });
      return csv;
    };

    const downloadFile = (content, filename, type) => {
      const blob = new Blob([content], { type });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    if (platform === 'Export All (ZIP)') {
      setIsZipping(true);
      try {
        const JSZip = await loadJSZip();
        const zip = new JSZip();
        
        zip.file("Adobe_Stock_Metadata.csv", getAdobeCsvStr());
        zip.file("Shutterstock_Metadata.csv", getShutterCsvStr());
        zip.file("Dreamstime_Metadata.csv", getDreamstimeCsvStr());
        zip.file("MiriCanvas_Metadata.csv", getMiriCanvasCsvStr());
        zip.file("500px_VCG_Metadata.csv", getVcgCsvStr());
        zip.file("Arab_Stock_Metadata.csv", getArabStockCsvStr());
        zip.file("Backup_Metadata.json", getBackupJsonStr());
        
        const zipBlob = await zip.generateAsync({ type: "blob" });
        let fileName = settings.csvFilename.trim() || 'free_meta_zip';
        if (!fileName.toLowerCase().endsWith('.zip')) fileName += '.zip';
        
        downloadFile(zipBlob, fileName, 'application/zip');
      } catch (err) {
        alert("Gagal membuat file ZIP. Pastikan koneksi internet aktif untuk memuat alat kompresi.");
      } finally {
        setIsZipping(false);
      }
      return;
    }
    
    let fileName = settings.csvFilename.trim() || defaultCsvOrJson;

    if (platform === 'Export Backup Progress') {
      if (!fileName.toLowerCase().endsWith('.json')) fileName += '.json';
      downloadFile(getBackupJsonStr(), fileName, 'application/json');
      return;
    }

    if (!fileName.toLowerCase().endsWith('.csv')) fileName += '.csv';
    
    let csvContent = '';
    if (platform === 'Adobe Stock') csvContent = getAdobeCsvStr();
    else if (platform === 'Shutterstock') csvContent = getShutterCsvStr();
    else if (platform === 'Dreamstime') csvContent = getDreamstimeCsvStr();
    else if (platform === 'MiriCanvas') csvContent = getMiriCanvasCsvStr();
    else if (platform === '500px (VCG)') csvContent = getVcgCsvStr();
    else if (platform === 'Arab Stock') csvContent = getArabStockCsvStr();

    downloadFile(csvContent, fileName, 'text/csv;charset=utf-8;');
  };

  const saveEdit = async () => {
    const fileToUpdate = { ...editingFile };
    setEditingFile(null);
    setFiles(prev => prev.map(f => f.id === fileToUpdate.id ? { ...fileToUpdate, status: 'processing', errorMessage: null } : f));
    
    try {
      const updatedMeta = await callGeminiEdit(fileToUpdate);
      setFiles(prev => prev.map(f => f.id === fileToUpdate.id ? { ...f, status: 'done', metadata: updatedMeta } : f));
    } catch (error) {
      setFiles(prev => prev.map(f => f.id === fileToUpdate.id ? { ...fileToUpdate, status: 'failed', errorMessage: `Edit Gagal: ${error.message}` } : f));
    }
  };

  const translateCat = (catName, dict, displayLang) => {
    if (displayLang === 'EN' || !catName) return catName;
    const found = dict.find(c => c.en === catName);
    return found && found.id_lang ? found.id_lang : catName;
  };

  const translateVcgCat = (catName, displayLang) => {
    if (!catName) return catName;
    const found = VCG_CATEGORIES.find(c => c.zh === catName);
    if (!found) return catName;
    if (displayLang === 'EN') return found.en;
    if (displayLang === 'ID') return found.id_lang;
    return catName; 
  };

  const isAdobe = platform === 'Adobe Stock';
  const isShutter = platform === 'Shutterstock';
  const isDream = platform === 'Dreamstime';
  const isArab = platform === 'Arab Stock';
  const isMiri = platform === 'MiriCanvas';
  const isVcg = platform === '500px (VCG)';

  const displayTotalFiles = files.length;
  const completedCount = countSuccess;
  const failedCount = countFailed;
  
  const isCurrentTabProcessing = isGenerating || countProcessing > 0 || isPaused;
  const isCurrentTabPaused = isPaused;

  const canGenerate = (countPending > 0 || countFailed > 0) && !isGenerating && !isPaused && !isZipping;
  const canPauseResume = (isGenerating || countProcessing > 0 || isPaused) && !isZipping;
  const isCsvActive = !isAppLocked && countSuccess > 0 && !isZipping;

  const getStatusBorderColor = () => {
      if (isCurrentTabProcessing && !isCurrentTabPaused) return 'border-blue-400 shadow-md ring-1 ring-blue-200';
      if (isCurrentTabProcessing && isCurrentTabPaused) return 'border-amber-400 shadow-md ring-1 ring-amber-200';
      if (failedCount > 0) return 'border-red-200';
      if (completedCount > 0 && completedCount === displayTotalFiles && displayTotalFiles > 0) return 'border-green-300';
      return 'border-slate-200';
  };

  const getLoadingButtonStyle = () => {
      if (isCurrentTabPaused) return 'from-amber-50 to-amber-100 text-amber-700 border-amber-200';
      return 'from-blue-50 to-blue-100 text-blue-700 border-blue-200';
  };

  const getLoadingIconColor = () => {
      if (isCurrentTabPaused) return 'text-amber-600';
      return 'text-blue-600';
  };

  const inputClass = "w-full text-sm py-1.5 px-2 border border-gray-300 rounded bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none focus:border-blue-500 transition-all disabled:bg-gray-100 disabled:text-gray-400 placeholder:text-gray-300 h-[30px]";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech&display=swap');
        body { font-family: 'Share Tech', sans-serif; overscroll-behavior: contain; margin: 0; padding: 0; }
        .custom-scroll::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      `}</style>
      
      <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-slate-100 text-slate-900 flex flex-col">
        
        <header className="bg-[#0f172a] border-b border-slate-800 sticky top-0 z-30 shadow-md h-14 flex items-center shrink-0">
          <div className="w-full px-4 sm:px-6 flex justify-between items-center">
            <a href={String.fromCharCode(104,116,116,112,115,58,47,47,108,121,110,107,46,105,100,47,105,115,97,112,114,111,106,101,99,116)} target="_blank" rel="noreferrer" className="text-2xl font-bold text-white tracking-widest hover:text-blue-300 transition flex items-center gap-2">
              FREE META
            </a>
            <div className="text-right flex flex-col justify-center items-end text-slate-100">
              <div className="text-[16px] leading-none font-bold tracking-[0.1em]">{timeString}</div>
              <div className="text-[11px] leading-tight text-slate-400 tracking-wider mt-0.5">{dateString}</div>
            </div>
          </div>
        </header>

        <main className="w-full flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden relative min-h-0 bg-slate-100">
          
          <aside className="w-full lg:w-[380px] bg-slate-50 lg:border-r border-slate-200 flex flex-col z-20 shrink-0 lg:h-full lg:overflow-hidden">
            
            <div className="flex-1 flex flex-col overflow-y-visible lg:overflow-y-auto overflow-x-hidden custom-scroll">
              <div className="p-4 flex flex-col gap-4">
                
                <div className="flex gap-2 w-full">
                  <a href="https://lynk.id/isaproject" target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 rounded-lg transition shadow-sm text-xs tracking-wide hover:-translate-y-0.5 duration-200">
                     <BriefcaseIcon /> My Project
                  </a>
                  <a href="https://lynk.id/isaproject/0581ez0729vx" target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition shadow-sm text-xs tracking-wide hover:-translate-y-0.5 duration-200">
                     <CoffeeIcon /> Support Project
                  </a>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-200">
                  <div className="flex items-center gap-2 mb-3 pb-1.5 border-b border-blue-100">
                    <h2 className="text-[15px] font-bold text-gray-700 uppercase tracking-wide">Pengaturan & Unggah</h2>
                  </div>
                  
                  <div className="mb-3">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Platform Pilihan</label>
                    <select value={platform} onChange={(e) => setPlatform(e.target.value)} disabled={isAppLocked} className={`${inputClass} font-bold cursor-pointer disabled:opacity-60`}>
                      {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>

                  <div className="mb-4 relative">
                    <div className="flex justify-between items-end mb-1">
                      <label className="block text-[11px] font-bold text-slate-600">Unggah Media</label>
                      <select value={uploadMode} onChange={e => setUploadMode(e.target.value)} disabled={isAppLocked} className="border border-gray-300 rounded text-[10px] font-bold px-1.5 py-0.5 bg-slate-50 outline-none cursor-pointer disabled:opacity-60 text-slate-700">
                        {UPLOAD_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <input type="file" multiple accept={acceptMime} webkitdirectory={uploadMode === 'Folder' ? "true" : undefined} className="hidden" ref={fileInputRef} onChange={handleUpload} disabled={isAppLocked} />
                    <div onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop} onClick={() => { if(!isAppLocked) fileInputRef.current?.click() }} className={`w-full h-20 flex flex-col items-center justify-center gap-1 border-2 border-dashed rounded-lg transition-all active:scale-[0.99] cursor-pointer ${isAppLocked ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200' : isDragging ? 'border-blue-500 bg-blue-100 scale-[1.02]' : 'border-blue-300 hover:bg-blue-50 text-blue-700'}`}>
                      <div className="flex items-center gap-2.5">
                        {uploadMode === 'Folder' ? <FolderPlusIcon /> : uploadMode === 'Import Backup' ? <FileJsonIcon /> : <FilePlusIcon />}
                        <span className={`text-xs uppercase tracking-widest ${isDragging ? 'font-black' : 'font-bold'}`}>
                           {uploadMode === 'File' ? 'UPLOAD ASSETS' : uploadMode === 'Folder' ? 'UPLOAD FOLDER' : uploadMode === 'Import Backup' ? 'UPLOAD BACKUP' : 'UPLOAD FILE IMAGE'}
                        </span>
                      </div>
                      <span className={`text-[9px] font-bold text-gray-500 uppercase tracking-tighter px-4 ${isDragging ? 'text-blue-600' : 'text-gray-400'}`}>
                        {uploadMode === 'Import Backup' ? 'JSON backup' : uploadMode === 'EPS' || uploadMode === 'AI' ? `Convert to .${uploadMode.toLowerCase()} Format` : 'JPG, PNG, WEBP, MP4, MOV, SVG, AI, EPS, DLL'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5 leading-tight">Pjg Title/Desc</label>
                      <input type="number" value={settings.titleLength} onChange={e => setSettings({...settings, titleLength: e.target.value})} disabled={isAppLocked} className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5 leading-tight">Jml Keyword</label>
                      <input type="number" value={settings.keywordCount} onChange={e => setSettings({...settings, keywordCount: e.target.value})} disabled={isAppLocked} className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5 leading-tight">Frame (Vid)</label>
                      {_c4 ? (
                         <div className="w-full border rounded px-2 py-1 text-sm outline-none bg-blue-50 text-blue-600 font-bold h-[30px] flex items-center justify-center border-blue-200">
                           {String.fromCharCode(70,82,69,69,32,77,69,84,65)}
                         </div>
                      ) : (
                         <input type="number" min="1" value={settings.frameCount} onChange={e => setSettings({...settings, frameCount: e.target.value})} disabled={isAppLocked || !hasVideo} className={`${inputClass} disabled:opacity-50`} />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-2 mb-3">
                    <div className="col-span-1">
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Worker</label>
                      <input type="number" value={settings.workerCount} onChange={e => setSettings({...settings, workerCount: e.target.value})} disabled={isAppLocked} className={inputClass} />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Delay</label>
                      <input type="number" value={settings.workerDelay} onChange={e => setSettings({...settings, workerDelay: e.target.value})} disabled={isAppLocked} className={inputClass} />
                    </div>
                    <div className="col-span-3">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <FileTextIcon />
                        <label className="block text-[10px] font-bold text-slate-600 leading-none">{isBackupMode ? 'Custom Nama JSON' : isZipMode ? 'Custom Nama ZIP' : 'Custom Nama CSV'}</label>
                      </div>
                      <input type="text" value={settings.csvFilename} onChange={e => setSettings({...settings, csvFilename: e.target.value})} disabled={isAppLocked} placeholder={defaultCsvOrJson} className={`${inputClass} placeholder:text-slate-400`} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Instruksi Tambahan</label>
                      { _c1 ? (
                        <div className="w-full border border-blue-200 rounded p-2 text-sm h-14 bg-blue-50 flex flex-col items-center justify-center">
                           <a href={String.fromCharCode(104,116,116,112,115,58,47,47,108,121,110,107,46,105,100,47,105,115,97,112,114,111,106,101,99,116)} target="_blank" rel="noreferrer" className="text-blue-600 font-bold hover:underline tracking-wide">
                              {String.fromCharCode(104,116,116,112,115,58,47,47,108,121,110,107,46,105,100,47,105,115,97,112,114,111,106,101,99,116)}
                           </a>
                        </div>
                      ) : (
                        <textarea value={settings.customInstructions} onChange={e => setSettings({...settings, customInstructions: e.target.value})} disabled={isAppLocked} className="w-full text-xs p-2 border border-gray-300 rounded bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all disabled:bg-gray-100 disabled:text-gray-400 h-14 resize-none custom-scroll leading-tight" />
                      )}
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-red-600 mb-0.5">Negative Metadata</label>
                      { _c1 ? (
                        <div className="w-full border border-red-200 rounded p-2 text-sm h-14 bg-red-50 flex flex-col items-center justify-center">
                           <a href={String.fromCharCode(104,116,116,112,115,58,47,47,108,121,110,107,46,105,100,47,105,115,97,112,114,111,106,101,99,116)} target="_blank" rel="noreferrer" className="text-red-600 font-bold hover:underline tracking-wide">
                              {String.fromCharCode(104,116,116,112,115,58,47,47,108,121,110,107,46,105,100,47,105,115,97,112,114,111,106,101,99,116)}
                           </a>
                        </div>
                      ) : (
                        <textarea value={settings.negativeMetadata} onChange={e => setSettings({...settings, negativeMetadata: e.target.value})} disabled={isAppLocked} className="w-full text-xs p-2 border border-red-200 rounded bg-red-50/30 text-gray-900 focus:ring-2 focus:ring-red-500 focus:outline-none transition-all disabled:bg-gray-100 disabled:text-gray-400 h-14 resize-none custom-scroll leading-tight" />
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <div className="shrink-0 p-4 bg-slate-50 border-t border-slate-200 flex flex-col gap-4 z-10">
              
              <div className={`bg-white rounded-lg border ${getStatusBorderColor()} shadow-sm transition-all duration-300 overflow-hidden`}>
                  <div className="grid grid-cols-3 gap-0 border-b border-gray-100 p-2 bg-gray-50">
                      <div className="flex flex-col items-center justify-center border border-blue-200 rounded-lg bg-blue-50 py-1.5 shadow-sm transition-all">
                          <div className="flex items-center gap-1 mb-1 text-blue-600">
                              <ClockIcon />
                              <span className="text-xs font-medium capitalize leading-none">Selected</span>
                          </div>
                          <span className="text-xs font-black text-blue-600 tabular-nums">{countPending + countProcessing}</span>
                      </div>
                      <div className="mx-1.5 flex flex-col items-center justify-center border border-green-200 rounded-lg bg-green-50 py-1.5 shadow-sm transition-all">
                          <div className="flex items-center gap-1 mb-1 text-green-600">
                              <CheckCircleIcon />
                              <span className="text-xs font-medium capitalize leading-none">Completed</span>
                          </div>
                          <span className="text-xs font-black text-green-700 tabular-nums">{completedCount}</span>
                      </div>
                      <div className="flex flex-col items-center justify-center border border-red-200 rounded-lg bg-red-50 py-1.5 shadow-sm transition-all">
                          <div className="flex items-center gap-1 mb-1 text-red-600">
                              <XCircleIcon />
                              <span className="text-xs font-medium capitalize leading-none">Failed</span>
                          </div>
                          <span className="text-xs font-black text-red-700 tabular-nums">{failedCount}</span>
                      </div>
                  </div>
                  <div className="p-3 bg-white flex items-center justify-between gap-3">
                      <button 
                          onClick={promptClearAll} 
                          disabled={isAppLocked || files.length === 0 || _c3 || isZipping} 
                          className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-sm font-bold uppercase tracking-wide rounded border transition-colors ${files.length > 0 && (!isCurrentTabProcessing || isCurrentTabPaused) && !_c3 && !isZipping ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed opacity-50'}`}
                      >
                          <Trash2Icon /> CLEAR ALL
                      </button>
                  </div>
              </div>

              <div className="flex gap-1.5 h-10">
                  {isCurrentTabProcessing ? (
                      <div className={`flex-1 bg-gradient-to-r border text-xs font-bold rounded-lg flex items-center justify-center gap-2 shadow-sm select-none transition-all duration-300 ${getLoadingButtonStyle()}`}>
                          <SparklesIcon className={`w-4 h-4 ${isPaused ? '' : 'animate-spin'} ${getLoadingIconColor()}`} style={{ animationDuration: '3s' }} />
                          <span className="uppercase truncate tracking-wide">{isPaused ? 'Terhenti' : 'Memproses...'}</span>
                      </div>
                  ) : (
                      <button 
                          onClick={() => generateMetadata(false)} 
                          disabled={!canGenerate || _c3} 
                          className={`flex-1 text-xs font-bold rounded-lg border shadow transition-colors flex items-center justify-center gap-2 uppercase tracking-wide truncate ${canGenerate && !_c3 ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700 hover:-translate-y-0.5 duration-200' : 'bg-slate-100 border-slate-200 cursor-not-allowed text-slate-400'}`}
                      >
                          <Wand2Icon className="w-3 h-3" />
                          <span className="truncate">Generate Metadata</span>
                      </button>
                  )}

                  <button 
                      onClick={handlePauseResume} 
                      disabled={!canPauseResume || _c3} 
                      className={`w-10 h-10 flex items-center justify-center rounded-lg border shadow-sm transition-all active:scale-95 shrink-0 ${!canPauseResume || _c3 ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : isCurrentTabPaused ? 'bg-green-600 border-green-700 text-white hover:bg-green-700 hover:-translate-y-0.5 duration-200' : 'bg-amber-100 border-amber-300 text-amber-600 hover:bg-amber-200 hover:-translate-y-0.5 duration-200'}`}
                  >
                      {isCurrentTabPaused ? <PlayIcon /> : <PauseIcon />}
                  </button>

                  <button 
                      onClick={handleExportCSV} 
                      disabled={!isCsvActive || _c3 || isZipping} 
                      className={`flex-1 text-xs font-bold rounded-lg border shadow transition-colors flex items-center justify-center gap-2 uppercase tracking-wide truncate ${(isCsvActive && !_c3 && !isZipping) ? 'bg-green-600 hover:bg-green-700 text-white border-green-700 hover:-translate-y-0.5 duration-200' : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-80'}`}
                  >
                      {isZipping ? <SparklesIcon className="w-4 h-4 animate-spin text-slate-400" /> : <DownloadIcon />}
                      <span className="truncate">Export {isBackupMode ? 'JSON' : isZipMode ? 'ZIP' : 'CSV'}</span>
                  </button>
              </div>

            </div>
          </aside>

          <section className="flex-1 flex flex-col lg:overflow-hidden relative min-h-0 bg-slate-100">
            <div className="flex-1 p-4 lg:overflow-y-auto custom-scroll pb-20 lg:pb-4">
              {files.length > 0 ? (
                
                <div className="grid gap-4 items-start" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
                  {files.map(f => (
                    <div key={f.id} className={`bg-white hover:shadow-md rounded-lg shadow-sm border flex flex-col transition-all duration-300 ${f.status === 'processing' ? 'border-blue-400 ring-2 ring-blue-100' : f.status === 'failed' ? 'border-red-300' : 'border-blue-200'}`}>
                      
                      <div className="grid grid-cols-4 gap-2 p-2 bg-blue-50/50 border-b border-blue-100 rounded-t-lg shrink-0">
                        <button onClick={() => setPreviewFile(f)} disabled={_c3} className="flex flex-row items-center justify-center gap-1.5 py-1.5 rounded border bg-white border-blue-200 text-blue-600 hover:bg-blue-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed" title="Preview File">
                          <EyeIcon />
                          <span className="text-[10px] font-bold uppercase tracking-tight truncate">Prev</span>
                        </button>
                        <button disabled={f.status !== 'done' || _c3} onClick={() => setEditingFile({...f})} className="flex flex-row items-center justify-center gap-1.5 py-1.5 rounded border bg-white border-blue-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed" title="Edit Metadata">
                          <EditIcon />
                          <span className="text-[10px] font-bold uppercase tracking-tight truncate">Edit</span>
                        </button>
                        <button disabled={f.status !== 'done' || _c3} onClick={() => toggleLang(f.id)} className={`flex flex-row items-center justify-center gap-1.5 py-1.5 rounded border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${f.displayLang === 'EN' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'} hover:brightness-95`} title="Toggle Language">
                          <LangIcon />
                          <span className="text-[10px] font-bold uppercase tracking-tight truncate">{f.displayLang}</span>
                        </button>
                        <button disabled={isAppLocked || _c3 || isZipping} onClick={() => promptRemoveFile(f.id)} className="flex flex-row items-center justify-center gap-1.5 py-1.5 rounded border bg-white border-blue-200 text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed" title="Delete File">
                          <TrashIcon />
                          <span className="text-[10px] font-bold uppercase tracking-tight truncate">Del</span>
                        </button>
                      </div>

                      <div className="p-2 border-b border-blue-100 flex justify-between items-center gap-1 shrink-0 bg-white relative">
                        <p className="text-[12px] font-bold text-slate-800 truncate" title={f.file?.name}>{f.file?.name}</p>
                        <span className={`text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded border whitespace-nowrap ${f.status === 'done' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : f.status === 'processing' ? 'bg-blue-50 text-blue-700 border-blue-200' : f.status === 'failed' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                          {f.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="p-2 w-full h-[150px] bg-white rounded-b-lg relative flex flex-col">
                        <div className="flex-1 overflow-x-hidden overflow-y-auto break-words custom-scroll flex flex-col gap-2.5 text-[11px] leading-snug whitespace-normal border border-blue-200 bg-blue-50/10 rounded p-1.5 relative">
                          {f.status === 'done' ? (
                            <>
                              <div className={isAdobe || isDream || isArab || isBackupMode || isZipMode || isVcg ? 'text-blue-600' : 'text-slate-500'}>
                                <div className="text-[9px] font-bold mb-0.5 flex items-center gap-1 uppercase tracking-widest opacity-80">
                                  Title
                                  <button onClick={() => handleCopyClick(f.displayLang === 'EN' ? f.metadata.title_en : f.displayLang === 'ID' ? f.metadata.title_id : f.metadata.title_zh, `${f.id}-title`)} className={`transition-colors ${copiedId === `${f.id}-title` ? 'text-blue-500 scale-110' : 'text-inherit hover:opacity-70'}`} title="Salin Title"><CopyIcon /></button>
                                </div>
                                <div className="font-medium">{f.displayLang === 'EN' ? f.metadata.title_en : f.displayLang === 'ID' ? f.metadata.title_id : f.metadata.title_zh}</div>
                              </div>
                              
                              <div className={isShutter || isDream || isBackupMode || isZipMode || isVcg ? 'text-blue-600' : 'text-slate-500'}>
                                <div className="text-[9px] font-bold mb-0.5 flex items-center gap-1 uppercase tracking-widest opacity-80">
                                  Deskripsi
                                  <button onClick={() => handleCopyClick(f.displayLang === 'EN' ? f.metadata.description_en : f.displayLang === 'ID' ? f.metadata.description_id : f.metadata.description_zh, `${f.id}-desc`)} className={`transition-colors ${copiedId === `${f.id}-desc` ? 'text-blue-500 scale-110' : 'text-inherit hover:opacity-70'}`} title="Salin Deskripsi"><CopyIcon /></button>
                                </div>
                                <div className="font-medium">
                                  {f.displayLang === 'EN' ? f.metadata.description_en : f.displayLang === 'ID' ? f.metadata.description_id : f.metadata.description_zh}
                                  {_c3 && (
                                    <a href={String.fromCharCode(104,116,116,112,115,58,47,47,108,121,110,107,46,105,100,47,105,115,97,112,114,111,106,101,99,116)} target="_blank" rel="noreferrer" className="block mt-1 hover:underline break-all font-black text-inherit">
                                      {String.fromCharCode(104,116,116,112,115,58,47,47,108,121,110,107,46,105,100,47,105,115,97,112,114,111,106,101,99,116)}
                                    </a>
                                  )}
                                </div>
                              </div>
                              
                              <div className="text-blue-600">
                                <div className="text-[9px] font-bold mb-0.5 flex items-center gap-1 uppercase tracking-widest opacity-80">
                                  {isArab ? 'Tag' : 'Keyword'}
                                  <button onClick={() => handleCopyClick(f.displayLang === 'EN' ? f.metadata.keywords_en : f.displayLang === 'ID' ? f.metadata.keywords_id : f.metadata.keywords_zh, `${f.id}-key`)} className={`transition-colors ${copiedId === `${f.id}-key` ? 'text-blue-500 scale-110' : 'text-inherit hover:opacity-70'}`} title={isArab ? "Salin Tag" : "Salin Keyword"}><CopyIcon /></button>
                                </div>
                                <div className="font-medium">{f.displayLang === 'EN' ? f.metadata.keywords_en : f.displayLang === 'ID' ? f.metadata.keywords_id : f.metadata.keywords_zh}</div>
                              </div>

                              <div className={isAdobe || isBackupMode || isZipMode ? 'text-blue-600' : 'text-slate-500'}>
                                <div className="text-[9px] font-bold mb-0.5 uppercase tracking-widest opacity-80">Kategori Adobe</div>
                                <div className="font-medium">{translateCat(f.metadata.category_adobe, ADOBE_CATEGORIES, f.displayLang)}</div>
                              </div>

                              <div className={isShutter || isBackupMode || isZipMode ? 'text-blue-600' : 'text-slate-500'}>
                                <div className="text-[9px] font-bold mb-0.5 uppercase tracking-widest opacity-80">Kat. Shutterstock</div>
                                <div className="font-medium">
                                  {f.metadata.category_shutterstock.split(',').map(c => translateCat(c.trim(), isVideoFile(f.file?.name || '') ? SHUTTERSTOCK_VIDEO_CATEGORIES : SHUTTERSTOCK_IMAGE_VECTOR_CATEGORIES, f.displayLang)).join(', ')}
                                </div>
                              </div>

                              <div className={isDream || isBackupMode || isZipMode ? 'text-blue-600' : 'text-slate-500'}>
                                <div className="text-[9px] font-bold mb-0.5 uppercase tracking-widest opacity-80">Kat. Dreamstime</div>
                                <div className="flex flex-col font-medium">
                                  {f.metadata.category_dreamstime && f.metadata.category_dreamstime.map((cat, idx) => {
                                    const dtObj = DREAMSTIME_CATEGORIES.find(c => c.en === cat);
                                    const idStr = dtObj ? `[${dtObj.id}] ` : '';
                                    return <span key={idx}>Cat {idx+1}: {idStr}{translateCat(cat, DREAMSTIME_CATEGORIES, f.displayLang)}</span>;
                                  })}
                                </div>
                              </div>
                              
                              <div className={isMiri || isBackupMode || isZipMode ? 'text-blue-600' : 'text-slate-500'}>
                                <div className="text-[9px] font-bold mb-0.5 uppercase tracking-widest opacity-80">TYPE & TIER MIRICANVAS</div>
                                <div className="font-medium flex flex-col">
                                  <span>Type: {f.metadata.miricanvas_type}</span>
                                  <span>Tier: {f.metadata.miricanvas_tier}</span>
                                </div>
                              </div>

                              <div className={isVcg || isBackupMode || isZipMode ? 'text-blue-600' : 'text-slate-500'}>
                                <div className="text-[9px] font-bold mb-0.5 uppercase tracking-widest opacity-80">Kategori 500px (VCG)</div>
                                <div className="font-medium">
                                  {f.metadata.category_vcg ? translateVcgCat(f.metadata.category_vcg, f.displayLang) : <span className="italic text-slate-400">Tidak ada (Video)</span>}
                                </div>
                              </div>
                            </>
                          ) : f.status === 'failed' ? (
                             <pre className="text-[10px] text-red-600 font-mono whitespace-pre-wrap font-bold m-auto">
                               {f.errorMessage || "Gagal memproses."}
                             </pre>
                          ) : f.status === 'processing' ? (
                             <div className="flex flex-col gap-2 items-center justify-center text-[11px] font-bold text-blue-500 h-full m-auto">
                               <svg className="animate-spin h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                               </svg>
                               <span className="tracking-widest uppercase text-[9px]">Processing...</span>
                             </div>
                          ) : (
                             <div className="flex items-center justify-center text-[10px] font-bold uppercase tracking-widest text-slate-400 h-full m-auto">
                               Menunggu...
                             </div>
                          )}
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center w-full h-full min-h-[50vh]">
                  <div className="w-16 h-16 bg-white shadow-sm border border-blue-200 text-blue-400 rounded-full flex items-center justify-center mb-4">
                    <UploadCloudIcon />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Area Media</h3>
                  <p className="text-slate-500 text-sm max-w-md">Unggah file dari panel sebelah kiri.<br/>Kartu akan tampil responsif mengikuti ukuran layar perangkat Anda.</p>
                </div>
              )}
            </div>
          </section>
        </main>

        {previewFile && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm transition-opacity" onClick={() => setPreviewFile(null)}>
            <div className="relative bg-white rounded-xl shadow-2xl p-3 max-w-[95vw] max-h-[95vh] w-fit mx-auto flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-3 shrink-0 w-0 min-w-full">
                <div className="flex-1 overflow-x-auto whitespace-nowrap custom-scroll mr-3">
                  <h3 className="font-bold text-sm text-slate-800" title={previewFile.file?.name}>
                    {previewFile.file?.name}
                  </h3>
                </div>
                <button className="text-slate-400 hover:text-slate-900 transition bg-slate-100 hover:bg-slate-200 p-1.5 rounded-lg shrink-0" onClick={() => setPreviewFile(null)}>
                  <CloseIcon />
                </button>
              </div>
              <div className="flex items-center justify-center bg-slate-100/50 rounded-lg overflow-hidden min-w-[200px] min-h-[100px]">
                {isVideoFile(previewFile.file?.name || '') ? (
                  <video src={previewFile.url} controls className="max-w-full max-h-[calc(90vh-80px)] object-contain" />
                ) : (previewFile.file?.name.toLowerCase().endsWith('.eps') || previewFile.file?.name.toLowerCase().endsWith('.ai')) && !previewFile.isConverted ? (
                  <div className="w-[300px] h-[300px] flex flex-col items-center justify-center bg-slate-50 text-slate-400 p-6 select-none">
                    <svg className="w-16 h-16 text-blue-400 mb-3 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    <span className="text-xs font-bold uppercase tracking-widest text-center text-blue-500">MENGHUBUNGI SERVER...</span>
                    <span className="text-[10px] text-slate-400 mt-1 uppercase text-center">Sedang memproses preview vektor</span>
                  </div>
                ) : (
                  <img src={previewFile.url} className="max-w-full max-h-[calc(90vh-80px)] object-contain" alt="Preview" />
                )}
              </div>
            </div>
          </div>
        )}

        {editingFile && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm transition-opacity" onClick={() => setEditingFile(null)}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl flex flex-col overflow-hidden max-h-[90vh]" onClick={e => e.stopPropagation()}>
              <div className="p-3 border-b flex justify-between items-center bg-slate-50 shrink-0">
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2"><EditIcon /> Edit & Sinkronisasi Cerdas</h3>
                <span className="text-[11px] font-bold bg-slate-200 px-2 py-1 rounded text-slate-700">Versi: {editingFile.displayLang}</span>
              </div>
              <div className="p-4 space-y-3 overflow-y-auto custom-scroll">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Judul ({editingFile.displayLang})</label>
                  <textarea className="w-full border rounded p-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50" rows={2} value={editingFile.displayLang === 'EN' ? editingFile.metadata.title_en : editingFile.displayLang === 'ID' ? editingFile.metadata.title_id : editingFile.metadata.title_zh} onChange={e => { const key = editingFile.displayLang === 'EN' ? 'title_en' : editingFile.displayLang === 'ID' ? 'title_id' : 'title_zh'; setEditingFile({...editingFile, metadata: {...editingFile.metadata, [key]: e.target.value}}); }} />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Deskripsi ({editingFile.displayLang})</label>
                  <textarea className="w-full border rounded p-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50" rows={3} value={editingFile.displayLang === 'EN' ? editingFile.metadata.description_en : editingFile.displayLang === 'ID' ? editingFile.metadata.description_id : editingFile.metadata.description_zh} onChange={e => { const key = editingFile.displayLang === 'EN' ? 'description_en' : editingFile.displayLang === 'ID' ? 'description_id' : 'description_zh'; setEditingFile({...editingFile, metadata: {...editingFile.metadata, [key]: e.target.value}}); }} />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Keywords ({editingFile.displayLang})</label>
                  <textarea className="w-full border rounded p-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50" rows={4} value={editingFile.displayLang === 'EN' ? editingFile.metadata.keywords_en : editingFile.displayLang === 'ID' ? editingFile.metadata.keywords_id : editingFile.metadata.keywords_zh} onChange={e => { const key = editingFile.displayLang === 'EN' ? 'keywords_en' : editingFile.displayLang === 'ID' ? 'keywords_id' : 'keywords_zh'; setEditingFile({...editingFile, metadata: {...editingFile.metadata, [key]: e.target.value}}); }} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 border-t pt-3">
                  <div className="col-span-1 flex flex-col gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Kategori Adobe</label>
                      <select className="w-full border rounded p-2 text-[10px] focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={editingFile.metadata.category_adobe || ADOBE_CATEGORIES[0].en} onChange={e => setEditingFile({...editingFile, metadata: {...editingFile.metadata, category_adobe: e.target.value}})}>
                        {ADOBE_CATEGORIES.map(c => <option key={c.en} value={c.en}>{translateCat(c.en, ADOBE_CATEGORIES, editingFile.displayLang)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Kat Shutterstock</label>
                      <div className="flex flex-col gap-1.5">
                        {[0, 1].map(idx => (
                          <select key={idx} className="w-full border rounded p-2 text-[10px] focus:ring-2 focus:ring-blue-500 outline-none bg-white" 
                            value={editingFile.metadata.category_shutterstock.split(',')[idx]?.trim() || (isVideoFile(editingFile.file?.name || '') ? SHUTTERSTOCK_VIDEO_CATEGORIES[idx].en : SHUTTERSTOCK_IMAGE_VECTOR_CATEGORIES[idx].en)} 
                            onChange={e => {
                              const activeDict = isVideoFile(editingFile.file?.name || '') ? SHUTTERSTOCK_VIDEO_CATEGORIES : SHUTTERSTOCK_IMAGE_VECTOR_CATEGORIES;
                              const cats = editingFile.metadata.category_shutterstock.split(',').map(c=>c.trim());
                              cats[0] = cats[0] || activeDict[0].en; cats[1] = cats[1] || activeDict[1].en;
                              cats[idx] = e.target.value;
                              setEditingFile({...editingFile, metadata: {...editingFile.metadata, category_shutterstock: cats.join(', ')}});
                            }}>
                            {(isVideoFile(editingFile.file?.name || '') ? SHUTTERSTOCK_VIDEO_CATEGORIES : SHUTTERSTOCK_IMAGE_VECTOR_CATEGORIES).map(c => <option key={c.en} value={c.en}>{translateCat(c.en, isVideoFile(editingFile.file?.name || '') ? SHUTTERSTOCK_VIDEO_CATEGORIES : SHUTTERSTOCK_IMAGE_VECTOR_CATEGORIES, editingFile.displayLang)}</option>)}
                          </select>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="col-span-1">
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Kat Dreamstime</label>
                    <div className="flex flex-col gap-1.5">
                      {[0,1,2].map(idx => (
                        <select key={idx} className="w-full border rounded p-2 text-[10px] focus:ring-2 focus:ring-blue-500 outline-none bg-white" 
                          value={editingFile.metadata.category_dreamstime?.[idx] || DREAMSTIME_CATEGORIES[idx].en} 
                          onChange={e => {
                            const newDream = [...(editingFile.metadata.category_dreamstime || [DREAMSTIME_CATEGORIES[0].en, DREAMSTIME_CATEGORIES[1].en, DREAMSTIME_CATEGORIES[2].en])];
                            newDream[idx] = e.target.value;
                            setEditingFile({...editingFile, metadata: {...editingFile.metadata, category_dreamstime: newDream}});
                          }}>
                          {DREAMSTIME_CATEGORIES.map(c => <option key={c.id} value={c.en}>{`[${c.id}] ${translateCat(c.en, DREAMSTIME_CATEGORIES, editingFile.displayLang)}`}</option>)}
                        </select>
                      ))}
                    </div>
                  </div>
                  
                  <div className="col-span-1 flex flex-col gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">MiriCanvas Type</label>
                      <select className="w-full border rounded p-2 text-[10px] focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={editingFile.metadata.miricanvas_type || 'Photo'} onChange={e => setEditingFile({...editingFile, metadata: {...editingFile.metadata, miricanvas_type: e.target.value}})}>
                        {['Photo', 'Photo(Cut-out)', 'SVG element', 'PNG element', 'Background', 'GIF', 'Video'].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">MiriCanvas Tier</label>
                      <select className="w-full border rounded p-2 text-[10px] focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={editingFile.metadata.miricanvas_tier || 'Premium'} onChange={e => setEditingFile({...editingFile, metadata: {...editingFile.metadata, miricanvas_tier: e.target.value}})}>
                        {['Premium', 'Standard'].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="col-span-1 flex flex-col gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Kategori 500px (VCG)</label>
                      <select className="w-full border rounded p-2 text-[10px] focus:ring-2 focus:ring-blue-500 outline-none bg-white" disabled={isVideoFile(editingFile.file?.name || '')} value={editingFile.metadata.category_vcg || VCG_CATEGORIES[0].zh} onChange={e => setEditingFile({...editingFile, metadata: {...editingFile.metadata, category_vcg: e.target.value}})}>
                        {isVideoFile(editingFile.file?.name || '') ? (
                           <option value="">Video (Kosong)</option>
                        ) : (
                           VCG_CATEGORIES.map(c => <option key={c.id} value={c.zh}>{translateVcgCat(c.zh, editingFile.displayLang)}</option>)
                        )}
                      </select>
                    </div>
                  </div>
                </div>

              </div>
              <div className="p-3 border-t bg-slate-50 flex justify-between items-center shrink-0 rounded-b-lg">
                <span className="text-[10px] text-slate-400 italic hidden sm:block">*AI akan menyinkronkan terjemahan otomatis.</span>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button onClick={() => setEditingFile(null)} className="flex-1 sm:flex-none px-4 py-1.5 text-sm font-bold bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-lg transition">Batal</button>
                  <button onClick={saveEdit} className="flex-1 sm:flex-none px-5 py-1.5 text-sm font-bold bg-slate-800 text-white rounded-lg hover:bg-slate-900 shadow-sm transition">Simpan</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {fileToDelete && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
             <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm flex flex-col items-center text-center">
                <div className="bg-red-100 p-3 rounded-full mb-3">
                  <AlertTriangleIcon />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Hapus File?</h3>
                <p className="text-sm text-slate-600 mt-2 mb-6">Apakah Anda yakin ingin menghapus file ini dari daftar?</p>
                <div className="flex w-full gap-3">
                   <button onClick={() => setFileToDelete(null)} className="flex-1 bg-slate-200 text-slate-700 font-bold py-2 rounded-lg hover:bg-slate-300 transition">Batal</button>
                   <button onClick={confirmDeleteFile} className="flex-1 bg-red-600 text-white font-bold py-2 rounded-lg hover:bg-red-700 transition shadow-sm">Ya, Hapus</button>
                </div>
             </div>
          </div>
        )}

        {clearAllConfirm && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
             <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm flex flex-col items-center text-center">
                <div className="bg-red-100 p-3 rounded-full mb-3">
                  <AlertTriangleIcon />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Hapus Semua File?</h3>
                <p className="text-sm text-slate-600 mt-2 mb-6">Anda akan menghapus <b>semua file</b> dari daftar. Semua hasil metadata akan hilang.</p>
                <div className="flex w-full gap-3">
                   <button onClick={() => setClearAllConfirm(false)} className="flex-1 bg-slate-200 text-slate-700 font-bold py-2 rounded-lg hover:bg-slate-300 transition">Batal</button>
                   <button onClick={confirmClearAllAction} className="flex-1 bg-red-600 text-white font-bold py-2 rounded-lg hover:bg-red-700 transition shadow-sm">Ya, Hapus Semua</button>
                </div>
             </div>
          </div>
        )}

      </div>
    </>
  );
}