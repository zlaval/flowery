CREATE TABLE diagrams (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    structure JSON NOT NULL
);
