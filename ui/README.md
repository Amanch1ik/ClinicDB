# ui/

Веб-интерфейс на Flask.

Описание архитектуры, установка и тестовые учётные записи — в корневом [`README.md`](../README.md).

Короткая шпаргалка:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env       # отредактировать DATABASE_URL
python init_passwords.py     # создать пользователей с bcrypt-хэшами
python app.py
```

Открыть <http://127.0.0.1:5000>.

## Файлы

- `app.py` — маршруты, авторизация, CRUD-админка
- `init_passwords.py` — список пользователей и пересоздание с bcrypt
- `_kg_seed.sql` — тестовые данные под Кыргызстан
- `templates/`, `static/` — шаблоны и стили
- `.env.example` — образец конфигурации
