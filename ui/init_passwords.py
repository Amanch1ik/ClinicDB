"""
Полная инициализация пользователей системы.

В seed.sql заводятся пользователи с шаблонными логинами и
декоративными bcrypt-хэшами. Этот скрипт пересоздаёт таблицу users
с осмысленными логинами и реальными bcrypt-хэшами уникальных паролей.

Запуск:
    python init_passwords.py
"""
import os

import bcrypt
import psycopg
from dotenv import load_dotenv

load_dotenv()


# (login, password, role, email, doctor_id)
USERS = [
    ("a.osmonov",       "Cl1n1k_Adm_KG_26!",  "администратор", "admin@clinic.kg",          None),
    ("ch.usupova",      "Reg!str_BIS_092kg",  "регистратор",   "registrar@clinic.kg",      None),
    ("askarov.mb",      "Th3rapy_KG_26#mb",   "врач",          "askarov.mb@clinic.kg",     1),
    ("turdubaeva.ns",   "Card1o_Sec_ns!26",   "врач",          "turdubaeva.ns@clinic.kg",  2),
    ("kozhomkulov.et",  "Surg3on_KG_$et26",   "врач",          "kozhomkulov.et@clinic.kg", 3),
    ("sartaeva.cm",     "Neur0_BIS_!cm26",    "врач",          "sartaeva.cm@clinic.kg",    4),
]


def main():
    dsn = os.getenv("DATABASE_URL")
    if not dsn:
        raise SystemExit("DATABASE_URL не задан. Скопируй .env.example в .env и поправь под себя.")

    conn = psycopg.connect(dsn)
    try:
        with conn, conn.cursor() as cur:
            cur.execute("DELETE FROM users")
            for login, password, role, email, doctor_id in USERS:
                pwd_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("utf-8")
                cur.execute(
                    "INSERT INTO users (login, password_hash, role, email, doctor_id) "
                    "VALUES (%s, %s, %s, %s, %s)",
                    (login, pwd_hash, role, email, doctor_id),
                )
        print(f"Пересоздано пользователей: {len(USERS)}\n")
        print(f"{'Логин':<18} {'Роль':<16} Пароль")
        print("-" * 70)
        for login, password, role, *_ in USERS:
            print(f"{login:<18} {role:<16} {password}")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
