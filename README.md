# ClinicDB

Реляционная БД для медицинской клиники на PostgreSQL 15+ и веб-интерфейс на Flask.

Состав:

- `schema.sql` — структура БД (7 таблиц, 7 ENUM, индексы, представления) 
- `seed.sql` — тестовые данные (исходные, общие)
- `queries.sql` — 10 типовых SQL-запросов
- `report.md` — пояснительная записка по БД
- `ui/` — веб-интерфейс

## Стек
 
- PostgreSQL 15 (проверено на 18)
- Python 3.10+ (рекомендуется 3.12; 3.14 тоже работает)
- Flask 3, psycopg 3, bcrypt
- HTML + CSS (без JS-фреймворков)

## Архитектура

```
ClinicDB/
├── schema.sql              структура БД
├── seed.sql                базовые данные
├── queries.sql             примеры запросов
├── report.md               пояснительная записка
└── ui/
    ├── app.py              Flask: маршруты, авторизация, CRUD
    ├── init_passwords.py   создание/обновление пользователей с bcrypt
    ├── _kg_seed.sql        локализованные сиды (Кыргызстан, +996)
    ├── requirements.txt
    ├── .env.example
    ├── static/css/style.css
    └── templates/
        ├── base.html             общий каркас (сайдбар + main)
        ├── _icons.html           SVG-иконки (макрос Jinja)
        ├── login.html
        ├── registrar_home.html   расписание на дату
        ├── appointment_form.html
        ├── doctor_home.html      кабинет врача
        ├── doctor_patient.html   карта пациента с медкартами
        ├── record_form.html
        ├── lab_form.html
        ├── admin_home.html       статистика + каталоги
        ├── admin_list.html       таблица записей
        ├── admin_form.html       универсальная форма CRUD
        └── error.html
```

Архитектурно:

1. **БД** — единственный источник правды. Бизнес-правила (уникальность слота врача, ENUM-типы, каскадные/restrict-удаления, CHECK на сумму платежа) живут в схеме.
2. **Flask-приложение** — тонкий слой над БД: подключение через `psycopg`, запросы написаны прямым SQL без ORM. Это сознательно — задание про базы данных, и так понятно, что именно уходит в БД.
3. **Авторизация** — таблица `users`, пароли хранятся как bcrypt-хэши. Сессии Flask держат `user_id`, `login`, `role` и `doctor_id`. Декораторы `@login_required` / `@roles_required(...)` защищают маршруты.
4. **Роли:**
   - администратор — CRUD по всем 7 таблицам;
   - врач — свои пациенты, медкарты, лабораторные анализы. Контроль доступа: пациент считается «своим», если есть приём с этим врачом;
   - регистратор — расписание и запись пациентов на приём.
5. **Универсальная админка** — описание таблиц лежит в одном словаре `TABLES` в `app.py`. Список колонок и поля формы описаны декларативно, шаблоны `admin_list.html` и `admin_form.html` используют это описание. Чтобы добавить новую таблицу в админку, достаточно дополнить словарь.
6. **UI** — HTML + Jinja-шаблоны, CSS без сборщиков. Иконки — inline SVG (Lucide-стиль) через макрос `{{ icon('name') }}`.

## Запуск локально

### Требования

- PostgreSQL 15+ (служба запущена)
- Python 3.10+
- Git

### Шаги

```powershell
# 1. Создать БД
psql -U postgres -c "CREATE DATABASE clinic_db;"

# 2. Накатить схему и сиды
psql -U postgres -d clinic_db -f schema.sql
psql -U postgres -d clinic_db -f ui/_kg_seed.sql   # либо seed.sql

# 3. Виртуальное окружение и зависимости
cd ui
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# 4. Настройки
copy .env.example .env
# отредактируйте .env: DATABASE_URL и FLASK_SECRET_KEY

# 5. Инициализировать пользователей (bcrypt-хэши)
python init_passwords.py

# 6. Запустить
python app.py
```

Открыть в браузере: <http://127.0.0.1:5000>

На Linux/macOS вместо `.\.venv\Scripts\Activate.ps1` — `source .venv/bin/activate`, `copy` → `cp`.

### `.env`

```
DATABASE_URL=postgresql://postgres:ВАШ_ПАРОЛЬ@localhost:5432/clinic_db
FLASK_SECRET_KEY=произвольная-длинная-случайная-строка
```

## Тестовые учётные записи

Логины и пароли заданы в `ui/init_passwords.py` — поменять можно там же.

| Логин            | Роль              | Пароль              |
|------------------|-------------------|---------------------|
| `a.osmonov`      | администратор     | `Cl1n1k_Adm_KG_26!` |
| `ch.usupova`    | регистратор       | `Reg!str_BIS_092kg` |
| `askarov.mb`     | врач (терапевт)   | `Th3rapy_KG_26#mb`  |
| `turdubaeva.ns`  | врач (кардиолог)  | `Card1o_Sec_ns!26`  |
| `kozhomkulov.et` | врач (хирург)     | `Surg3on_KG_$et26`  |
| `sartaeva.cm`    | врач (невролог)   | `Neur0_BIS_!cm26`   |

## Локализация данных

В `ui/_kg_seed.sql` пациенты, врачи, телефоны и адреса оформлены под Кыргызстан:

- имена: Турдубеков Айбек, Сатыбалдиева Айгүл, Маматова Бегимай, Аскаров Мирлан, Турдубаева Назгүл и т.д.
- телефоны: `+996-XXX-XXX-XXX` (мобильные операторы и бишкекский городской `+996-312-...`)
- адреса: Бишкек (ул. Чуй, пр. Манаса, мкр. Асанбай, мкр. Джал), Ош, Каракол

Файл `seed.sql` оставлен как исходный (общие данные).

## Полный пересброс данных

```powershell
psql -U postgres -d clinic_db -f schema.sql
psql -U postgres -d clinic_db -f ui/_kg_seed.sql
python ui/init_passwords.py
```

`schema.sql` начинается с `DROP TABLE IF EXISTS ... CASCADE`, поэтому запускается повторно без ошибок.
