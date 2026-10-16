import type { Lang } from "./types";

const dict = {
  scroll: { uz: "Pastga suring", ru: "Листайте вниз", en: "Scroll down" },
  dateTitle: { uz: "Sana va vaqt", ru: "Дата и время", en: "Date & time" },
  countdown: { uz: "To'ygacha qolgan vaqt", ru: "До торжества осталось", en: "Time until the celebration" },
  days: { uz: "kun", ru: "дней", en: "days" },
  hours: { uz: "soat", ru: "часов", en: "hours" },
  minutes: { uz: "daqiqa", ru: "минут", en: "minutes" },
  seconds: { uz: "soniya", ru: "секунд", en: "seconds" },
  started: { uz: "Bayram boshlandi!", ru: "Праздник начался!", en: "The celebration has begun!" },
  program: { uz: "To'y dasturi", ru: "Программа", en: "Programme" },
  location: { uz: "Manzil", ru: "Место проведения", en: "Location" },
  openMaps: { uz: "Xaritada ochish", ru: "Открыть в картах", en: "Open in Maps" },
  gallery: { uz: "Suratlar", ru: "Фотографии", en: "Gallery" },
  rsvpTitle: { uz: "Tashrifingizni tasdiqlang", ru: "Подтвердите присутствие", en: "Kindly RSVP" },
  name: { uz: "Ismingiz", ru: "Ваше имя", en: "Your name" },
  guests: { uz: "Mehmonlar soni", ru: "Количество гостей", en: "Number of guests" },
  willCome: { uz: "Kelaman", ru: "Приду", en: "I'll be there" },
  wontCome: { uz: "Kela olmayman", ru: "Не смогу", en: "Can't make it" },
  wish: { uz: "Tilaklaringiz (ixtiyoriy)", ru: "Пожелания (необязательно)", en: "Wishes (optional)" },
  send: { uz: "Yuborish", ru: "Отправить", en: "Send" },
  sent: { uz: "Rahmat! Javobingiz qabul qilindi.", ru: "Спасибо! Ответ получен.", en: "Thank you! Your reply was received." },
  error: { uz: "Xatolik yuz berdi", ru: "Произошла ошибка", en: "Something went wrong" },
  previewNote: {
    uz: "Bu namuna. Javob yuborish uchun taklifnomani saqlang.",
    ru: "Это образец. Сохраните приглашение, чтобы принимать ответы.",
    en: "This is a sample. Save the invitation to collect replies.",
  },
  music: { uz: "Musiqa", ru: "Музыка", en: "Music" },
  weekdays: {
    uz: "Yakshanba,Dushanba,Seshanba,Chorshanba,Payshanba,Juma,Shanba",
    ru: "Воскресенье,Понедельник,Вторник,Среда,Четверг,Пятница,Суббота",
    en: "Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday",
  },
  months: {
    uz: "yanvar,fevral,mart,aprel,may,iyun,iyul,avgust,sentabr,oktabr,noyabr,dekabr",
    ru: "января,февраля,марта,апреля,мая,июня,июля,августа,сентября,октября,ноября,декабря",
    en: "January,February,March,April,May,June,July,August,September,October,November,December",
  },
} satisfies Record<string, Record<Lang, string>>;

export type TKey = keyof typeof dict;
export const t = (k: TKey, lang: Lang) => dict[k][lang];

export function formatDate(date: string, lang: Lang) {
  const [y = 2026, m = 1, d = 1] = date.split("-").map(Number);
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const month = t("months", lang).split(",")[m - 1];
  const weekday = t("weekdays", lang).split(",")[wd];
  if (lang === "en") return { line: `${month} ${d}, ${y}`, weekday };
  if (lang === "ru") return { line: `${d} ${month} ${y}`, weekday };
  return { line: `${d}-${month}, ${y}-yil`, weekday };
}
