"use client";

import { Card } from "@/components/ui/card";

type IconItem = {
  emoji: string;
  label: string;
  gradient: string;
};

type IconGroup = {
  title: string;
  items: IconItem[];
};

const groups: IconGroup[] = [
  {
    title: "Цикл и кровотечение",
    items: [
      { emoji: "🩸", label: "Месячные", gradient: "from-[#FF6B8A] to-[#FF3D6B]" },
      { emoji: "💧", label: "Кровотечение", gradient: "from-[#FF8A8A] to-[#E05A5A]" },
      { emoji: "🌊", label: "Обильность", gradient: "from-[#FF7EB3] to-[#FF4081]" },
      { emoji: "🔴", label: "Интенсивность", gradient: "from-[#E57373] to-[#C62828]" },
      { emoji: "⭕", label: "Цикл", gradient: "from-[#F48FB1] to-[#E91E63]" },
    ],
  },
  {
    title: "Боль и симптомы",
    items: [
      { emoji: "😣", label: "Боль", gradient: "from-[#FFB74D] to-[#FF8F00]" },
      { emoji: "🤕", label: "Головная боль", gradient: "from-[#FFCC80] to-[#EF6C00]" },
      { emoji: "😖", label: "Спазмы", gradient: "from-[#FFE082] to-[#F57F17]" },
      { emoji: "🫠", label: "Усталость", gradient: "from-[#FFAB91] to-[#D84315]" },
      { emoji: "🤢", label: "Тошнота", gradient: "from-[#C5E1A5] to-[#689F38]" },
    ],
  },
  {
    title: "Настроение",
    items: [
      { emoji: "😊", label: "Хорошее", gradient: "from-[#CE93D8] to-[#9C27B0]" },
      { emoji: "😌", label: "Спокойно", gradient: "from-[#B39DDB] to-[#7E57C2]" },
      { emoji: "😢", label: "Грусть", gradient: "from-[#90CAF9] to-[#1565C0]" },
      { emoji: "😤", label: "Раздражение", gradient: "from-[#EF9A9A] to-[#C62828]" },
      { emoji: "😰", label: "Тревога", gradient: "from-[#FFCC80] to-[#E65100]" },
      { emoji: "🥰", label: "Радость", gradient: "from-[#F48FB1] to-[#AD1457]" },
      { emoji: "😐", label: "Перепады", gradient: "from-[#B0BEC5] to-[#546E7A]" },
    ],
  },
  {
    title: "Сон",
    items: [
      { emoji: "😴", label: "Сон", gradient: "from-[#7986CB] to-[#303F9F]" },
      { emoji: "🌙", label: "Ночь", gradient: "from-[#5C6BC0] to-[#1A237E]" },
      { emoji: "😪", label: "Бессонница", gradient: "from-[#9FA8DA] to-[#3F51B5]" },
      { emoji: "🛌", label: "Качество сна", gradient: "from-[#7C4DFF] to-[#4527A0]" },
      { emoji: "⏰", label: "Часы сна", gradient: "from-[#448AFF] to-[#0D47A1]" },
    ],
  },
  {
    title: "Энергия и активность",
    items: [
      { emoji: "⚡", label: "Энергия", gradient: "from-[#FFD54F] to-[#F9A825]" },
      { emoji: "🔋", label: "Заряд", gradient: "from-[#AED581] to-[#33691E]" },
      { emoji: "🏃‍♀️", label: "Активность", gradient: "from-[#4FC3F7] to-[#0277BD]" },
      { emoji: "🧘‍♀️", label: "Йога", gradient: "from-[#80CBC4] to-[#00695C]" },
      { emoji: "🏋️‍♀️", label: "Тренировка", gradient: "from-[#FF8A65] to-[#BF360C]" },
      { emoji: "🚶‍♀️", label: "Прогулка", gradient: "from-[#81C784] to-[#2E7D32]" },
    ],
  },
  {
    title: "Питание и вода",
    items: [
      { emoji: "🍽️", label: "Еда", gradient: "from-[#A5D6A7] to-[#388E3C]" },
      { emoji: "🍶", label: "Вода", gradient: "from-[#4DD0E1] to-[#00838F]" },
      { emoji: "🥗", label: "Здоровая еда", gradient: "from-[#66BB6A] to-[#1B5E20]" },
      { emoji: "🍫", label: "Сладкое", gradient: "from-[#A1887F] to-[#4E342E]" },
      { emoji: "☕", label: "Кофе", gradient: "from-[#8D6E63] to-[#3E2723]" },
    ],
  },
  {
    title: "ПМС",
    items: [
      { emoji: "😤", label: "ПМС", gradient: "from-[#BA68C8] to-[#6A1B9A]" },
      { emoji: "🫃", label: "Вздутие", gradient: "from-[#FFB74D] to-[#E65100]" },
      { emoji: "🍪", label: "Тяга к еде", gradient: "from-[#BCAAA4] to-[#5D4037]" },
      { emoji: "😩", label: "Акне", gradient: "from-[#FFAB91] to-[#BF360C]" },
      { emoji: "🥵", label: "Приливы", gradient: "from-[#FF7043] to-[#B71C1C]" },
    ],
  },
  {
    title: "Фертильность и секс",
    items: [
      { emoji: "❤️", label: "Секс", gradient: "from-[#FF5252] to-[#B71C1C]" },
      { emoji: "💕", label: "Либидо", gradient: "from-[#FF80AB] to-[#C51162]" },
      { emoji: "🥚", label: "Овуляция", gradient: "from-[#FFE0B2] to-[#FF6F00]" },
      { emoji: "🔴", label: "Высокий риск", gradient: "from-[#FF1744] to-[#B71C1C]" },
      { emoji: "🟡", label: "Средний риск", gradient: "from-[#FFC107] to-[#FF6F00]" },
      { emoji: "🟢", label: "Низкий риск", gradient: "from-[#4CAF50] to-[#1B5E20]" },
    ],
  },
  {
    title: "Витамины и здоровье",
    items: [
      { emoji: "💊", label: "Витамины", gradient: "from-[#69F0AE] to-[#00C853]" },
      { emoji: "🩺", label: "Врач", gradient: "from-[#80DEEA] to-[#006064]" },
      { emoji: "🩸", label: "Железо", gradient: "from-[#EF9A9A] to-[#B71C1C]" },
      { emoji: "☀️", label: "Витамин D", gradient: "from-[#FFF59D] to-[#F57F17]" },
      { emoji: "✨", label: "Цинк", gradient: "from-[#E1BEE7] to-[#7B1FA2]" },
      { emoji: "🧠", label: "Витамин B", gradient: "from-[#B39DDB] to-[#4527A0]" },
    ],
  },
  {
    title: "Исламский режим",
    items: [
      { emoji: "🕌", label: "Ибада", gradient: "from-[#26C6DA] to-[#00695C]" },
      { emoji: "🌙", label: "Хайд", gradient: "from-[#5C6BC0] to-[#1A237E]" },
      { emoji: "📿", label: "Зикр", gradient: "from-[#4DB6AC] to-[#004D40]" },
      { emoji: "🤲", label: "Дуа", gradient: "from-[#7986CB] to-[#283593]" },
      { emoji: "📖", label: "Знание", gradient: "from-[#FFD54F] to-[#F57F17]" },
    ],
  },
  {
    title: "Общие",
    items: [
      { emoji: "📊", label: "Аналитика", gradient: "from-[#9575CD] to-[#4527A0]" },
      { emoji: "📋", label: "Отчёт", gradient: "from-[#FFD54F] to-[#FF8F00]" },
      { emoji: "👗", label: "Одежда", gradient: "from-[#F48FB1] to-[#AD1457]" },
      { emoji: "🔔", label: "Напоминание", gradient: "from-[#FFB74D] to-[#E65100]" },
      { emoji: "⚠️", label: "Внимание", gradient: "from-[#FF8A65] to-[#BF360C]" },
      { emoji: "📝", label: "Заметка", gradient: "from-[#B0BEC5] to-[#37474F]" },
      { emoji: "🏆", label: "Достижение", gradient: "from-[#FFD54F] to-[#FF6F00]" },
      { emoji: "👤", label: "Профиль", gradient: "from-[#90CAF9] to-[#1565C0]" },
      { emoji: "🔒", label: "Приватность", gradient: "from-[#A5D6A7] to-[#2E7D32]" },
    ],
  },
];

export default function IconsPage() {
  return (
    <div className="min-h-screen bg-mira-bg px-4 py-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-mira-text mb-1">Иконки для Mira</h1>
        <p className="text-sm text-mira-muted mb-6">Apple-стиль: emoji + градиент. Нажми чтобы увидеть как смотрится.</p>

        {groups.map(group => (
          <div key={group.title} className="mb-8">
            <p className="text-xs font-bold uppercase tracking-widest text-mira-muted mb-3">{group.title}</p>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
              {group.items.map(item => (
                <div key={item.label} className="flex flex-col items-center gap-2">
                  {/* Icon */}
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${item.gradient} shadow-lg transition-transform hover:scale-110 active:scale-95`}>
                    <span className="text-2xl drop-shadow-sm">{item.emoji}</span>
                  </div>
                  <span className="text-[10px] font-medium text-mira-text text-center leading-tight">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Size variants */}
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-mira-muted mb-3">Размеры</p>
          <div className="flex items-end gap-4">
            {[32, 40, 48, 56, 64].map(size => (
              <div key={size} className="flex flex-col items-center gap-1">
                <div className="flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF6B8A] to-[#FF3D6B] shadow-lg"
                  style={{ width: size, height: size, borderRadius: size * 0.3 }}>
                  <span style={{ fontSize: size * 0.5 }}>🩸</span>
                </div>
                <span className="text-[9px] text-mira-muted">{size}px</span>
              </div>
            ))}
          </div>
        </div>

        {/* Shape variants */}
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-mira-muted mb-3">Формы</p>
          <div className="flex items-center gap-4">
            {[
              { shape: "rounded-full", label: "Круг" },
              { shape: "rounded-2xl", label: "Скруглённый" },
              { shape: "rounded-xl", label: "Apple" },
              { shape: "rounded-lg", label: "Мягкий" },
            ].map(s => (
              <div key={s.label} className="flex flex-col items-center gap-2">
                <div className={`flex h-14 w-14 items-center justify-center ${s.shape} bg-gradient-to-br from-[#CE93D8] to-[#9C27B0] shadow-lg`}>
                  <span className="text-2xl">😊</span>
                </div>
                <span className="text-[9px] text-mira-muted">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* List style — Apple Health */}
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-mira-muted mb-3">Список (Apple Health стиль)</p>
          <Card className="divide-y divide-mira-lavender/10 p-0 overflow-hidden">
            {[
              { emoji: "🩸", label: "Дневник цикла", gradient: "from-[#FF6B8A] to-[#FF3D6B]" },
              { emoji: "😊", label: "Настроение", gradient: "from-[#CE93D8] to-[#9C27B0]" },
              { emoji: "😴", label: "Сон", gradient: "from-[#7986CB] to-[#303F9F]" },
              { emoji: "⚡", label: "Энергия", gradient: "from-[#FFD54F] to-[#F9A825]" },
              { emoji: "💊", label: "Витамины", gradient: "from-[#69F0AE] to-[#00C853]" },
              { emoji: "🍽️", label: "Питание", gradient: "from-[#A5D6A7] to-[#388E3C]" },
              { emoji: "🏋️‍♀️", label: "Тренировка", gradient: "from-[#FF8A65] to-[#BF360C]" },
              { emoji: "📊", label: "Аналитика", gradient: "from-[#9575CD] to-[#4527A0]" },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3 px-4 py-3 hover:bg-mira-bg transition cursor-pointer">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${item.gradient}`}>
                  <span className="text-base">{item.emoji}</span>
                </div>
                <span className="text-sm font-medium text-mira-text flex-1">{item.label}</span>
                <span className="text-mira-muted">›</span>
              </div>
            ))}
          </Card>
        </div>
        {/* ═══ 3 style variants comparison ═══ */}
        <div className="mb-8">
          <p className="text-lg font-bold text-mira-text mb-4">3 стиля — сравни</p>

          {/* Variant A: With gradient bg (current) */}
          <p className="text-xs font-bold uppercase tracking-widest text-mira-muted mb-3">Стиль А: Градиент + контейнер</p>
          <div className="grid grid-cols-5 gap-3 mb-8">
            {[
              { emoji: "🩸", label: "Месячные", gradient: "from-[#FF6B8A] to-[#FF3D6B]" },
              { emoji: "😣", label: "Боль", gradient: "from-[#FFB74D] to-[#FF8F00]" },
              { emoji: "😊", label: "Настроение", gradient: "from-[#CE93D8] to-[#9C27B0]" },
              { emoji: "😴", label: "Сон", gradient: "from-[#7986CB] to-[#303F9F]" },
              { emoji: "⚡", label: "Энергия", gradient: "from-[#FFD54F] to-[#F9A825]" },
              { emoji: "😤", label: "ПМС", gradient: "from-[#BA68C8] to-[#6A1B9A]" },
              { emoji: "❤️", label: "Секс", gradient: "from-[#FF5252] to-[#B71C1C]" },
              { emoji: "💊", label: "Витамины", gradient: "from-[#69F0AE] to-[#00C853]" },
              { emoji: "🍶", label: "Вода", gradient: "from-[#4DD0E1] to-[#00838F]" },
              { emoji: "📝", label: "Заметка", gradient: "from-[#B0BEC5] to-[#37474F]" },
            ].map(item => (
              <div key={item.label} className="flex flex-col items-center gap-1.5">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${item.gradient} shadow-lg`}>
                  <span className="text-2xl">{item.emoji}</span>
                </div>
                <span className="text-[9px] font-medium text-mira-text">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Variant B: No background — just emoji big */}
          <p className="text-xs font-bold uppercase tracking-widest text-mira-muted mb-3">Стиль Б: Только emoji (без контейнера)</p>
          <div className="grid grid-cols-5 gap-3 mb-8">
            {[
              { emoji: "🩸", label: "Месячные" },
              { emoji: "😣", label: "Боль" },
              { emoji: "😊", label: "Настроение" },
              { emoji: "😴", label: "Сон" },
              { emoji: "⚡", label: "Энергия" },
              { emoji: "😤", label: "ПМС" },
              { emoji: "❤️", label: "Секс" },
              { emoji: "💊", label: "Витамины" },
              { emoji: "🍶", label: "Вода" },
              { emoji: "📝", label: "Заметка" },
            ].map(item => (
              <div key={item.label} className="flex flex-col items-center gap-1.5">
                <span className="text-4xl transition-transform hover:scale-125 active:scale-90 cursor-pointer">{item.emoji}</span>
                <span className="text-[9px] font-medium text-mira-text">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Variant C: Soft circle bg — pastel */}
          <p className="text-xs font-bold uppercase tracking-widest text-mira-muted mb-3">Стиль В: Пастельный круг</p>
          <div className="grid grid-cols-5 gap-3 mb-8">
            {[
              { emoji: "🩸", label: "Месячные", bg: "bg-[#FFE0E8]" },
              { emoji: "😣", label: "Боль", bg: "bg-[#FFF0E0]" },
              { emoji: "😊", label: "Настроение", bg: "bg-[#F0E0FF]" },
              { emoji: "😴", label: "Сон", bg: "bg-[#E0E8FF]" },
              { emoji: "⚡", label: "Энергия", bg: "bg-[#FFF8E0]" },
              { emoji: "😤", label: "ПМС", bg: "bg-[#F0E0F8]" },
              { emoji: "❤️", label: "Секс", bg: "bg-[#FFE0E0]" },
              { emoji: "💊", label: "Витамины", bg: "bg-[#E0FFE8]" },
              { emoji: "🍶", label: "Вода", bg: "bg-[#E0F8FF]" },
              { emoji: "📝", label: "Заметка", bg: "bg-[#E8E8F0]" },
            ].map(item => (
              <div key={item.label} className="flex flex-col items-center gap-1.5">
                <div className={`flex h-14 w-14 items-center justify-center rounded-full ${item.bg} transition-transform hover:scale-110 active:scale-90 cursor-pointer`}>
                  <span className="text-2xl">{item.emoji}</span>
                </div>
                <span className="text-[9px] font-medium text-mira-text">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Side by side comparison */}
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-mira-muted mb-3">Боль — 3 стиля рядом</p>
          <div className="flex items-end justify-around">
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFB74D] to-[#FF8F00] shadow-lg">
                <span className="text-3xl">😣</span>
              </div>
              <span className="text-[10px] text-mira-muted">Градиент</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="text-5xl cursor-pointer hover:scale-110 transition">😣</span>
              <span className="text-[10px] text-mira-muted">Только emoji</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FFF0E0]">
                <span className="text-3xl">😣</span>
              </div>
              <span className="text-[10px] text-mira-muted">Пастель</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
