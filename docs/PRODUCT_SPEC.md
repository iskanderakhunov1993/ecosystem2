# Mira Product Specification

## Product Positioning

Mira is a private daily diary for women's cycle and wellbeing. It turns simple
self-reported check-ins into a personal norm, clear pattern explanations, and a
doctor-ready report that helps the user discuss symptoms with facts instead of
memory.

Mira is not a diagnostic product, fertility predictor, calorie-policing tool,
or static workout program.

## Target User

The MVP serves women who want a private, low-friction way to understand what is
usual for their own body, notice recurring symptoms, and prepare for a medical
conversation when something feels off. They value calm guidance that is specific
without being prescriptive or diagnostic.

### Сегменты

Гипотезы, выведенные из кода и из того, как устроена медицинская помощь. Не
подтверждены аналитикой продукта.

**«Меня не слышат», 25–40 — ядро.** Хроническая боль, обильные месячные,
возможно эндометриоз без диагноза. Уже была у врача и ушла ни с чем. Ей нужны
не инсайты, а протокол. Самая высокая готовность платить и самая высокая
терпимость к ежедневному вводу — если видит, ради чего.

**«Со мной что-то происходит», 42–52 — недообслужена.** Перименопауза. Рынок
её почти игнорирует: Flo и Clue заточены под цикл и фертильность. Незанятая
позиция и аудитория с деньгами. Нужны две вещи: подтверждение, что это не
выдумка, и даты для врача.

**«Планирую», 27–38.** Самая интенсивная частота использования, но конечный
горизонт: уходит в беременность или в клинику.

**«Не понимаю своё тело», 18–25.** Массовый сегмент, низкая готовность платить,
высокий отток. Ценность в том, что через несколько лет она станет одним из
сегментов выше.

**«Мне нужно, чтобы не увидели» — сквозной.** Не возрастная группа, а
состояние: живёт с родителями, с контролирующим партнёром, в консервативной
среде. Анонимный режим и локальное хранение для неё не фича приватности, а
условие установки.

## Core Value Proposition

Instead of asking a user to remember scattered symptoms and dates, Mira creates
a structured health diary. The user can see what repeats, what may be outside
their personal pattern, and what is worth taking to a clinician.

## Main Jobs To Be Done

- Build a habit of daily check-ins in under a minute.
- Review a day-by-day diary of cycle, pain, mood, energy, sleep, PMS, meals, water, workouts, and notes.
- Notice patterns in cycle context, mood, sleep, symptoms, and daily routines without treating correlation as diagnosis.
- Prepare a concise doctor report with dates, frequencies, and questions.
- Choose gentle care actions for food, water, and movement based on current state.
- Know when a pattern warrants considering a conversation with a qualified clinician.

## Main Navigation

Действующая навигация — в `apps/mira`. Две вкладки; критерий для вкладки —
**свой вопрос пользователя и своя частота открытия**. Раздел, у которого нет
ни того, ни другого, — это экран внутри чужой вкладки, а не вкладка.

1. **Сегодня** — «что со мной сегодня», ежедневно, около двадцати секунд.
   Календарь неделей, кольцо с главным числом режима, чипы быстрой записи,
   «записано сегодня», карточка тренировки и медитации.
2. **Мой цикл** — «это вообще нормально», раз в неделю-две. Прогноз со
   ступенью уверенности, «что повторяется», метрики списком.

Второй уровень открывается по тапу: месяц календаря и история, детали прогноза,
полная аналитика с графиками. Третий — отчёт врачу.

Профиль, приватность и удаление данных — лист по шестерёнке в шапке.
Переключение режимов — Life-Stage Gate по пилюле слева вверху.

### Что было объединено и почему

История была отдельной вкладкой — календарь переехал в «Сегодня», потому что
он нужен в момент отметки: «я забыла отметить позавчера» решается одним тапом,
не уходя с экрана.

Аналитика, паттерны и прогнозы были тремя вкладками — слиты в «Мой цикл»,
потому что для пользователя это один вопрос, а новый человек получал три
пустых экрана подряд вместо одного честного. Метрики стали списком строк:
шесть графиков подряд проматывают, шесть строк читают и открывают одну нужную.

Отчёт врачу — не вкладка: его открывают раз в несколько месяцев. Но счётчик
собранных записей виден постоянно, иначе никто не узнает, что документ копится.

### Шесть режимов

Цикл · Планирую · Беременность · После родов · Перименопауза · Менопауза.

Layout, компоненты и паттерны взаимодействия одинаковы во всех режимах;
меняются акцентный цвет и содержимое, не структура. Позиции вкладок не
меняются никогда — женщина за пять лет может пройти три режима.

Islamic mode остаётся контекстной настройкой в `apps/web` и подлежит переносу.

## MVP Scope

- Consent-first onboarding with goals, training level, available equipment, self-reported limitations, and optional cycle context.
- A sub-minute daily check-in for period, pain, mood, energy, sleep, PMS, intimacy, meals, and notes.
- A day-by-day diary for recent history and backfilling missed days.
- Personal norm and signal dashboard using only self-reported data and cycle history.
- Doctor report with concise summary, questions, optional sensitive sections, export, and print.
- Nutrition, water, and workout support framed as non-medical self-care.
- Local-first storage with optional sync.

## Later Roadmap

- Stronger PDF report export and share flow.
- Import from other cycle trackers and Apple Health behind explicit consent.
- Optional clinician-facing view or appointment checklist.
- Personalization from longitudinal feedback, model evaluation, and safety monitoring.
- Data export, deletion automation, retention controls, and audit views.
- Paid-plan entitlement service and carefully tested usage limits.

## Backlog

### "Is This Normal?" Symptom Question Assistant

**Pain:** users often do not know whether a symptom is expected cycle variation,
something to observe, or a reason to speak with a qualified clinician.

**User story:** as a user, I want to ask "Is this normal?" in my own words so I
can get a simple, safe explanation of my symptom without receiving a diagnosis.

**Example questions:**

- "My period has lasted 8 days, is this normal?"
- "My stomach hurts a lot on the first day, is this normal?"
- "There was blood after sex, is this normal?"
- "My period is 6 days late, what should I do?"
- "I feel very weak during my period, is that dangerous?"

**MVP requirements:**

- Add an "Is this normal?" entry point from Today and Diary.
- Let the user type a free-text question and optionally choose a quick example.
- Return a short answer in plain language, without diagnosis.
- Explain what can be common, what to observe, what to do now, and when to
  consider contacting a qualified clinician.
- Highlight red flags such as very heavy bleeding, dizziness/fainting, severe or
  unusual pain, bleeding after sex, bleeding between periods, prolonged bleeding,
  and persistent or worsening symptoms.
- Save the question and response to the cycle-day diary.

**Safety constraints:** deterministic red-flag rules must run before any AI
response. AI can compose the explanation, but it must not diagnose, recommend
medication, or minimize severe, new, persistent, or worsening symptoms.

## Лестница ценности

Центральная проблема удержания: **ценность приходит через три месяца, а решение
удалить приложение принимается на третий день.**

| Когда | Что получает |
|---|---|
| День 1 | День цикла, фаза, прогноз — считается из одного ответа в онбординге |
| День 1 | Практика на сегодня — работает даже без данных |
| Дни 3–7 | Первое наблюдение (порог — 5 отметок) |
| Месяц 1 | Первый полный цикл: прогноз впервые проверяется реальностью |
| Месяц 3 | Отчёт врачу с весом — то, ради чего всё |

Продукт обязан показывать эту лестницу до того, как выполнит её: блок «Для
врача» с первого дня показывает счётчик записей и срок, после которого данных
хватит. Обещание должно быть видно заранее.

## Monetization Model

Ориентир по рынку: у Flo бесплатны прогнозы, 80+ симптомов, напоминания,
анонимный режим и партнёрский доступ. За подпиской ($39.99/год) — **отчёт врачу
за 6 месяцев (только iOS), паттерны в месячных отчётах, чат-ассистент,
скрининг на СПКЯ и эндометриоз**, видеокурсы и детальный трекинг беременности.

Из этого следуют три вывода.

**Анонимный режим и партнёрский доступ бесплатны у конкурента** — на них нельзя
строить дифференциацию, это гигиена категории.

**Отчёт врачу и паттерны у нас должны быть бесплатными.** Паттерны — это
доказательство, что приложение работает; прятать их до того, как человек увидел
пользу, значит не получить ни того, ни другого. Бесплатный отчёт на всех
платформах — внятная причина выбрать нас.

**Платить будут не за вывод собственных данных**, а за то, что требует нашей
работы: развёрнутый разбор к конкретному приёму, экспорт истории за годы,
синхронизация между устройствами. Скрининг на СПКЯ и эндометриоз — сильный
кандидат: попадает точно в ядровый сегмент, и половина логики уже есть в
красных флагах `safety.ts`.

Цены, длительность триала и лимиты — гипотезы для проверки, а не клиническое
или поведенческое вмешательство.

## Метрики

Время в приложении здесь плохой показатель: чем быстрее женщина отметила и
закрыла, тем лучше работает продукт.

| Метрика | Что показывает | Ориентир |
|---|---|---|
| Время до первой ценности | От установки до экрана с рассчитанным днём цикла | < 90 сек |
| Дошли до 3 отметок | Порог первого наблюдения, барьер первой недели | > 40% |
| Дошли до 3 циклов | Порог «твоей нормы» и весомого отчёта | > 15% |
| Выгрузили отчёт | Прямое доказательство, что продукт сработал | главная |
| Вернулись после пропуска ≥3 дней | Не наказывает ли продукт за перерыв | > 50% |
| Длительность отметки | Открыл → сохранил | < 20 сек |

## Safety Principles

- Do not diagnose or present pregnancy, fertility, disease, injury, or medical conditions as facts.
- Cycle phase is a context signal, never a command. Self-reported symptoms, pain, and individual history have priority.
- When pain is reported, stop or reduce intensity and offer a safer option.
- For severe, new, persistent, or worsening symptoms, say: "consider discussing this with a qualified clinician."
- Do not recommend medication or supplements as treatment.
- Keep food feedback approximate, neutral, and non-shaming.
- Do not infer body fat, weight, attractiveness, posture diagnoses, or health status from body images.
- Show uncertainty and confidence rather than hiding them.

## Privacy Principles

- Collect only data needed for an explicit product function.
- Obtain distinct consent for sensitive features, including body scans, wearable imports, and optional health documents.
- Keep user data protected by authentication and row-level security.
- Store sensitive photos privately, strip EXIF before storage, use short-lived signed access URLs, and define retention and deletion behavior.
- Keep service credentials and model keys server-side only.
- Provide understandable deletion and export controls before paid release.
