"""
Flask UI для базы данных медицинской клиники.

Роли:
  - администратор — CRUD по всем 7 таблицам;
  - врач          — свои пациенты, медкарты, лабораторные анализы;
  - регистратор   — расписание и пациенты.
"""
import os
from datetime import date, datetime
from functools import wraps

import bcrypt
import psycopg
from psycopg.rows import dict_row
from dotenv import load_dotenv
from flask import (
    Flask, abort, flash, g, redirect, render_template,
    request, session, url_for,
)

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "dev-secret-change-me")

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/clinic_db")


# ============================================================
#  Подключение к БД
# ============================================================

def get_db():
    if "db" not in g:
        g.db = psycopg.connect(DATABASE_URL, row_factory=dict_row)
        g.db.autocommit = False
    return g.db


@app.teardown_appcontext
def close_db(_exc):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def query(sql, params=None, *, one=False):
    with get_db().cursor() as cur:
        cur.execute(sql, params or ())
        if cur.description is None:
            return None
        rows = cur.fetchall()
        return (rows[0] if rows else None) if one else rows


def execute(sql, params=None):
    db = get_db()
    with db.cursor() as cur:
        cur.execute(sql, params or ())
    db.commit()


# ============================================================
#  Авторизация
# ============================================================

def login_required(view):
    @wraps(view)
    def wrapper(*args, **kwargs):
        if "user_id" not in session:
            return redirect(url_for("login", next=request.path))
        return view(*args, **kwargs)
    return wrapper


def roles_required(*roles):
    def decorator(view):
        @wraps(view)
        def wrapper(*args, **kwargs):
            if "user_id" not in session:
                return redirect(url_for("login", next=request.path))
            if session.get("role") not in roles:
                abort(403)
            return view(*args, **kwargs)
        return wrapper
    return decorator


@app.context_processor
def inject_user():
    return {
        "current_user": {
            "id": session.get("user_id"),
            "login": session.get("login"),
            "role": session.get("role"),
            "doctor_id": session.get("doctor_id"),
        } if "user_id" in session else None
    }


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        login_str = (request.form.get("login") or "").strip()
        password = request.form.get("password") or ""
        user = query(
            "SELECT id, login, password_hash, role, doctor_id FROM users WHERE login = %s",
            (login_str,), one=True,
        )
        if user and bcrypt.checkpw(password.encode("utf-8"), user["password_hash"].encode("utf-8")):
            session.clear()
            session["user_id"] = user["id"]
            session["login"] = user["login"]
            session["role"] = user["role"]
            session["doctor_id"] = user["doctor_id"]
            return redirect(request.args.get("next") or url_for("index"))
        flash("Неверный логин или пароль", "error")
    return render_template("login.html")


@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))


# ============================================================
#  Главная — диспетчер по роли
# ============================================================

@app.route("/")
@login_required
def index():
    role = session.get("role")
    if role == "администратор":
        return redirect(url_for("admin_home"))
    if role == "врач":
        return redirect(url_for("doctor_home"))
    if role == "регистратор":
        return redirect(url_for("registrar_home"))
    abort(403)


# ============================================================
#  Регистратор
# ============================================================

@app.route("/registrar")
@roles_required("регистратор", "администратор")
def registrar_home():
    on_date = request.args.get("date") or date.today().isoformat()
    schedule = query(
        """
        SELECT id, appointment_time, type, status,
               patient_name, doctor_name, specialty, notes
        FROM v_appointments
        WHERE appointment_date = %s
        ORDER BY appointment_time
        """,
        (on_date,),
    )
    return render_template("registrar_home.html", schedule=schedule, on_date=on_date)


@app.route("/registrar/appointment/new", methods=["GET", "POST"])
@roles_required("регистратор", "администратор")
def appointment_new():
    if request.method == "POST":
        try:
            execute(
                """
                INSERT INTO appointments
                    (patient_id, doctor_id, appointment_date, appointment_time, type, status, notes)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    int(request.form["patient_id"]),
                    int(request.form["doctor_id"]),
                    request.form["appointment_date"],
                    request.form["appointment_time"],
                    request.form["type"],
                    request.form.get("status") or "запланирован",
                    request.form.get("notes") or None,
                ),
            )
            flash("Приём добавлен", "ok")
            return redirect(url_for("registrar_home", date=request.form["appointment_date"]))
        except psycopg.Error as e:
            get_db().rollback()
            flash(f"Ошибка: {e}", "error")

    patients = query("SELECT id, last_name, first_name FROM patients ORDER BY last_name, first_name")
    doctors = query("SELECT id, last_name, first_name, specialty FROM doctors ORDER BY last_name")
    return render_template("appointment_form.html", patients=patients, doctors=doctors, appt=None)


# ============================================================
#  Врач — только свои пациенты
# ============================================================

@app.route("/doctor")
@roles_required("врач", "администратор")
def doctor_home():
    doctor_id = session.get("doctor_id")
    if not doctor_id:
        abort(403, "Учётной записи не привязан врач")

    today_schedule = query(
        """
        SELECT a.id, a.appointment_time, a.type, a.status, a.notes,
               p.last_name || ' ' || p.first_name AS patient_name
        FROM appointments a
        JOIN patients p ON p.id = a.patient_id
        WHERE a.doctor_id = %s AND a.appointment_date = CURRENT_DATE
        ORDER BY a.appointment_time
        """,
        (doctor_id,),
    )
    my_patients = query(
        """
        SELECT DISTINCT p.id, p.last_name, p.first_name, p.middle_name, p.phone
        FROM patients p
        JOIN appointments a ON a.patient_id = p.id
        WHERE a.doctor_id = %s
        ORDER BY p.last_name, p.first_name
        """,
        (doctor_id,),
    )
    return render_template("doctor_home.html", schedule=today_schedule, patients=my_patients)


@app.route("/doctor/patient/<int:patient_id>")
@roles_required("врач", "администратор")
def doctor_patient_card(patient_id):
    doctor_id = session.get("doctor_id")
    patient = query("SELECT * FROM patients WHERE id = %s", (patient_id,), one=True)
    if not patient:
        abort(404)

    if session["role"] == "врач":
        seen = query(
            "SELECT 1 FROM appointments WHERE doctor_id = %s AND patient_id = %s LIMIT 1",
            (doctor_id, patient_id), one=True,
        )
        if not seen:
            abort(403, "Этот пациент не из ваших")

    records = query(
        """
        SELECT mr.id, mr.visit_date, mr.diagnosis, mr.prescription, mr.notes,
               d.last_name || ' ' || d.first_name AS doctor_name
        FROM medical_records mr
        JOIN doctors d ON d.id = mr.doctor_id
        WHERE mr.patient_id = %s
        ORDER BY mr.visit_date DESC
        """,
        (patient_id,),
    )
    lab_tests_by_record = {}
    if records:
        rec_ids = [r["id"] for r in records]
        labs = query(
            "SELECT * FROM lab_tests WHERE medical_record_id = ANY(%s) ORDER BY test_date",
            (rec_ids,),
        )
        for lt in labs:
            lab_tests_by_record.setdefault(lt["medical_record_id"], []).append(lt)

    return render_template(
        "doctor_patient.html",
        patient=patient, records=records, labs=lab_tests_by_record,
    )


@app.route("/doctor/record/new/<int:patient_id>", methods=["GET", "POST"])
@roles_required("врач", "администратор")
def medical_record_new(patient_id):
    if request.method == "POST":
        try:
            doctor_id = session.get("doctor_id") or int(request.form["doctor_id"])
            execute(
                """
                INSERT INTO medical_records (patient_id, doctor_id, visit_date, diagnosis, prescription, notes)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (
                    patient_id, doctor_id,
                    request.form["visit_date"],
                    request.form["diagnosis"],
                    request.form.get("prescription") or None,
                    request.form.get("notes") or None,
                ),
            )
            flash("Медкарта сохранена", "ok")
            return redirect(url_for("doctor_patient_card", patient_id=patient_id))
        except psycopg.Error as e:
            get_db().rollback()
            flash(f"Ошибка: {e}", "error")

    patient = query("SELECT * FROM patients WHERE id = %s", (patient_id,), one=True)
    if not patient:
        abort(404)
    doctors = None
    if session["role"] == "администратор":
        doctors = query("SELECT id, last_name, first_name, specialty FROM doctors ORDER BY last_name")
    return render_template("record_form.html", patient=patient, doctors=doctors, today=date.today().isoformat())


@app.route("/doctor/lab/new/<int:record_id>", methods=["GET", "POST"])
@roles_required("врач", "администратор")
def lab_test_new(record_id):
    rec = query("SELECT * FROM medical_records WHERE id = %s", (record_id,), one=True)
    if not rec:
        abort(404)
    if request.method == "POST":
        try:
            execute(
                """
                INSERT INTO lab_tests (medical_record_id, test_name, test_date, result, notes)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (
                    record_id,
                    request.form["test_name"],
                    request.form["test_date"],
                    request.form.get("result") or None,
                    request.form.get("notes") or None,
                ),
            )
            flash("Анализ добавлен", "ok")
            return redirect(url_for("doctor_patient_card", patient_id=rec["patient_id"]))
        except psycopg.Error as e:
            get_db().rollback()
            flash(f"Ошибка: {e}", "error")
    return render_template("lab_form.html", record=rec, today=date.today().isoformat())


# ============================================================
#  Универсальная админка — CRUD по всем таблицам
# ============================================================

TABLES = {
    "patients": {
        "title": "Пациенты",
        "columns": ["id", "last_name", "first_name", "middle_name",
                    "birth_date", "gender", "phone", "email", "address", "created_at"],
        "form_fields": [
            ("last_name", "Фамилия", "text", True),
            ("first_name", "Имя", "text", True),
            ("middle_name", "Отчество", "text", False),
            ("birth_date", "Дата рождения", "date", True),
            ("gender", "Пол", "select:М,Ж", True),
            ("phone", "Телефон", "text", False),
            ("email", "Email", "email", False),
            ("address", "Адрес", "textarea", False),
        ],
    },
    "doctors": {
        "title": "Врачи",
        "columns": ["id", "last_name", "first_name", "middle_name",
                    "specialty", "phone", "email", "office", "created_at"],
        "form_fields": [
            ("last_name", "Фамилия", "text", True),
            ("first_name", "Имя", "text", True),
            ("middle_name", "Отчество", "text", False),
            ("specialty", "Специальность", "text", True),
            ("phone", "Телефон", "text", False),
            ("email", "Email", "email", False),
            ("office", "Кабинет", "text", False),
        ],
    },
    "users": {
        "title": "Пользователи",
        "columns": ["id", "login", "role", "email", "doctor_id", "created_at"],
        "form_fields": [
            ("login", "Логин", "text", True),
            ("password", "Пароль (только при создании/смене)", "password", False),
            ("role", "Роль", "select:администратор,врач,регистратор", True),
            ("email", "Email", "email", True),
            ("doctor_id", "ID врача (для роли «врач»)", "number", False),
        ],
    },
    "appointments": {
        "title": "Приёмы",
        "columns": ["id", "patient_id", "doctor_id", "appointment_date",
                    "appointment_time", "type", "status", "notes", "created_at"],
        "form_fields": [
            ("patient_id", "ID пациента", "number", True),
            ("doctor_id", "ID врача", "number", True),
            ("appointment_date", "Дата", "date", True),
            ("appointment_time", "Время", "time", True),
            ("type", "Тип", "select:консультация,анализ,процедура", True),
            ("status", "Статус", "select:запланирован,проведен,отменен", True),
            ("notes", "Заметки", "textarea", False),
        ],
    },
    "medical_records": {
        "title": "Медкарты",
        "columns": ["id", "patient_id", "doctor_id", "visit_date",
                    "diagnosis", "prescription", "notes", "created_at"],
        "form_fields": [
            ("patient_id", "ID пациента", "number", True),
            ("doctor_id", "ID врача", "number", True),
            ("visit_date", "Дата визита", "date", True),
            ("diagnosis", "Диагноз", "textarea", True),
            ("prescription", "Назначения", "textarea", False),
            ("notes", "Заметки", "textarea", False),
        ],
    },
    "lab_tests": {
        "title": "Лабораторные анализы",
        "columns": ["id", "medical_record_id", "test_name", "test_date",
                    "result", "notes", "created_at"],
        "form_fields": [
            ("medical_record_id", "ID медкарты", "number", True),
            ("test_name", "Название анализа", "text", True),
            ("test_date", "Дата", "date", True),
            ("result", "Результат", "textarea", False),
            ("notes", "Заметки", "textarea", False),
        ],
    },
    "payments": {
        "title": "Платежи",
        "columns": ["id", "patient_id", "amount", "payment_date",
                    "type", "method", "status", "created_at"],
        "form_fields": [
            ("patient_id", "ID пациента", "number", True),
            ("amount", "Сумма", "number", True),
            ("payment_date", "Дата платежа", "date", True),
            ("type", "Тип", "select:оплата приёма,оплата процедуры", True),
            ("method", "Способ", "select:наличные,карта,онлайн", True),
            ("status", "Статус", "select:оплачено,не оплачено", True),
        ],
    },
}


@app.route("/admin")
@roles_required("администратор")
def admin_home():
    stats = query(
        """
        SELECT
            (SELECT COUNT(*) FROM patients)        AS patients,
            (SELECT COUNT(*) FROM doctors)         AS doctors,
            (SELECT COUNT(*) FROM appointments)    AS appointments,
            (SELECT COUNT(*) FROM medical_records) AS records,
            (SELECT COUNT(*) FROM lab_tests)       AS labs,
            (SELECT COUNT(*) FROM payments)        AS payments,
            (SELECT COUNT(*) FROM users)           AS users
        """,
        one=True,
    )
    return render_template("admin_home.html", tables=TABLES, stats=stats)


def _check_table(table):
    if table not in TABLES:
        abort(404)
    return TABLES[table]


@app.route("/admin/<table>")
@roles_required("администратор")
def admin_list(table):
    meta = _check_table(table)
    rows = query(f"SELECT * FROM {table} ORDER BY id DESC")
    return render_template("admin_list.html", table=table, meta=meta, rows=rows)


@app.route("/admin/<table>/new", methods=["GET", "POST"])
@roles_required("администратор")
def admin_new(table):
    meta = _check_table(table)
    if request.method == "POST":
        try:
            cols, values = _collect_form(table, meta, request.form, is_new=True)
            placeholders = ", ".join(["%s"] * len(cols))
            sql = f"INSERT INTO {table} ({', '.join(cols)}) VALUES ({placeholders})"
            execute(sql, values)
            flash(f"Запись добавлена в «{meta['title']}»", "ok")
            return redirect(url_for("admin_list", table=table))
        except (psycopg.Error, ValueError) as e:
            get_db().rollback()
            flash(f"Ошибка: {e}", "error")
    return render_template("admin_form.html", table=table, meta=meta, row=None)


@app.route("/admin/<table>/<int:row_id>/edit", methods=["GET", "POST"])
@roles_required("администратор")
def admin_edit(table, row_id):
    meta = _check_table(table)
    row = query(f"SELECT * FROM {table} WHERE id = %s", (row_id,), one=True)
    if not row:
        abort(404)
    if request.method == "POST":
        try:
            cols, values = _collect_form(table, meta, request.form, is_new=False)
            if cols:
                set_clause = ", ".join(f"{c} = %s" for c in cols)
                sql = f"UPDATE {table} SET {set_clause} WHERE id = %s"
                execute(sql, [*values, row_id])
            flash("Изменения сохранены", "ok")
            return redirect(url_for("admin_list", table=table))
        except (psycopg.Error, ValueError) as e:
            get_db().rollback()
            flash(f"Ошибка: {e}", "error")
    return render_template("admin_form.html", table=table, meta=meta, row=row)


@app.route("/admin/<table>/<int:row_id>/delete", methods=["POST"])
@roles_required("администратор")
def admin_delete(table, row_id):
    _check_table(table)
    try:
        execute(f"DELETE FROM {table} WHERE id = %s", (row_id,))
        flash("Запись удалена", "ok")
    except psycopg.Error as e:
        get_db().rollback()
        flash(f"Ошибка удаления: {e}", "error")
    return redirect(url_for("admin_list", table=table))


def _collect_form(table, meta, form, *, is_new):
    """Собирает (columns, values). Для users — хэширует password в password_hash."""
    cols, values = [], []
    for name, label, ftype, required in meta["form_fields"]:
        if table == "users" and name == "password":
            pw = form.get("password") or ""
            if pw:
                cols.append("password_hash")
                values.append(bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("utf-8"))
            elif is_new:
                raise ValueError("Пароль обязателен при создании пользователя")
            continue
        raw = form.get(name)
        if raw == "" or raw is None:
            if required and is_new:
                raise ValueError(f"Поле «{label}» обязательно")
            values.append(None)
        else:
            values.append(raw)
        cols.append(name)
    return cols, values


# ============================================================
#  Ошибки
# ============================================================

@app.errorhandler(403)
def forbidden(e):
    return render_template("error.html", code=403, message=str(e.description or "Доступ запрещён")), 403


@app.errorhandler(404)
def not_found(e):
    return render_template("error.html", code=404, message="Страница не найдена"), 404


# ============================================================
#  Фильтры шаблонов
# ============================================================

@app.template_filter("fmt")
def fmt_value(v):
    if v is None:
        return "—"
    if isinstance(v, datetime):
        return v.strftime("%Y-%m-%d %H:%M")
    if isinstance(v, date):
        return v.strftime("%Y-%m-%d")
    return v


if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)
