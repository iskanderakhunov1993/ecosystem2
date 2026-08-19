# Mira App (`apps/mira`)

Мобильное веб-приложение Mira: женский health-трекер с шестью адаптивными
режимами и одной дизайн-системой. Пакет самостоятельный и не пересекается с
`apps/web` (Next.js-версия продукта).

## Стек

React 18 · TypeScript · Vite · Tailwind (тема на CSS-переменных) · Zustand ·
IndexedDB через `idb`. Роутинга нет — это одна SPA-панель с пятью табами.

## Команды

```bash
npm install --prefix apps/mira
npm run dev --prefix apps/mira      # http://localhost:5180
npm run build --prefix apps/mira
npm run lint --prefix apps/mira     # tsc --noEmit
```

## Структура

```
src/
  components/   Ring, Chip, BottomSheet, ConfidenceTag, Card, KpiCard,
                DonutStat, EmptyChartCard, Toggle, ProfileFields, AppShell
  features/     onboarding, today (+ LogSheet, WorkoutSheet, MeditationTab),
                history, analytics, patterns, predictions, settings,
                life-stage-gate
  data/         modes.config.ts (life stages, поля онбординга, чипы лога,
                пулы тренировок), icons.tsx
  store/        appStore.ts (Zustand + запись в IndexedDB)
  db/           indexedDb.ts (схема и CRUD, запросы по диапазону дат)
  lib/          types.ts, derive.ts (расчёты цикла/срока/восстановления)
  styles/       tokens.css, index.css
```

## Ключевые продуктовые правила

- **Today = дашборд и ввод.** Тап по чипу открывает bottom sheet поверх Today;
  сохранение возвращает на Today. BottomSheet — единственный паттерн ввода.
- **Режим меняется только через Life-Stage Gate** (подтверждение жизненного
  события). Перименопауза — soft prompt, а не hard gate. Любое переключение
  можно отменить баннером на Today.
- **`logEvents` — единственный источник истины** для History, Analytics и
  Patterns. Лог append-only; «снимок» дня вычисляется из событий.
- **Честность вместо иллюзии точности.** Графики, паттерны и уверенность
  прогнозов зависят от реального количества записей; вместо моков —
  `EmptyChartCard` с объяснением, чего не хватает.
- **Локально-first.** Данные не уходят в облако; экспорт (JSON) и полное
  удаление доступны в настройках.

## Расчёты профиля

Профиль хранит введённые значения и `updatedAt`. Дашборд отсчитывает время от
этой точки, поэтому день цикла, срок беременности и дни после родов не
«замерзают» на дате регистрации. Перименопауза — сознательное исключение:
качественная метка без числового пересчёта.
