DROP TABLE reviews;

CREATE TABLE reviews (
    id INTEGER PRIMARY KEY,
    filmId INTEGER NOT NULL,
    completed BOOLEAN NOT NULL,
    reviewDate DATE,
    rating INTEGER CHECK (rating BETWEEN 1 AND 10),
    review TEXT,
    type TEXT NOT NULL CHECK (type IN ('single', 'coop')),
    CONSTRAINT FK_FILM_ID FOREIGN KEY(filmId) REFERENCES films(id)
);

CREATE TABLE drafts (
    id INTEGER PRIMARY KEY,
    reviewId INTEGER NOT NULL,
    userId INTEGER NOT NULL,
    rating INTEGER CHECK (rating BETWEEN 1 AND 10),
    review TEXT,
    status BOOLEAN NOT NULL,
    CONSTRAINT FK_REVIEW_ID FOREIGN KEY(reviewId) REFERENCES reviews(id),
    CONSTRAINT FK_USER_ID FOREIGN KEY(userId) REFERENCES users(id)
);

CREATE TABLE reviewers (
    reviewId INTEGER NOT NULL,
    userId INTEGER NOT NULL,
    PRIMARY KEY (reviewId, userId),
    CONSTRAINT FK_REVIEW_ID FOREIGN KEY(reviewId) REFERENCES reviews(id),
    CONSTRAINT FK_USER_ID FOREIGN KEY(userId) REFERENCES users(id)
);

CREATE TABLE votes (
    draftId INTEGER NOT NULL,
    userId INTEGER NOT NULL,
    vote BOOLEAN NOT NULL,
    reason TEXT,
    PRIMARY KEY (draftId, userId),
    CONSTRAINT FK_DRAFT_ID FOREIGN KEY(draftId) REFERENCES drafts(id),
    CONSTRAINT FK_USER_ID FOREIGN KEY(userId) REFERENCES users(id)
);

