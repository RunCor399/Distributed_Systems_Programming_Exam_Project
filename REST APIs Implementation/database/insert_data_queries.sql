INSERT INTO films (title, owner, private, watchDate, rating, favorite) VALUES
('The Shawshank Redemption', 1, 0, '2022-01-01', 9, 1),
('The Godfather', 2, 0, NULL, NULL, NULL),
('The Godfather: Part II', 3, 0, '2022-03-01', 9, 1),
('The Dark Knight', 4, 1, '2022-04-01', 8, 0),
('12 Angry Men', 5, 0, NULL, NULL, NULL),
('Schindler''s List', 6, 0, '2022-06-01', 8, 1),
('The Lord of the Rings: The Return of the King', 3, 0, '2022-07-01', 9, 1),
('Pulp Fiction', 2, 0, NULL, NULL, NULL),
('The Good, the Bad and the Ugly', 1, 1, '2022-09-01', 8, 1),
('Fight Club', 2, 0, '2022-10-01', 9, 0),
('Forrest Gump', 3, 1, '2022-11-01', 8, 1),
('Inception', 4, 0, NULL, 9, 0),
('The Lord of the Rings: The Fellowship of the Ring', 5, 0, '2022-12-01', 9, 1),
('Star Wars: Episode V - The Empire Strikes Back', 6, 1, '2022-12-01', 9, 0),
('The Matrix', 1, 0, '2023-01-01', 8, 1),
('Goodfellas', 2, 0, NULL, NULL, NULL),
('One Flew Over the Cuckoo''s Nest', 3, 1, '2023-02-01', 8, 0);


INSERT INTO reviews (filmId, completed, reviewDate, rating, review, type) VALUES
(1, 1, '2022-01-15', 9, 'I loved this movie, it was so emotional', 'single'),
(2, 0, NULL, NULL, NULL, 'coop'),
(3, 1, '2022-03-01', 9, 'The Godfather Part II is even better than the original', 'coop'),
(5, 1, '2022-05-01', 8, '12 Angry Men was an intense and thought-provoking film', 'coop'),
(6, 0, NULL, NULL, NULL, 'single'),
(7, 1, '2022-07-01', 9, 'The Lord of the Rings: The Return of the King was a fitting end to the trilogy', 'coop'),
(8, 0, '2022-08-01', 8, 'Pulp Fiction is a cult classic', 'single'),
(10, 1, '2022-10-01', 9, 'Fight Club is a mind-bending film', 'coop'),
(11, 0, '2022-11-01', 8, 'Forrest Gump was a heartwarming film', 'single'),
(12, 1, '2022-12-01', 9, 'Inception was a mind-bending film', 'coop'),
(13, 0, NULL, NULL, NULL, 'coop');

