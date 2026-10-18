import os
import psycopg2

conn = psycopg2.connect(os.environ["DATABASE_URL"])
conn.autocommit = True
cur = conn.cursor()

p = conn.get_dsn_parameters()
print("Base :", p.get("host"), p.get("dbname"))

cur.execute("select column_name from information_schema.columns where table_name='django_content_type'")
colonnes = [r[0] for r in cur.fetchall()]
print("Colonnes :", colonnes)

if "name" in colonnes:
    print("La colonne name existe encore : on ne touche a rien.")
    conn.close()
    raise SystemExit

MIGRATIONS = [
    ("contenttypes", "0002_remove_content_type_name"),
    ("auth", "0002_alter_permission_name_max_length"),
    ("auth", "0003_alter_user_email_max_length"),
    ("auth", "0004_alter_user_username_opts"),
    ("auth", "0005_alter_user_last_login_null"),
    ("auth", "0006_require_contenttypes_0002"),
    ("auth", "0007_alter_validators_add_error_messages"),
    ("auth", "0008_alter_user_username_max_length"),
    ("auth", "0009_alter_user_last_name_max_length"),
    ("auth", "0010_alter_group_name_max_length"),
    ("auth", "0011_update_proxy_permissions"),
    ("auth", "0012_alter_user_first_name_max_length"),
    ("admin", "0002_logentry_remove_auto_add"),
    ("admin", "0003_logentry_add_action_flag_choices"),
]

for app, name in MIGRATIONS:
    cur.execute("select 1 from django_migrations where app=%s and name=%s", (app, name))
    if cur.fetchone():
        continue
    cur.execute("insert into django_migrations (app, name, applied) values (%s, %s, now())", (app, name))
    print("Marquee :", app, name)

print("Termine.")
conn.close()
