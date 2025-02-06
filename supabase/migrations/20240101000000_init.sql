CREATE TABLE posts (
    id BIGINT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    version TEXT,
    server_type TEXT,
    connection_type TEXT,
    game_type TEXT,
    save_type TEXT,
    playstyles TEXT,
    loader TEXT,
    contact TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    retention_time INTEGER,
    reported BOOLEAN DEFAULT false
); 