-- ============================================================
--  Примеры типичных запросов к базе данных клиники
-- ============================================================

-- ------------------------------------------------------------
--  1. Все приёмы на конкретную дату с именами врача и пациента 
-- ------------------------------------------------------------ 
SELECT
    a.appointment_time                         AS время,
    p.last_name || ' ' || p.first_name         AS пациент,
    d.last_name || ' ' || d.first_name         AS врач,
    d.specialty                                AS специальность,
    a.type                                     AS тип_приёма,
    a.status                                   AS статус
FROM appointments a
JOIN patients p ON p.id = a.patient_id
JOIN doctors  d ON d.id = a.doctor_id
WHERE a.appointment_date = '2026-04-10'
ORDER BY a.appointment_time;


-- ------------------------------------------------------------
--  2. История приёмов конкретного пациента
-- ------------------------------------------------------------
SELECT
    a.appointment_date                  AS дата,
    a.appointment_time                  AS время,
    d.last_name || ' ' || d.first_name  AS врач,
    d.specialty                         AS специальность,
    a.type                              AS тип,
    a.status                            AS статус,
    a.notes                             AS примечания
FROM appointments a
JOIN doctors d ON d.id = a.doctor_id
WHERE a.patient_id = 1
ORDER BY a.appointment_date DESC, a.appointment_time;


-- ------------------------------------------------------------
--  3. Медицинская карта пациента со всеми анализами
-- ------------------------------------------------------------
SELECT
    mr.visit_date               AS дата_визита,
    d.last_name || ' ' || d.first_name AS врач,
    mr.diagnosis                AS диагноз,
    mr.prescription             AS назначение,
    mr.notes                    AS примечания,
    lt.test_name                AS анализ,
    lt.test_date                AS дата_анализа,
    lt.result                   AS результат
FROM medical_records mr
JOIN doctors d ON d.id = mr.doctor_id
LEFT JOIN lab_tests lt ON lt.medical_record_id = mr.id
WHERE mr.patient_id = 2
ORDER BY mr.visit_date DESC, lt.test_date;


-- ------------------------------------------------------------
--  4. Загруженность врачей: количество приёмов за апрель 2026
-- ------------------------------------------------------------
SELECT
    d.last_name || ' ' || d.first_name  AS врач,
    d.specialty                         AS специальность,
    COUNT(a.id)                         AS кол_во_приёмов
FROM doctors d
LEFT JOIN appointments a ON a.doctor_id = d.id
    AND a.appointment_date BETWEEN '2026-04-01' AND '2026-04-30'
    AND a.status != 'отменен'
GROUP BY d.id, d.last_name, d.first_name, d.specialty
ORDER BY кол_во_приёмов DESC;


-- ------------------------------------------------------------
--  5. Финансовый отчёт за апрель 2026
-- ------------------------------------------------------------
SELECT
    p.last_name || ' ' || p.first_name  AS пациент,
    py.payment_date                     AS дата,
    py.amount                           AS сумма,
    py.type                             AS вид_услуги,
    py.method                           AS способ_оплаты,
    py.status                           AS статус
FROM payments py
JOIN patients p ON p.id = py.patient_id
WHERE py.payment_date BETWEEN '2026-04-01' AND '2026-04-30'
ORDER BY py.payment_date, py.status;


-- ------------------------------------------------------------
--  6. Итог по доходам: оплачено vs. не оплачено
-- ------------------------------------------------------------
SELECT
    status                      AS статус,
    COUNT(*)                    AS количество,
    SUM(amount)                 AS сумма_руб
FROM payments
GROUP BY status;


-- ------------------------------------------------------------
--  7. Пациенты у которых есть запланированные приёмы
-- ------------------------------------------------------------
SELECT DISTINCT
    p.last_name || ' ' || p.first_name  AS пациент,
    p.phone                             AS телефон,
    a.appointment_date                  AS дата_приёма,
    a.appointment_time                  AS время
FROM appointments a
JOIN patients p ON p.id = a.patient_id
WHERE a.status = 'запланирован'
    AND a.appointment_date >= CURRENT_DATE
ORDER BY a.appointment_date, a.appointment_time;


-- ------------------------------------------------------------
--  8. Пациенты без приёмов за последние 90 дней (неактивные)
-- ------------------------------------------------------------
SELECT
    p.last_name || ' ' || p.first_name  AS пациент,
    p.phone                             AS телефон,
    p.email                             AS email,
    MAX(a.appointment_date)             AS последний_приём
FROM patients p
LEFT JOIN appointments a ON a.patient_id = p.id AND a.status = 'проведен'
GROUP BY p.id, p.last_name, p.first_name, p.phone, p.email
HAVING MAX(a.appointment_date) < CURRENT_DATE - INTERVAL '90 days'
    OR MAX(a.appointment_date) IS NULL
ORDER BY последний_приём NULLS FIRST;


-- ------------------------------------------------------------
--  9. Расписание конкретного врача на ближайшую неделю
-- ------------------------------------------------------------
SELECT
    a.appointment_date                  AS дата,
    a.appointment_time                  AS время,
    p.last_name || ' ' || p.first_name  AS пациент,
    p.phone                             AS телефон,
    a.type                              AS тип,
    a.notes                             AS примечания
FROM appointments a
JOIN patients p ON p.id = a.patient_id
WHERE a.doctor_id = 1
    AND a.appointment_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
    AND a.status = 'запланирован'
ORDER BY a.appointment_date, a.appointment_time;


-- ------------------------------------------------------------
--  10. Поиск пациента по фамилии (частичное совпадение)
-- ------------------------------------------------------------
SELECT
    id,
    last_name || ' ' || first_name || ' ' || COALESCE(middle_name, '') AS ФИО,
    birth_date,
    phone,
    email
FROM patients
WHERE last_name ILIKE '%ивано%'   -- регистронезависимый поиск
ORDER BY last_name, first_name;
