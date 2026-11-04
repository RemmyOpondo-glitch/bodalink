-- The Database
CREATE DATABASE bodalink;
USE bodalink;

-- USERS Table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone VARCHAR(15) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    profile_photo VARCHAR(255)
);

-- Riders Table
CREATE TABLE riders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    stage VARCHAR(100) NOT NULL,
    available BOOLEAN DEFAULT TRUE
);

-- Trips Table
CREATE TABLE trips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    rider_id INT NOT NULL,
    pickup VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    distance DECIMAL(5,2) NOT NULL,
    fare DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending',

    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (rider_id) REFERENCES riders(id)
);

-- Newsletter signups (server.js also creates this table automatically if it is missing)
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(254) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Native mobile API authentication tokens (only token hashes are stored).
CREATE TABLE IF NOT EXISTS api_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash CHAR(64) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_api_tokens_user_id (user_id),
    CONSTRAINT fk_api_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Persistent website login sessions.
CREATE TABLE IF NOT EXISTS web_sessions (
    session_id VARCHAR(128) NOT NULL PRIMARY KEY,
    expires BIGINT UNSIGNED NOT NULL,
    data MEDIUMTEXT NOT NULL,
    INDEX idx_web_sessions_expires (expires)
) ENGINE=InnoDB;
