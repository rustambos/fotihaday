import g1 from "@/assets/g1.jpg";
import g2 from "@/assets/g2.jpg";
import type { InviteData } from "./types";

export const DEFAULT_INVITE: InviteData = {
  greeting: { uz: "Hurmatli mehmon!", ru: "Дорогой гость!", en: "Dear guest!" },
  hosts: { uz: "Botirjon & Mushtariybonu", ru: "Ботиржон и Муштарийбону", en: "Botirjon & Mushtariybonu" },
  title: { uz: "Nikoh to'yi", ru: "Свадебное торжество", en: "Wedding celebration" },
  welcome: {
    uz: "Sizni farzandlarimizning hayotidagi eng baxtli kun — to'y marosimiga taklif etamiz.",
    ru: "Приглашаем вас разделить с нами самый счастливый день в жизни наших детей.",
    en: "We invite you to share the happiest day in our children's lives with us.",
  },
  date: "2026-11-11",
  time: "18:00",
  venue: { uz: "Afrosiyob to'yxonasi", ru: "Банкетный зал «Афросиёб»", en: "Afrosiyob banquet hall" },
  address: { uz: "Farg'ona, Istiqlol ko'chasi, 10" },
  lat: null,
  lng: null,
  schedule: [
    { time: "18:00", label: { uz: "Mehmonlarni kutib olish", ru: "Встреча гостей", en: "Welcoming guests" } },
    { time: "19:00", label: { uz: "Nikoh marosimi va tabriklar", ru: "Церемония и поздравления", en: "Ceremony & toasts" } },
    { time: "20:00", label: { uz: "Ziyofat va dasturxon", ru: "Банкет", en: "Dinner" } },
    { time: "22:00", label: { uz: "Marosim yakuni", ru: "Завершение вечера", en: "Farewell" } },
  ],
  photos: [{ url: g1 }, { url: g2 }],
  musicUrl: "https://www.youtube.com/watch?v=Oa9aWdcCC4o",
  rsvpEnabled: true,
  maxGuests: 5,
  rsvpNote: {
    uz: "Iltimos, qarorlaringiz haqida bizni xabardor qiling.",
    ru: "Пожалуйста, сообщите нам о своём решении.",
    en: "Please let us know whether you can join us.",
  },
  thanks: { uz: "Rahmat!", ru: "Спасибо!", en: "Thank you!" },
};
