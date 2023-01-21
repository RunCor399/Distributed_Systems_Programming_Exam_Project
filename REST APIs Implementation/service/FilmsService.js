'use strict';

const Film = require('../components/film');
const db = require('../components/db');
var constants = require('../utils/constants.js');
const uf = require('./UtilFunctions')

/**
 * Create a new film
 *
 * Input: 
 * - film: the film object that needs to be created
 * - owner: ID of the user who is creating the film
 * Output:
 * - the created film
 **/
 exports.createFilm = function(film, owner) {
    return new Promise((resolve, reject) => {
  
      const sql = 'INSERT INTO films(title, owner, private, watchDate, rating, favorite) VALUES(?,?,?,?,?,?)';
      db.run(sql, [film.title, owner, film.private, film.watchDate, film.rating, film.favorite], function(err) {
          if (err) {
              reject(err);
          } else {
              var createdFilm = new Film(this.lastID, film.title, owner, film.private, film.watchDate, film.rating, film.favorite);
              resolve(createdFilm);
          }
      });
  });
  }


/**
 * Retrieve the private film having film Id as ID
 *
 * Input: 
 * - filmId: the ID of the film that needs to be retrieved
 * - owner: ID of the user who is retrieving the film
 * Output:
 * - the requested film
 * 
 **/
 exports.getSinglePrivateFilm = function(filmId, owner) {
    return new Promise((resolve, reject) => {
        const sql1 = "SELECT id as fid, title, owner, private, watchDate, rating, favorite FROM films WHERE id = ?";
        db.all(sql1, [filmId], (err, rows) => {
            if (err)
                reject(err);
            else if (rows.length === 0)
                reject(404);
            else if (rows[0].private == 0)    
                reject(404);
            else if (rows[0].owner == owner){
                var film = createFilm(rows[0]);
                resolve(film);
            }
            else
                reject(403);
        });
    });
  }


/**
 * Update a private film
 *
 * Input:
 * - film: new film object
 * - filmID: the ID of the film to be updated
 * - owner: the ID of the user who wants to update the film
 * Output:
 * - no response expected for this operation
 * 
 **/
 exports.updateSinglePrivateFilm = function(film, filmId, owner) {
    return new Promise((resolve, reject) => {
  
        const sql1 = "SELECT owner, private FROM films f WHERE f.id = ?";
        db.all(sql1, [filmId], (err, rows) => {
            if (err)
                reject(err);
            else if (rows.length === 0)
                reject(404);
            else if (rows[0].private == 0)
                reject(409)
            else if(owner != rows[0].owner) {
                reject(403);
            }
            else {

              var sql3 = 'UPDATE films SET title = ?';
              var parameters = [film.title];
              sql3 = sql3.concat(', private = ?');
              parameters.push(film.private);
              if(film.watchDate != undefined){
                sql3 = sql3.concat(', watchDate = ?');
                parameters.push(film.watchDate);
              } 
              if(film.rating != undefined){
                  sql3 = sql3.concat(', rating = ?');
                  parameters.push(film.rating);
              } 
              if(film.favorite != undefined){
                  sql3 = sql3.concat(', favorite = ?');
                  parameters.push(film.favorite);
              } 
              sql3 = sql3.concat(' WHERE id = ?');
              parameters.push(filmId);
  
              db.run(sql3, parameters, function(err) {
                if (err) {
                reject(err);
                } else {
                resolve(null);
              }
             })
            }
        });
    });
  }
  
  
/**
 * Delete a private film having filmId as ID
 *
 * Input: 
 * - filmId: the ID of the film that needs to be deleted
 * - owner: ID of the user who is deleting the film
 * Output:
 * - no response expected for this operation
 **/
 exports.deleteSinglePrivateFilm = function(filmId, owner) {
    return new Promise((resolve, reject) => {
        const sql1 = "SELECT owner FROM films f WHERE f.id = ? AND f.private = 1";
        db.all(sql1, [filmId], (err, rows) => {
            if (err)
                reject(err);
            else if (rows.length === 0)
                reject(404);
            else if(owner != rows[0].owner) {
                reject(403);
            }
            else {
                const sql3 = 'DELETE FROM films WHERE id = ?';
                db.run(sql3, [filmId], (err) => {
                    if (err)
                         reject(err);
                     else
                        resolve(null);
                })
            }
        });
    });
  }
  

/**
 * Retrieve the public film having film Id as ID
 *
 * Input: 
 * - filmId: the ID of the public film that needs to be retrieved
 * Output:
 * - the requested public film
 * 
 **/
 exports.getSinglePublicFilm = function(filmId) {
    return new Promise((resolve, reject) => {
        const sql = "SELECT id as fid, title, owner, private, watchDate, rating, favorite FROM films WHERE id = ?";
        db.all(sql, [filmId], (err, rows) => {
            if (err)
                reject(err);
            else if (rows.length === 0)
                reject(404);
            else if (rows[0].private == 1)
                reject(404);
            else {
                var film = createFilm(rows[0]);
                resolve(film);
            }
        });
    });
  }
  

/**
 * Update a public film
 *
 * Input:
 * - film: new film object
 * - filmID: the ID of the film to be updated
 * - owner: the ID of the user who wants to update the film
 * Output:
 * - no response expected for this operation
 * 
 **/
 exports.updateSinglePublicFilm = function(film, filmId, owner) {
    return new Promise((resolve, reject) => {
  
        const sql1 = "SELECT owner, private FROM films f WHERE f.id = ?";
        db.all(sql1, [filmId], (err, rows) => {
            if (err)
                reject(err);
            else if (rows.length === 0)
                reject(404);
            else if (rows[0].private == 1)
                reject(409);
            else if(owner != rows[0].owner) {
                reject(403);
            }
            else {
              var sql3 = 'UPDATE films SET title = ?';
              var parameters = [film.title];
              sql3 = sql3.concat(', private = ?');
              parameters.push(film.private);
              sql3 = sql3.concat(' WHERE id = ?');
              parameters.push(filmId);
  
              db.run(sql3, parameters, function(err) {
                if (err) {
                reject(err);
                } else {
                resolve(null);
              }
             })
            }
        });
    });
  }
  


/**
 * Delete a public film having filmId as ID
 *
 * Input: 
 * - filmId: the ID of the film that needs to be deleted
 * - owner: ID of the user who is deleting the film
 * Output:
 * - no response expected for this operation
 **/
 exports.deleteSinglePublicFilm = function(filmId, owner) {
  return new Promise((resolve, reject) => {
      const sql1 = "SELECT owner FROM films f WHERE f.id = ?";
      db.all(sql1, [filmId], (err, rows) => {
          if (err)
              reject(err);
          else if (rows.length === 0)
              reject(404);
          else if(rows[0].private == 1)
            reject(404);
          else if(owner != rows[0].owner) {
              reject(403);
          }
          else {
              const sql2 = 'DELETE FROM reviews WHERE filmId = ?';
              db.run(sql2, [filmId], (err) => {
                  if (err)
                      reject(err);
                  else {
                      const sql3 = 'DELETE FROM films WHERE id = ?';
                      db.run(sql3, [filmId], (err) => {
                          if (err)
                              reject(err);
                          else
                              resolve(null);
                      })
                  }
              })
          }
      });
  });
}



/**
 * Retrieve the public films
 * 
 * Input: 
 * - req: the request of the user
 * Output:
 * - list of the public films
 * 
 **/
 exports.getPublicFilms = function(req) {
  return new Promise((resolve, reject) => {

    var sql = "SELECT f.id as fid, f.title, f.owner, f.private, f.watchDate, f.rating, f.favorite, c.total_rows FROM films f, (SELECT count(*) total_rows FROM films l WHERE l.private=0) c WHERE  f.private = 0 "
    var limits = getPagination(req);
    if (limits.length != 0) sql = sql + " LIMIT ?,?";

    db.all(sql, limits, (err, rows) => {
        if (err) {
            reject(err);
        } else {
            let films = rows.map((row) => createFilm(row));
            resolve(films);
        }
    });
  });
}

/**
 * Retrieve the public films for which the user has received a review invitation
 * 
 * Input: 
 * - req: the request of the user
 * Output:
 * - list of the public films for which the user has received a review invitation
 * 
 **/
 exports.getInvitedFilms = function(req) {
    return new Promise((resolve, reject) => {
      var sql = "SELECT F.id as id, F.title AS title, F.owner, F.private, F.watchDate, F.rating, F.favorite, C.total_rows FROM films F, reviews R, (SELECT COUNT(*) total_rows FROM films F2, reviews R2, reviewers RW2 WHERE F2.private=0 AND R2.completed = ? AND F2.id = R2.filmId AND R2.id = RW2.reviewId AND RW2.userId = ?) C, reviewers RW WHERE F.private = 0 AND R.completed = ? AND F.id = R.filmId AND R.id = RW.reviewId AND RW.userId = ?"
      var limits = getPagination(req);
      if (limits.length != 0) sql = sql + " LIMIT ?,?";
      limits.unshift(req.user.id);
      limits.unshift(false);
      limits.unshift(req.user.id);
      limits.unshift(false);
  
      db.all(sql, limits, (err, rows) => {
          if (err) {
              reject(err);
          } else {
              let films = rows.map((row) => createFilm(row));
              resolve(films);
          }
      });
    });
  }

/**
 * Retrieve the private films of an user with ID userId
 * 
 * Input: 
 * - req: the request of the user
 * Output:
 * - list of the public films
 * 
 **/
 exports.getPrivateFilms = function(req) {
    return new Promise((resolve, reject) => {
        var sql = "SELECT f.id as fid, f.title, f.owner, f.private, f.watchDate, f.rating, f.favorite, c.total_rows FROM films f, (SELECT count(*) total_rows FROM films l WHERE l.private=1 AND owner = ?) c WHERE  f.private = 1 AND owner = ?"
        var limits = getPagination(req);
        if (limits.length != 0) sql = sql + " LIMIT ?,?";
        var parameters = [req.user.id, req.user.id];
        parameters = parameters.concat(limits);
        db.all(sql, parameters, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                let films = rows.map((row) => createFilm(row));
                resolve(films);
            }
        });
    });
  }

/**
 * Retrieve the number of public films 
 * 
 * Input: 
 * - none
 * Output:
 * - total number of public films
 * 
 **/
 exports.getPublicFilmsTotal = function() {
  return new Promise((resolve, reject) => {
      var sqlNumOfFilms = "SELECT count(*) total FROM films f WHERE private = 0 ";
      db.get(sqlNumOfFilms, [], (err, size) => {
          if (err) {
              reject(err);
          } else {
              resolve(size.total);
          }
      });
  });
}

/**
 * Retrieve the number of public films for which the user has received a review invitation
 * 
 * Input: 
 * - none
 * Output:
 * - total number of public films for which the user has received a review invitation
 * 
 **/
 exports.getInvitedFilmsTotal = function(userId) {
    return new Promise((resolve, reject) => {
        var sqlNumOfFilms = "SELECT count(*) total FROM films F, reviews R, reviewers RW WHERE  F.private = 0 AND F.id = R.filmId AND R.id = RW.reviewId AND RW.userId = ?";
        db.get(sqlNumOfFilms, [userId], (err, size) => {
            if (err) {
                reject(err);
            } else {
                resolve(size.total);
            }
        });
    });
  }

/**
 * Retrieve the number of private films of an user with ID userId
 * 
 * Input: 
 * - owner: the userId
 * Output:
 * - total number of public films
 * 
 **/
 exports.getPrivateFilmsTotal = function(userId) {
    return new Promise((resolve, reject) => {
        var sqlNumOfFilms = "SELECT count(*) total FROM films f WHERE private = 1 AND owner = ? ";
        db.get(sqlNumOfFilms, [userId], (err, size) => {
            if (err) {
                reject(err);
            } else {
                resolve(size.total);
            }
        });
    });
  }




/**
 * Utility functions
 */
 const getPagination = function(req) {
  var pageNo = parseInt(req.query.pageNo);
  var size = parseInt(constants.OFFSET);
  var limits = [];
  if (req.query.pageNo == null) {
      pageNo = 1;
  }
  limits.push(size * (pageNo - 1));
  limits.push(size);
  return limits;
}

const createFilm = function(row) {
  var privateFilm = (row.private === 1) ? true : false;
  var favoriteFilm;
  if(row.favorite == null) favoriteFilm = undefined;
  else favoriteFilm = (row.favorite === 1) ? true : false;
  return new Film(row.id, row.title, row.owner, privateFilm, row.watchDate, row.rating, favoriteFilm);
}




