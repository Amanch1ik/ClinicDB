-- ============================================================
--  База данных медицинской клиники
--  PostgreSQL 15+
--  Автор: Amanchik
-- ============================================================

-- Сначала удаляем всё если уже было, чтобы можно было накатить заново
DROP TABLE IF EXISTS payments      CASCADE;
DROP TABLE IF EXISTS lab_tests     CASCADE;
DROP TABLE IF EXISTS medical_records CASCADE;
DROP TABLE IF EXISTS appointments  CASCADE;
DROP TABLE IF EXISTS users         CASCADE;
DROP TABLE IF EXISTS doctors       CASCADE;
DROP TABLE IF EXISTS patients      CASCADE;

DROP TYPE IF EXISTS appointment_type   CASCADE;
DROP TYPE IF EXISTS appointment_status CASCADE;
DROP TYPE IF EXISTS payment_type       CASCADE;
DROP TYPE IF EXISTS payment_method     CASCADE;
DROP TYPE IF EXISTS payment_status     CASCADE;
DROP TYPE IF EXISTS user_role          CASCADE;
DROP TYPE IF EXISTS gender_type        CASCADE;

-- ============================================================
--  Перечисления (ENUM)
-- ============================================================

CREATE TYPE gender_type AS ENUM ('М', 'Ж');

CREATE TYPE appointment_type AS ENUM (
    'консультация',
    'анализ',
    'процедура'
);

CREATE TYPE appointment_status AS ENUM (
    'запланирован',
    'проведен',
    'отменен'
);

CREATE TYPE payment_type AS ENUM (
    'оплата приёма',
    'оплата процедуры'
);

CREATE TYPE payment_method AS ENUM (
    'наличные',
    'карта',
    'онлайн'
);

CREATE TYPE payment_status AS ENUM (
    'оплачено',
    'не оплачено'
);

-- роли: администратор видит всё, врач — только своих пациентов,
-- регистратор — расписание и пациентов без медкарт
CREATE TYPE user_role AS ENUM (
    'администратор',
    'врач',
    'регистратор'
);

-- ============================================================
--  Пациенты
-- ============================================================

CREATE TABLE patients (
    id             SERIAL PRIMARY KEY,
    last_name      VARCHAR(60)  NOT NULL,
    first_name     VARCHAR(60)  NOT NULL,
    middle_name    VARCHAR(60),
    birth_date     DATE         NOT NULL,
    gender         gender_type  NOT NULL,
    phone          VARCHAR(20)  UNIQUE,
    email          VARCHAR(120) UNIQUE,
    address        TEXT,
    created_at     TIMESTAMP    NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE patients IS 'Пациенты клиники';

-- ============================================================
--  Врачи
-- ============================================================

CREATE TABLE doctors (
    id             SERIAL PRIMARY KEY,
    last_name      VARCHAR(60)  NOT NULL,
    first_name     VARCHAR(60)  NOT NULL,
    middle_name    VARCHAR(60),
    specialty      VARCHAR(100) NOT NULL,
    phone          VARCHAR(20)  UNIQUE,
    email          VARCHAR(120) UNIQUE,
    office         VARCHAR(20),          -- номер кабинета
    created_at     TIMESTAMP    NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE doctors IS 'Врачи клиники';

-- ============================================================
--  Пользователи системы
-- ============================================================

CREATE TABLE users (
    id             SERIAL PRIMARY KEY,
    login          VARCHAR(60)  NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL, -- bcrypt, никогда не храним открытый пароль
    role           user_role    NOT NULL,
    email          VARCHAR(120) NOT NULL UNIQUE,
    doctor_id      INT          REFERENCES doctors(id) ON DELETE SET NULL,
    created_at     TIMESTAMP    NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE users IS 'Учётные записи для входа в систему';
COMMENT ON COLUMN users.doctor_id IS 'Заполняется только для роли "врач"';

-- ============================================================
--  Расписание приёмов
-- ============================================================

CREATE TABLE appointments (
    id             SERIAL PRIMARY KEY,
    patient_id     INT              NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id      INT              NOT NULL REFERENCES doctors(id)  ON DELETE CASCADE,
    appointment_date DATE           NOT NULL,
    appointment_time TIME           NOT NULL,
    type           appointment_type NOT NULL DEFAULT 'консультация',
    status         appointment_status NOT NULL DEFAULT 'запланирован',
    notes          TEXT,
    created_at     TIMESTAMP        NOT NULL DEFAULT NOW(),

    -- один врач не может принимать двух пациентов одновременно
    CONSTRAINT uq_doctor_slot UNIQUE (doctor_id, appointment_date, appointment_time)
);

COMMENT ON TABLE appointments IS 'Расписание приёмов пациентов';

-- ============================================================
--  Медицинские карты
-- ============================================================

CREATE TABLE medical_records (
    id             SERIAL PRIMARY KEY,
    patient_id     INT       NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id      INT       NOT NULL REFERENCES doctors(id)  ON DELETE RESTRICT,
    visit_date     DATE      NOT NULL DEFAULT CURRENT_DATE,
    diagnosis      TEXT      NOT NULL,
    prescription   TEXT,
    notes          TEXT,
    created_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE medical_records IS 'Медицинские карты (записи по каждому приёму)';

-- ============================================================
--  Лабораторные анализы
-- ============================================================

CREATE TABLE lab_tests (
    id                SERIAL PRIMARY KEY,
    medical_record_id INT        NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
    test_name         VARCHAR(150) NOT NULL,
    test_date         DATE         NOT NULL,
    result            TEXT,
    notes             TEXT,
    created_at        TIMESTAMP    NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE lab_tests IS 'Лабораторные анализы, привязанные к медкарте';

-- ============================================================
--  Финансовые операции
-- ============================================================

CREATE TABLE payments (
    id             SERIAL PRIMARY KEY,
    patient_id     INT            NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    amount         NUMERIC(10,2)  NOT NULL CHECK (amount > 0),
    payment_date   DATE           NOT NULL DEFAULT CURRENT_DATE,
    type           payment_type   NOT NULL,
    method         payment_method NOT NULL,
    status         payment_status NOT NULL DEFAULT 'не оплачено',
    created_at     TIMESTAMP      NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE payments IS 'Финансовые операции клиники';

-- ============================================================
--  Индексы (часто используемые фильтры)
-- ============================================================

CREATE INDEX idx_appointments_patient  ON appointments (patient_id);
CREATE INDEX idx_appointments_doctor   ON appointments (doctor_id);
CREATE INDEX idx_appointments_date     ON appointments (appointment_date);

CREATE INDEX idx_medical_records_patient ON medical_records (patient_id);
CREATE INDEX idx_medical_records_doctor  ON medical_records (doctor_id);

CREATE INDEX idx_lab_tests_record      ON lab_tests (medical_record_id);

CREATE INDEX idx_payments_patient      ON payments (patient_id);
CREATE INDEX idx_payments_date         ON payments (payment_date);

-- ============================================================
--  Представления (для удобства)
-- ============================================================

-- Список приёмов с именами врача и пациента
CREATE OR REPLACE VIEW v_appointments AS
SELECT
    a.id,
    a.appointment_date,
    a.appointment_time,
    a.type,
    a.status,
    p.last_name  || ' ' || p.first_name AS patient_name,
    d.last_name  || ' ' || d.first_name AS doctor_name,
    d.specialty,
    a.notes
FROM appointments a
JOIN patients p ON p.id = a.patient_id
JOIN doctors  d ON d.id = a.doctor_id;

-- Сводка по пациенту: количество приёмов и сумма платежей
CREATE OR REPLACE VIEW v_patient_summary AS
SELECT
    p.id,
    p.last_name || ' ' || p.first_name AS full_name,
    p.birth_date,
    p.phone,
    COUNT(DISTINCT a.id)  AS total_appointments,
    COUNT(DISTINCT mr.id) AS total_records,
    COALESCE(SUM(py.amount) FILTER (WHERE py.status = 'оплачено'), 0) AS total_paid
FROM patients p
LEFT JOIN appointments    a  ON a.patient_id  = p.id
LEFT JOIN medical_records mr ON mr.patient_id = p.id
LEFT JOIN payments        py ON py.patient_id = p.id
GROUP BY p.id, p.last_name, p.first_name, p.birth_date, p.phone;
