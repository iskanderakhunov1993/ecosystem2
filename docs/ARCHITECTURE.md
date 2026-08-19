# Livi: MVP architecture

## Product principle

Livi is not a calorie tracker or a static workout plan. Its primary product
object is a daily decision:

> Given the woman's current state, what type of movement and support is useful
> today?

Every feature either supplies context to that decision or helps the user act on
it with minimal input.

## MVP user flows

### Activation

1. Choose a goal and training level.
2. Select self-reported limitations without diagnosis language.
3. Optionally add cycle context and symptoms.
4. Complete a guided front, side and back body scan.
5. Receive the first explanation of how Livi will adapt the next day.

### Daily loop

1. Livi imports sleep and activity when available.
2. User completes a sub-minute energy, mood, soreness and pain check-in.
3. Decision engine computes readiness and chooses a session policy.
4. AI generates a structured workout from an approved exercise library.
5. During training, `pain` immediately removes the exercise and requests a
   safer alternative under the same constraints.
6. Post-workout feedback updates recovery and the next decision.

### Nutrition

1. User uploads a meal image.
2. Vision returns foods, portions, nutrient ranges and confidence.
3. User accepts or makes a quick correction.
4. The daily coach uses nutrition as a soft context signal, not a score of
   personal worth.

### Body scan

1. Guided capture validates light, framing and pose.
2. The system stores encrypted originals separately from derived landmarks.
3. Output is limited to visible change and fitness-oriented observations.
4. No diagnosis, body-fat claim, attractiveness score or medical conclusion.

## Repository structure

```text
apps/
  mira/                Vite + React 18 SPA — база продукта
  web/                 Next.js 15 — предыдущая версия, источник переноса
shared/                Общие контракты
supabase/
  migrations/          PostgreSQL schema and RLS
  functions/           Secure AI orchestration
deploy/                Конфигурация развёртывания
docs/
  ARCHITECTURE.md
  PRODUCT_SPEC.md
  UX_UI_SPEC.md
  AI_SPEC.md
```

Два приложения независимы: у каждого свой `package.json`, свой стор и своё
хранилище. Общего пакета домена пока нет — расчёты дублируются, и это осознанный
временный компромисс: выносить их в `packages/` имеет смысл, когда перенос
функциональности завершится и станет ясно, что именно общее.

## Frontend architecture

### Приложение в корне — база продукта

- React 18 + TypeScript + Vite. Роутинга нет: одна SPA-панель с двумя
  вкладками и уровнями вглубь через локальное состояние экрана.
- Состояние: Zustand (`store/appStore.ts`), запись в IndexedDB через `idb`.
- Границы фич: `today`, `cycle`, `doctor`, `analytics`, `patterns`,
  `predictions`, `onboarding`, `life-stage-gate`, `settings`.
  Последние три из аналитической группы — не вкладки, а экраны второго уровня
  внутри `cycle`.
- Тема на CSS-переменных; акцент режима перезаписывается в `applyAccent()`.

**`logEvents` — единственный источник истины.** Лог append-only; снимок дня,
календарные точки, аналитика, паттерны и отчёт врачу вычисляются из событий.
Запись за прошлый день ставится на полдень выбранной даты, чтобы не зависеть
от часового пояса. Будущие даты запрещены на уровне интерфейса.

### `legacy/web` — предыдущая версия

- Next.js 15 App Router + React 19.
- Состояние: Zustand с `persist` в localStorage, валидация Zod при регидрации.
- Supabase для авторизации и синхронизации.

Историческая особенность: в `legacy/web` два параллельных слоя персистентности —
zustand-стор и более старый `MiraLocalData` в `lib/store.ts`. Доменные модули
`lib/*` — чистые функции, принимающие `MiraLocalData` параметром, поэтому
проекция состояния в эту форму решает проблему без переписывания аналитики.
При переносе этот слой не воспроизводится: там хранилище одно.

Never put an OpenAI API key in web or mobile clients.

## Supabase data model

Core tables:

| Table | Purpose |
| --- | --- |
| `profiles` | Goal, level, locale, consent versions |
| `limitations` | User-reported body areas, severity and notes |
| `cycle_logs` | Cycle dates, symptoms and user confidence |
| `daily_checkins` | Energy, mood, soreness, sleep and pain |
| `wearable_daily` | Normalized sleep, HRV, resting HR and activity |
| `body_scans` | Private object paths, capture metadata and status |
| `body_observations` | Non-medical derived observations |
| `meal_logs` | Meal image, nutrient ranges, confidence and corrections |
| `workouts` | Generated daily session, rationale and policy version |
| `workout_exercises` | Ordered exercises and execution state |
| `exercise_feedback` | Complete, skip, pain, effort and notes |
| `subscriptions` | Entitlement mirrored from App Store / Stripe |
| `ai_runs` | Model, prompt version, latency, cost and safety result |

### Important columns

```sql
create table daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  local_date date not null,
  energy smallint check (energy between 1 and 10),
  mood smallint check (mood between 1 and 10),
  soreness smallint check (soreness between 1 and 10),
  pain_areas jsonb not null default '[]',
  sleep_minutes integer,
  readiness_score smallint check (readiness_score between 0 and 100),
  created_at timestamptz not null default now(),
  unique (user_id, local_date)
);

create table workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  local_date date not null,
  status text not null check (status in ('draft','active','complete','abandoned')),
  decision_policy_version text not null,
  readiness_score smallint not null,
  rationale text not null,
  duration_minutes smallint not null,
  intensity text not null,
  created_at timestamptz not null default now()
);
```

Every user-owned table enables RLS and checks `auth.uid() = user_id`. Sensitive
storage buckets use private access with short-lived signed URLs. Service-role
keys exist only inside Edge Functions.

## API architecture

Client-facing operations are task-oriented rather than generic AI chat:

```text
POST /functions/v1/daily-decision
POST /functions/v1/generate-workout
POST /functions/v1/replace-exercise
POST /functions/v1/analyze-meal
POST /functions/v1/analyze-body
POST /functions/v1/workout-summary
DELETE /functions/v1/user-data
```

Each request:

1. Authenticates the Supabase JWT.
2. Loads only the minimum required context.
3. Runs deterministic eligibility and safety rules.
4. Calls the model with a versioned structured-output schema.
5. Validates output with Zod.
6. Rejects exercises outside the curated library.
7. Stores the decision, model version and safety metadata.

## AI decision engine

The engine is hybrid. Deterministic rules own safety and constraints; the model
selects and explains within those boundaries.

### Inputs

- stable profile: goal, level, equipment and limitations
- current state: sleep, energy, mood, pain, soreness and cycle symptoms
- recent load: muscle groups, volume, RPE and pain events
- recovery: wearable trends and self-report
- nutrition: coarse energy/protein sufficiency with confidence
- availability: location, equipment and available minutes
- body scan: neutral visible indicators, capture quality and comparison notes

Body scan never infers weight, body-fat percentage or a medical diagnosis from
photos. Height and weight come from the profile; pain comes only from
self-report. Image observations are low-confidence training context and always
include camera/stance caveats.

### Policy stages

1. **Hard exclusions:** active pain, clinician restrictions and contraindicated
   movement patterns.
2. **Readiness band:** recovery, standard or progressive.
3. **Session intent:** recovery flow, mobility, low-impact strength, standard
   strength or progression.
4. **Load budget:** duration, sets, intensity and muscle-group recovery.
5. **Exercise retrieval:** only approved exercises matching constraints.
6. **Model composition:** order, cues, rest and supportive explanation.
7. **Validation:** duration, duplicate muscles, exclusions and language safety.

The menstrual cycle is a context signal, never a deterministic command.
Self-reported symptoms and individual history outweigh phase assumptions.

## Structured workout output

```json
{
  "intent": "low_impact_strength",
  "duration_minutes": 32,
  "intensity": "moderate",
  "rationale": "Short user-facing explanation",
  "exercises": [
    {
      "exercise_id": "glute_bridge",
      "sets": 3,
      "reps": "12",
      "rest_seconds": 45,
      "technique_cue": "Neutral, non-medical cue",
      "breathing_cue": "Exhale during effort"
    }
  ]
}
```

## Safety and privacy

- Do not infer diagnoses, fertility, pregnancy, eating disorders or disease
  from images or behavioral data.
- Do not recommend medication, supplements or medical treatment.
- Water, cycle and nutrition messages must include uncertainty when relevant.
- A pain event stops the current movement; severe or persistent pain directs
  the user to a qualified professional.
- Strip EXIF before upload and define explicit retention periods.
- Body scans require separate consent and one-tap deletion.
- Medical files are optional, isolated and never interpreted as diagnosis.
- Crisis, pregnancy and post-operative states require dedicated policies before
  product support is enabled.

## Design system

Направление — **Quiet Clinical**: тёмная сдержанная medtech-эстетика. Полное
описание — в [UX_UI_SPEC.md](UX_UI_SPEC.md), токены — в
`src/styles/tokens.css`.

```text
Screen bg   #12141A  фон экрана
Surface     #1C1F27  поверхность карточки
Surface 2/3 #20242E · #262A34
Border      #2A2E38  обводка вместо тяжёлых теней
Text        #EDEDF2  вторичный #9497A3, третичный #5C6070
Danger      #FF5C72  фиксирован, не зависит от режима
Ok / Warn   #5FBF8F · #E7B45A
```

Акцент — единственное, что меняется при смене режима: цикл `#F2637A`,
планирую `#E7A33E`, беременность `#7BC6A4`, после родов `#8E9BFF`,
перименопауза `#D98C5F`, менопауза `#9C8AD9`. Семантические цвета живут
отдельно от акцента: тревога должна читаться одинаково во всех режимах.

Principles:

- "quiet intelligence": calm surfaces with a precise, confident hierarchy
- одна система, шесть кож — меняется акцент и содержимое, не структура
- радиус карточек 18px, обводка в один пиксель вместо теней
- UI-текст Inter, метки и единицы — IBM Plex Mono капсом с трекингом
- calm, supportive language without judgment
- uncertainty and confidence are visible, not hidden — ступени уверенности
  вычисляются из объёма данных, а не задаются вручную
- motion communicates adaptation, never urgency
- no red failure states for missed workouts or food choices
- никакой геймификации: ни стриков, ни бейджей

## Roadmap

### Фаза 0 — консолидация (текущая)

Два приложения с пересекающимся смыслом надо свести в одно. Приложение в корне —основа, из `legacy/web` переносится зрелая функциональность.

- Перенести анализы с референсами и оценкой отклонений.
- Перенести напоминания (`personalReminders.ts`).
- Перенести контент и статьи.
- Перенести исламский режим и возрастные адаптации.
- Зафиксировать схему развёртывания: адрес из прежнего README отдаёт 404.

### Фаза 1 — закрыть разрывы в сценариях

Найдены в продуктовом аудите, каждый ломает конкретный путь пользователя.

- **Выход из беременности** — касается каждой пятой-десятой беременности,
  сценария нет вообще. Женщина после потери открывает приложение и видит
  счётчик недель. Цена реализации — один экран.
- **«Не помню дату последних месячных»** — сейчас обязательное поле, и на нём
  уходит именно та, кому продукт нужнее всего: с нерегулярным циклом.
- **«Что было после приёма»** — вершина пути, про которую продукт не
  спрашивает. Даёт повод вернуться в момент максимальной вовлечённости.

### Фаза 2 — облако и синхронизация

- Supabase auth и синхронизация между устройствами.
- Row Level Security, экспорт и удаление по запросу.
- PDF-экспорт отчёта врачу вместо текстового.

### Фаза 3 — платная версия

- Скрининг на СПКЯ и эндометриоз (половина логики есть в `safety.ts`).
- Subscription entitlement service and usage limits.
- Cohort analytics: activation, D7 retention, доля дошедших до 3 циклов,
  доля выгрузивших отчёт.

Мобильное приложение на Expo из плана убрано: PWA закрывает задачу установки
на телефон, а вторая платформа удвоит стоимость поддержки до того, как продукт
подтвердит ценность.

## MVP success metrics

- 70% of activated users generate a second daily workout.
- 50% complete at least two check-ins in week one.
- 60% rate the recommendation as relevant or very relevant.
- Less than 5% of sessions produce an inappropriate exercise report.
- Meal analysis corrections are completed in under 15 seconds.
- D7 retention target for the first qualified cohort: 25% or higher.
