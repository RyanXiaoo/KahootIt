CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE quizzes (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    pdf_filename TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    question_count INTEGER NOT NULL DEFAULT 0,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE questions (
    id BIGSERIAL PRIMARY KEY,
    quiz_id BIGINT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_answer_index INTEGER NOT NULL,
    explanation TEXT
);

CREATE TABLE game_sessions (
    id BIGSERIAL PRIMARY KEY,
    pin VARCHAR(6) UNIQUE NOT NULL,
    quiz_id BIGINT NOT NULL REFERENCES quizzes(id),
    host_id UUID NOT NULL REFERENCES auth.users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'lobby',
    current_question_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ
);

CREATE TABLE player_responses (
    id BIGSERIAL PRIMARY KEY,
    game_session_id BIGINT NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    player_name VARCHAR(50) NOT NULL,
    player_socket_id VARCHAR(100),
    question_id BIGINT NOT NULL REFERENCES questions(id),
    answer_index INTEGER NOT NULL,
    time_taken_ms INTEGER,
    points_earned INTEGER DEFAULT 0,
    answered_at TIMESTAMPTZ DEFAULT NOW()
);
