import os
import uuid
import random
import datetime
import numpy as np
import psycopg2
from psycopg2.extras import execute_batch
from dotenv import load_dotenv
from faker import Faker

def run_seed():
    load_dotenv()
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("Error: DATABASE_URL no encontrada en .env")
        return
        
    fake = Faker('es_MX')
    conn = None
    cur = None
    
    try:
        print("Conectando a la base de datos...")
        conn = psycopg2.connect(db_url)
        conn.autocommit = False
        cur = conn.cursor()
        
        # 1. CONNECT & search_path
        cur.execute("SET search_path TO frimeet_schema, public;")
        
        # 2. CLEAN
        tables_to_clean = [
            "weather_history",
            "event_spending",
            "event_tags",
            "event_attendees",
            "events",
            "club_messages",
            "club_members",
            "clubs",
            "post_comments",
            "post_likes",
            "post_tagged_users",
            "posts",
            "route_attendees",
            "route_stops",
            "routes",
            "group_messages",
            "group_members",
            "groups",
            "notifications",
            "fricoin_transactions",
            "place_reports",
            "validations",
            "visited_places",
            "favorite_places",
            "place_tags",
            "place_hours",
            "place_media",
            "places",
            "friendships",
            "user_group_settings",
            "user_preferences",
            "email_verifications",
            "osm_sync_log",
            "users",
            "tags"
        ]
        
        print("Limpiando tablas (en orden seguro)...")
        for table in tables_to_clean:
            cur.execute(f"DELETE FROM {table};")
            
        # 3. GENERATE
        
        # a) tags (30 filas)
        print("Generando tags...")
        tag_categories = [
            "gastronomía", "deportes", "cultura", "tech", "música",
            "naturaleza", "arte", "social", "bienestar", "cine"
        ]
        tags_data = []
        for i in range(30):
            cat = tag_categories[i % 10]
            name = f"{cat} - {fake.unique.word()}"
            tags_data.append((name, cat))
        
        tag_ids = []
        for tag in tags_data:
            cur.execute("INSERT INTO tags (name, category) VALUES (%s, %s) RETURNING id;", tag)
            tag_ids.append(cur.fetchone()[0])
        
        # b) users (300 filas)
        print("Generando users...")
        users_data = []
        user_ids = []
        roles = ['cliente', 'negocio', 'verificador']
        role_probs = [0.85, 0.10, 0.05]
        
        plans = ['free', 'premium', 'business_basic']
        plan_probs = [0.70, 0.25, 0.05]
        
        genders = ['hombre', 'mujer', 'prefiero_no_contestar']
        auth_providers = ['local', 'google']
        auth_probs = [0.70, 0.30]
        
        for _ in range(300):
            uid = str(uuid.uuid4())
            user_ids.append(uid)
            username = fake.unique.user_name()
            full_name = fake.name()
            email = fake.unique.email()
            password_hash = "fake_hash_123"
            auth_provider = np.random.choice(auth_providers, p=auth_probs)
            gender = np.random.choice(genders)
            role = np.random.choice(roles, p=role_probs)
            plan = np.random.choice(plans, p=plan_probs)
            fricoins = random.randint(0, 500)
            trust_score = random.randint(0, 100)
            
            lat = 16.7 + random.uniform(-0.05, 0.05)
            lon = -93.1 + random.uniform(-0.05, 0.05)
            
            users_data.append((
                uid, username, full_name, email, password_hash,
                auth_provider, gender, role, plan, fricoins, trust_score,
                lon, lat
            ))
            
        execute_batch(cur, """
            INSERT INTO users (
                id, username, full_name, email, password_hash,
                auth_provider, gender, role, plan, fricoins, trust_score,
                home_location
            ) VALUES (
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s,
                ST_SetSRID(ST_MakePoint(%s, %s), 4326)
            );
        """, users_data)
        
        # c) places (80 filas)
        print("Generando places...")
        places_data = []
        place_ids = []
        place_cost_map = {}
        
        sources = ['osm', 'user', 'business']
        source_probs = [0.60, 0.30, 0.10]
        phases = ['consolidacion', 'mantenimiento', 'validado']
        phase_probs = [0.40, 0.40, 0.20]
        
        for _ in range(80):
            pid = str(uuid.uuid4())
            place_ids.append(pid)
            name = fake.company()
            source = np.random.choice(sources, p=source_probs)
            category = random.choice(tag_categories)
            
            lat = 16.7 + random.uniform(-0.04, 0.04)
            lon = -93.1 + random.uniform(-0.04, 0.04)
            
            price_level = random.randint(1, 4)
            avg_cost_mxn = random.uniform(50 + (price_level-1)*150, 200 + (price_level-1)*200)
            avg_cost_mxn = min(800.0, max(50.0, avg_cost_mxn))
            place_cost_map[pid] = avg_cost_mxn
            
            avg_rating = random.uniform(3.0, 5.0)
            phase = np.random.choice(phases, p=phase_probs)
            
            places_data.append((
                pid, name, source, category, avg_cost_mxn, price_level,
                avg_rating, phase, lon, lat
            ))
            
        execute_batch(cur, """
            INSERT INTO places (
                id, name, source, category, avg_cost_mxn, price_level,
                avg_rating, phase, location
            ) VALUES (
                %s, %s, %s, %s, %s, %s,
                %s, %s, ST_SetSRID(ST_MakePoint(%s, %s), 4326)
            );
        """, places_data)
        
        # d) place_tags (2-4 per place)
        print("Generando place_tags...")
        place_tags_data = []
        for pid in place_ids:
            num_tags = random.randint(2, 4)
            p_tags = random.sample(tag_ids, num_tags)
            for tid in p_tags:
                place_tags_data.append((pid, tid))
                
        execute_batch(cur, "INSERT INTO place_tags (place_id, tag_id) VALUES (%s, %s);", place_tags_data)
        
        # e) clubs (40 filas)
        print("Generando clubs...")
        clubs_data = []
        club_ids = []
        for _ in range(40):
            cid = str(uuid.uuid4())
            club_ids.append(cid)
            name = f"Club {fake.company()}"
            category = random.choice(tag_categories)
            
            has_place = random.random() < 0.60
            place_id = random.choice(place_ids) if has_place else None
            is_online = random.random() < 0.20
            
            clubs_data.append((cid, name, category, place_id, is_online))
            
        execute_batch(cur, """
            INSERT INTO clubs (id, name, category, place_id, is_online)
            VALUES (%s, %s, %s, %s, %s);
        """, clubs_data)
        
        # f) club_members
        print("Generando club_members...")
        club_members_dict = {}
        club_members_data = []
        for cid in club_ids:
            num_members = random.randint(5, 60)
            members = random.sample(user_ids, num_members)
            club_members_dict[cid] = members
            for uid in members:
                club_members_data.append((cid, uid))
                
        execute_batch(cur, "INSERT INTO club_members (club_id, user_id) VALUES (%s, %s);", club_members_data)
        
        # g) weather_history (365 días)
        print("Generando weather_history...")
        weather_data = []
        conditions = ['soleado', 'nublado', 'lluvioso', 'tormenta', 'fresco']
        cond_probs = [0.40, 0.25, 0.20, 0.10, 0.05]
        
        today = datetime.date.today()
        weather_dict = {} 
        
        for i in range(365):
            d = today - datetime.timedelta(days=i)
            cond = np.random.choice(conditions, p=cond_probs)
            if d.month in [3, 4, 5]:
                temp = random.uniform(28, 38)
            else:
                temp = random.uniform(18, 32)
                
            weather_data.append((d, 'Tuxtla Gutiérrez', cond, temp))
            weather_dict[d] = temp
            
        execute_batch(cur, """
            INSERT INTO weather_history (event_date, city, weather_condition, temperature)
            VALUES (%s, %s, %s, %s);
        """, weather_data)
        
        # h) events (400 filas)
        print("Generando events...")
        events_data = []
        events_meta = [] 
        
        for _ in range(400):
            eid = str(uuid.uuid4())
            creator_id = random.choice(user_ids)
            title = fake.catch_phrase()
            
            has_club = random.random() < 0.80
            club_id = random.choice(club_ids) if has_club else None
            place_id = random.choice(place_ids)
            
            days_ago = random.randint(0, 364)
            event_date = today - datetime.timedelta(days=days_ago)
            start_time = datetime.datetime.combine(event_date, datetime.time(hour=random.randint(8, 22)))
            
            duration = random.randint(60, 240)
            max_attendees = random.randint(10, 150)
            
            is_weekend = event_date.weekday() >= 4
            club_members_count = len(club_members_dict.get(club_id, [])) if club_id else 0
            temp_that_day = weather_dict.get(event_date, 25.0)
            
            is_large_club = club_members_count > 30
            is_hot = temp_that_day > 28.0
            
            w_suf, w_poco, w_lleno, w_cerrado = 55, 20, 15, 10
            if is_large_club or is_weekend or is_hot:
                w_lleno += 30
                w_suf -= 10
                w_poco -= 15
                w_cerrado -= 5
                
            weights = [max(0, w_suf), max(0, w_poco), max(0, w_lleno), max(0, w_cerrado)]
            total_w = sum(weights)
            probs = [w/total_w for w in weights]
            
            aforo = np.random.choice(['suficiente', 'poco', 'lleno', 'cerrado'], p=probs)
            
            events_data.append((
                eid, creator_id, title, club_id, place_id,
                start_time, duration, max_attendees, aforo
            ))
            
            events_meta.append({
                'eid': eid,
                'aforo': aforo,
                'max_attendees': max_attendees,
                'club_id': club_id,
                'place_id': place_id
            })
            
        execute_batch(cur, """
            INSERT INTO events (
                id, creator_id, title, club_id, place_id,
                start_time, duration_minutes, max_attendees, final_aforo_status
            ) VALUES (
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s
            );
        """, events_data)
        
        # i) event_attendees & j) event_spending
        print("Generando event_attendees y event_spending...")
        event_attendees_data = []
        event_spending_data = []
        
        for ev in events_meta:
            eid = ev['eid']
            aforo = ev['aforo']
            max_att = ev['max_attendees']
            club_id = ev['club_id']
            place_id = ev['place_id']
            
            pool = club_members_dict.get(club_id, user_ids)
            
            num_att = 0
            if aforo == 'lleno':
                num_att = min(max_att, int(len(pool) * random.uniform(0.95, 1.0)))
            elif aforo == 'poco':
                num_att = min(max_att, int(len(pool) * random.uniform(0.50, 0.70)))
            elif aforo == 'suficiente':
                num_att = min(max_att, int(len(pool) * random.uniform(0.20, 0.45)))
            elif aforo == 'cerrado':
                num_att = min(max_att, random.randint(0, 5))
                
            num_att = min(num_att, len(pool))
            if num_att > 0:
                attendees = random.sample(pool, num_att)
                
                att_status_choices = ['attended', 'confirmed', 'cancelled', 'no_show']
                att_status_probs = [0.70, 0.20, 0.05, 0.05]
                
                for uid in attendees:
                    status = np.random.choice(att_status_choices, p=att_status_probs)
                    event_attendees_data.append((eid, uid, status))
                    
                    if status == 'attended':
                        base_cost = place_cost_map.get(place_id, 100.0)
                        amount = random.gauss(base_cost, base_cost * 0.30)
                        amount = min(1200.0, max(20.0, amount))
                        event_spending_data.append((eid, uid, amount))
                        
        execute_batch(cur, """
            INSERT INTO event_attendees (event_id, user_id, attendance_status)
            VALUES (%s, %s, %s);
        """, event_attendees_data)
        
        execute_batch(cur, """
            INSERT INTO event_spending (event_id, user_id, amount_mxn)
            VALUES (%s, %s, %s);
        """, event_spending_data)
        
        conn.commit()
        
        # 4. IMPRIMIR RESUMEN
        aforo_counts = {'suficiente': 0, 'poco': 0, 'lleno': 0, 'cerrado': 0}
        for ev in events_meta:
            aforo_counts[ev['aforo']] += 1
            
        total_evs = len(events_meta)
        print("\n--- RESUMEN DE GENERACIÓN ---")
        print(f"Usuarios: {len(users_data)} | Places: {len(places_data)} | Clubs: {len(clubs_data)} | Eventos: {len(events_data)} | Asistencias: {len(event_attendees_data)} | Gastos: {len(event_spending_data)}")
        print(f"Distribución aforo: "
              f"suficiente={aforo_counts['suficiente']/total_evs*100:.1f}%, "
              f"poco={aforo_counts['poco']/total_evs*100:.1f}%, "
              f"lleno={aforo_counts['lleno']/total_evs*100:.1f}%, "
              f"cerrado={aforo_counts['cerrado']/total_evs*100:.1f}%")
        print("¡Base de datos sembrada correctamente!")
        
    except Exception as e:
        if conn is not None:
            conn.rollback()
        print(f"Error durante el seed, haciendo rollback. Contexto: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if cur is not None:
            cur.close()
        if conn is not None:
            conn.close()

if __name__ == "__main__":
    run_seed()
