-- ============================================================================
-- 0. CREACIÓN DE ESQUEMA Y EXTENSIONES
-- ============================================================================
-- 0.1 Limpieza total del entorno (DROP CASCADE) para reiniciar la BD, solo en desarrollo. 
-- En producción, se haría con migraciones controladas.
DROP SCHEMA IF EXISTS frimeet_schema CASCADE;

-- 1. Creamos el esquema propio para Frimeet
CREATE SCHEMA frimeet_schema;

-- 2. Instalamos las extensiones en 'public' (Buena práctica para que otras BD las compartan)
CREATE EXTENSION IF NOT EXISTS postgis SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA public;
CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA public;

-- 3. EL TRUCO DE MAGIA: Cambiamos el entorno de trabajo al nuevo esquema
SET search_path TO frimeet_schema, public;

-- ============================================================================
-- 1. CREACIÓN DE ENUMS (Tipos de datos predefinidos)
-- ============================================================================
CREATE TYPE gender_type AS ENUM ('hombre', 'mujer', 'prefiero_no_contestar');
CREATE TYPE plan_type AS ENUM ('free', 'premium', 'business_basic', 'business_pro');
CREATE TYPE aforo_status AS ENUM ('suficiente', 'poco', 'lleno', 'cerrado');
CREATE TYPE validation_phase AS ENUM ('descubrimiento', 'consolidacion', 'mantenimiento', 'validado');
CREATE TYPE auth_provider AS ENUM ('local', 'google');
CREATE TYPE post_author_type AS ENUM ('user', 'place');
CREATE TYPE friendship_status AS ENUM ('pending', 'accepted', 'blocked');
CREATE TYPE place_source AS ENUM ('osm', 'user', 'business');
CREATE TYPE validation_action AS ENUM ('confirm_exists', 'confirm_open', 'confirm_closed', 'confirm_info', 'reject_fake', 'reject_duplicate');
CREATE TYPE report_type AS ENUM ('permanently_closed', 'wrong_hours', 'wrong_location', 'duplicate', 'changed_name');
CREATE TYPE fricoin_type AS ENUM ('earn_validation', 'earn_place_registration', 'earn_route_completed', 'spend_premium_feature', 'spend_boost_place', 'admin_adjustment');
CREATE TYPE user_role AS ENUM ('cliente', 'negocio', 'verificador', 'admin');
CREATE TYPE route_status AS ENUM ('draft', 'active', 'completed', 'cancelled');
CREATE TYPE validation_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'applied');
CREATE TYPE sync_status AS ENUM ('running', 'success', 'failed');
CREATE TYPE notification_type AS ENUM ('friend_request', 'event_invite', 'route_shared', 'place_validated', 'fricoin_earned', 'promo', 'system', 'group_invite');
CREATE TYPE media_type AS ENUM ('photo', 'video');
CREATE TYPE group_role AS ENUM ('admin', 'member');
CREATE TYPE group_invite_privacy AS ENUM ('everyone', 'friends_only', 'nobody');
CREATE TYPE route_stop_status AS ENUM ('pending', 'in_progress', 'completed', 'skipped');
CREATE TYPE attendance_status_type AS ENUM ('confirmed', 'attended', 'cancelled', 'no_show');

-- ============================================================================
-- 2. TABLAS INDEPENDIENTES / BASE
-- ============================================================================
CREATE TABLE users (
                       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                       username VARCHAR(255) UNIQUE NOT NULL,
                       full_name VARCHAR(255) NOT NULL,
                       email VARCHAR(255) UNIQUE NOT NULL,
                       password_hash VARCHAR(255) NULL, 
                       auth_provider auth_provider DEFAULT 'local' NOT NULL,
                       provider_id VARCHAR(255) NULL, 
                       is_email_verified BOOLEAN DEFAULT FALSE NOT NULL,
                       avatar_url VARCHAR(500),
                       bio TEXT,
                       gender gender_type DEFAULT 'prefiero_no_contestar' NOT NULL,
                       last_seen TIMESTAMP NULL, -- Mantenido para registrar la última conexión al cerrar app/sesión
                       role user_role DEFAULT 'cliente' NOT NULL,
                       plan plan_type DEFAULT 'free' NOT NULL,
                       fricoins INT DEFAULT 0 NOT NULL,
                       trust_score INT DEFAULT 0 NOT NULL,
                       is_verified_kyc BOOLEAN DEFAULT FALSE NOT NULL,
                       home_location GEOGRAPHY(Point,4326) NULL,
                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE tags (
                      id SERIAL PRIMARY KEY,
                      name VARCHAR(255) UNIQUE NOT NULL,
                      category VARCHAR(255) NOT NULL
);

CREATE TABLE osm_sync_log (
                              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                              sync_type VARCHAR(50) NOT NULL, 
                              region VARCHAR(255) NOT NULL,   
                              started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                              finished_at TIMESTAMP NULL,
                              nodes_added INT DEFAULT 0 NOT NULL,
                              nodes_updated INT DEFAULT 0 NOT NULL,
                              nodes_removed INT DEFAULT 0 NOT NULL,
                              status sync_status NOT NULL,
                              error_message TEXT NULL
);

-- ============================================================================
-- 3. TABLAS DEPENDIENTES NIVEL 1
-- ============================================================================
CREATE TABLE email_verifications (
                                     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                                     user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                     verification_code VARCHAR(10) NOT NULL,
                                     expires_at TIMESTAMP NOT NULL,
                                     is_used BOOLEAN DEFAULT FALSE NOT NULL
);

CREATE TABLE user_preferences (
                                  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                  tag_id INT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
                                  PRIMARY KEY (user_id, tag_id)
);

CREATE TABLE user_group_settings (
                                     user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                                     invite_privacy group_invite_privacy DEFAULT 'everyone' NOT NULL,
                                     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE friendships (
                             user_id_1 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                             user_id_2 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                             status friendship_status DEFAULT 'pending' NOT NULL,
                             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                             PRIMARY KEY (user_id_1, user_id_2),
                             -- Garantiza que el UUID menor siempre se guarde en user_id_1 para evitar duplicidad A->B y B->A
                             CONSTRAINT friendships_order CHECK (user_id_1 < user_id_2)
);

CREATE TABLE groups (
                        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                        creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        name VARCHAR(255) NOT NULL,
                        description TEXT,
                        image_url VARCHAR(500) NULL,
                        is_private BOOLEAN DEFAULT TRUE NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE places (
                        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                        owner_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
                        osm_id BIGINT NULL, 
                        source place_source DEFAULT 'user' NOT NULL,
                        osm_tags JSONB NULL,
                        last_synced_at TIMESTAMP NULL,
                        name VARCHAR(255) NOT NULL,
                        description TEXT,
                        category VARCHAR(255) NOT NULL,
                        location GEOGRAPHY(Point, 4326) NOT NULL, 
                        address VARCHAR(500),
                        avg_cost_mxn DECIMAL(10, 2) NULL, 
                        duration_estimate_hrs DECIMAL(4, 2) NULL, 
                        price_level INT NULL, 
                        is_open    BOOLEAN DEFAULT TRUE  NOT NULL,
                        is_crowded BOOLEAN DEFAULT FALSE NOT NULL,
                        avg_rating DECIMAL(3, 2) DEFAULT 0.00 NOT NULL,
                        total_reviews INT DEFAULT 0 NOT NULL,
                        verification_score INT DEFAULT 0 NOT NULL,
                        phase validation_phase DEFAULT 'descubrimiento' NOT NULL,
                        is_permanently_closed BOOLEAN DEFAULT FALSE NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================================================
-- 4. TABLAS DEPENDIENTES NIVEL 2
-- ============================================================================
CREATE TABLE group_members (
                               group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
                               user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                               role group_role DEFAULT 'member' NOT NULL,
                               is_pinned BOOLEAN DEFAULT FALSE NOT NULL,
                               joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                               PRIMARY KEY (group_id, user_id)
);

CREATE TABLE place_media (
                             id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                             place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
                             uploaded_by UUID NULL REFERENCES users(id) ON DELETE SET NULL, 
                             url VARCHAR(500) NOT NULL,
                             media_type media_type NOT NULL,
                             is_primary BOOLEAN DEFAULT FALSE NOT NULL,
                             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE place_hours (
                             id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                             place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
                             day_of_week INT NOT NULL, 
                             opens_at TIME NULL,
                             closes_at TIME NULL,
                             is_closed BOOLEAN DEFAULT FALSE NOT NULL,
                             CONSTRAINT check_hours CHECK (is_closed = TRUE OR (opens_at IS NOT NULL AND closes_at IS NOT NULL))
);

CREATE TABLE place_tags (
                            place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
                            tag_id INT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
                            PRIMARY KEY (place_id, tag_id)
);

CREATE TABLE favorite_places ( 
                                 user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                 place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
                                 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                                 PRIMARY KEY (user_id, place_id)
);

CREATE TABLE visited_places ( 
                                 id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                                 user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                 place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
                                 visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE clubs (
                       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                       creator_id UUID NULL REFERENCES users(id) ON DELETE SET NULL, 
                       name VARCHAR(255) NOT NULL,
                       description TEXT,
                       category VARCHAR(255) NOT NULL,
                       place_id UUID NULL REFERENCES places(id) ON DELETE SET NULL,
                       is_online BOOLEAN DEFAULT FALSE NOT NULL,
                       image_url VARCHAR(500) NULL,
                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE routes (
                        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                        group_id UUID NULL REFERENCES groups(id) ON DELETE SET NULL,
                        creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        name VARCHAR(255) NOT NULL,
                        scheduled_for TIMESTAMP NOT NULL,
                        status route_status NOT NULL,
                        is_public BOOLEAN DEFAULT FALSE NOT NULL,
                        share_token VARCHAR(255) NULL UNIQUE,
                        total_distance_km DECIMAL(10, 2) NULL, 
                        total_cost_mxn DECIMAL(10, 2) NULL,    
                        entropy_score DECIMAL(5, 4) NULL,     
                        fitness_score DECIMAL(10, 4) NULL,     
                        ag_generations INT NULL,
                        ag_population INT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE validations (
                             id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                             place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
                             user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                             action_type validation_action NOT NULL,
                             gps_accuracy DECIMAL(6, 2) NOT NULL,
                             status validation_status NOT NULL,
                             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE place_reports (
                               id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                               place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
                               user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                               report_type report_type NOT NULL,
                               description TEXT,
                               status report_status DEFAULT 'pending' NOT NULL,
                               created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE fricoin_transactions (
                                      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                                      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                      transaction_type fricoin_type NOT NULL,
                                      amount INT NOT NULL, 
                                      reference_id UUID NULL, 
                                      description VARCHAR(255) NOT NULL,
                                      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE posts (
                       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                       author_type post_author_type NOT NULL,
                       author_user_id UUID NULL REFERENCES users(id) ON DELETE CASCADE,
                       author_place_id UUID NULL REFERENCES places(id) ON DELETE CASCADE,
                       tagged_place_id UUID NULL REFERENCES places(id) ON DELETE SET NULL,
                       content TEXT NOT NULL,
                       media_url VARCHAR(500) NULL,
                       music_track VARCHAR(255) NULL,
                       rating INT NULL, 
                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE notifications (
                               id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                               user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                               type notification_type NOT NULL,
                               title VARCHAR(255) NOT NULL,
                               body TEXT NOT NULL,
                               reference_id UUID NULL,
                               is_read BOOLEAN DEFAULT FALSE NOT NULL,
                               created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================================================
-- 5. TABLAS DEPENDIENTES NIVEL 3
-- ============================================================================

CREATE TABLE route_attendees (
                              route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
                              user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                              joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                              PRIMARY KEY (route_id, user_id)
);

CREATE TABLE club_members (
                              club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
                              user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                              role group_role DEFAULT 'member' NOT NULL,
                              joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                              PRIMARY KEY (club_id, user_id)
);

CREATE TABLE club_messages (
                               id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                               club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
                               sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                               reply_to_id UUID NULL REFERENCES club_messages(id) ON DELETE SET NULL, 
                               content TEXT NOT NULL,
                               created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE group_messages (
                                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                                group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
                                sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                reply_to_id UUID NULL REFERENCES group_messages(id) ON DELETE SET NULL, 
                                content TEXT NOT NULL,
                                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE events (
                        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                        creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        title VARCHAR(255) NOT NULL,
                        description TEXT,
                        club_id UUID NULL REFERENCES clubs(id) ON DELETE SET NULL,
                        place_id UUID NULL REFERENCES places(id) ON DELETE SET NULL,
                        start_time TIMESTAMP NOT NULL,
                        duration_minutes INT NOT NULL,
                        max_attendees INT NULL,
                        is_public BOOLEAN DEFAULT TRUE NOT NULL,
                        cover_image_url VARCHAR(500),
                        final_aforo_status aforo_status,
                        is_holiday BOOLEAN DEFAULT FALSE NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE route_stops (
                             id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                             route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
                             place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
                             stop_order INT NOT NULL,
                             haversine_distance_to_next_km DECIMAL(10, 2) NULL,
                             estimated_duration_hrs DECIMAL(4, 2) NULL,
                             estimated_arrival TIMESTAMP NOT NULL,
                             status route_stop_status DEFAULT 'pending' NOT NULL
);

CREATE TABLE post_tagged_users (
                                   post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
                                   user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                   PRIMARY KEY (post_id, user_id)
);

CREATE TABLE post_likes (
                            post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
                            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                            PRIMARY KEY (post_id, user_id)
);

CREATE TABLE post_comments (
                               id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                               post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
                               user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                               content TEXT NOT NULL,
                               created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================================================
-- 6. TABLAS DEPENDIENTES NIVEL 4
-- ============================================================================
CREATE TABLE event_attendees (
                                 event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
                                 user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                 joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                                 attendance_status attendance_status_type DEFAULT 'confirmed' NOT NULL,
                                 PRIMARY KEY (event_id, user_id)
);

CREATE TABLE event_tags (
                            event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
                            tag_id INT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
                            PRIMARY KEY (event_id, tag_id)
);

CREATE TABLE event_spending (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    event_id UUID NOT NULL
        REFERENCES events(id) ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,

    amount_mxn DECIMAL(10,2) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE weather_history (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_date       DATE          NOT NULL,
    city             VARCHAR(100)  NOT NULL,
    weather_condition VARCHAR(50)  NOT NULL,
    temperature      DECIMAL(5,2)  NOT NULL
);

-- ============================================================================
-- 7. CREACIÓN DE ÍNDICES OPTIMIZADOS PARA PRODUCCIÓN
-- ============================================================================
CREATE INDEX idx_places_location ON places USING GIST(location);
CREATE INDEX idx_places_osm_id ON places(osm_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_routes_creator ON routes(creator_id, created_at DESC);
CREATE INDEX idx_users_search ON frimeet_schema.users USING GIN (username gin_trgm_ops, full_name gin_trgm_ops);

-- Índices añadidos para optimizar consultas de historial y popularidad
CREATE INDEX idx_visited_places_user ON visited_places(user_id, visited_at DESC);
CREATE INDEX idx_visited_places_place ON visited_places(place_id);

CREATE INDEX idx_route_stops_route ON route_stops(route_id, stop_order ASC);
CREATE INDEX idx_route_attendees_user ON route_attendees(user_id);
CREATE INDEX idx_friendships_user2 ON friendships(user_id_2);
CREATE INDEX idx_weather_date_city ON weather_history(event_date, city);