# Livi Engineering Instructions

## Что это за проект

Livi — приватный дневник женского здоровья. Продукт превращает короткие
ежедневные отметки в понимание личной нормы и в документ, с которым можно
прийти к врачу.

Ключевая формулировка работы, на которую его нанимают: **не «отслеживать
цикл», а «чтобы меня восприняли всерьёз»**. Приём длится десять-пятнадцать
минут, жалобы на боль часто обесцениваются. Дневник нужен, чтобы прийти с
фактами. Всё, что приближает этот момент, приоритетнее остального.

## Репозиторий

**Продукт лежит в корне.** Vite + React 18 + Zustand + IndexedDB, порт 5180.
Шесть жизненных режимов, онбординг, Life-Stage Gate, ступени уверенности,
честные пустые состояния. Исходники в `src/`.

**`legacy/web`** — предыдущая Next.js-версия. Полнее по функциям: авторизация,
анализы с референсами, контент, синхронизация, партнёрский доступ, исламский
режим. В сборку продукта не входит, служит источником переноса.

Направление одностороннее: из `legacy/web` в корень, не наоборот. Чек-лист
переноса — `FEATURES.md`; каждый пункт должен получить решение «перенесён»,
«выброшен» или «отложен с причиной».

Прочее: `docs/` — спецификации, `supabase/` — схема и edge-функции,
`shared/` — общий код, `deploy/` — конфигурация развёртывания.

## Working Style

- Work in small, reviewable changes.
- Preserve useful existing logic unless a change is necessary for the task.
- Prefer explicit TypeScript types and runtime validation at system boundaries.
- Avoid large rewrites unless they are necessary and the task explicitly calls for them.
- Run the relevant build and lint checks when possible (`npx tsc --noEmit`).
- At the end of a task, summarize changed files, verification performed, and the recommended next step.

## Продуктовые правила

Нарушение любого из них — это регресс, даже если код работает.

**Один паттерн ввода.** Bottom sheet — единственный способ что-либо ввести:
отметка, поля онбординга, смена режима, настройки. Второй модалки быть не
должно.

**Честность важнее красоты.** Где данных мало — это говорится прямо, с числом:
«есть 4 отметки, нужно 10». Пустое состояние — рабочее состояние системы со
своим дизайном, а не то, что маскируют статьями или графиком по двум точкам.
Уровень уверенности прогноза вычисляется из объёма данных, а не задаётся
вручную.

**Никакой геймификации.** Ни стриков, ни бейджей, ни счётчиков дней подряд.
Продукт иногда сам просит не заниматься и отмечать в тяжёлые дни — счётчик
серий с этим несовместим и превращает пропуск в вину.

**Одна система, шесть кож.** Layout, компоненты и паттерны взаимодействия
одинаковы во всех режимах. Меняются акцентный цвет и содержимое, не структура.

**Вкладка требует своего вопроса и своей частоты.** Если у раздела нет
собственного вопроса пользователя и собственного ритма открытия, это экран
внутри чужой вкладки, а не вкладка.

**Смена режима — только через значимое событие.** Life-Stage Gate с
подтверждением, не свободный тумблер. Перименопауза — мягкий переход, не hard
gate. Любое переключение отменяется баннером.

## Security And AI

- Do not add secrets, API keys, tokens, or private credentials to the repository.
- Do not implement real AI calls unless the task explicitly asks for backend integration.
- Never expose an OpenAI API key in client code. AI requests belong in secure backend services or Supabase Edge Functions.
- Keep AI output structured and validate it before use.

## Product Safety

- Do not present diagnoses, fertility, pregnancy, disease, or medical conditions as facts.
- Phrase medical escalation as: "consider discussing this with a qualified clinician."
- Do not recommend medication or supplements as treatment.
- Stop or reduce fitness intensity when pain is reported.
- Deterministic red-flag rules run before any AI-composed text, never after.
- Чувствительные категории — заметки своими словами, секс и контрацепция — не
  попадают в выгрузку для врача без явного выбора пользователя.
