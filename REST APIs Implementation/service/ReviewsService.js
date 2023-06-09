'use strict';

const Review = require('../components/review');
const User = require('../components/user');
var usersService = require('./UsersService');
const db = require('../components/db');
var constants = require('../utils/constants.js');
let uf = require('./UtilFunctions');
let draftsService = require('./DraftsService')

/**
 * Retrieve the reviews of the film with ID filmId
 * 
 * Input: 
 * - req: the request of the user
 * Output:
 * - list of the reviews
 * 
 **/
 exports.getFilmReviews = function(req) {
  return new Promise((resolve, reject) => {
      var sql = "SELECT R.filmId AS filmId, R.id AS reviewId, completed, reviewDate, rating, review, type, c.total_rows FROM reviews R, (SELECT count(*) total_rows FROM reviews L WHERE L.filmId = ? ) C WHERE  R.filmId = ? ";
      var params = getPagination(req);
      if (params.length != 2) sql = sql + " LIMIT ?,?";
      db.all(sql, params, (err, rows) => {
          if (err) {
                reject(uf.getResponseMessage("500"));
          } else {
                let complete_reviews = []
                let promises = [];
                for(const review of rows){
                    promises.push(getFilmReviewers(review.reviewId).then((reviewers) => {
                        let complete_review = createReview(review, reviewers);
                        complete_reviews.push(complete_review);
                    }));
                }

                

                Promise.all(promises).then(() => {
                    let response = uf.getResponseMessage("200");
                    response[0]["payload"] = complete_reviews;

                    resolve(response)
                });
          }
      });
  });
}

const getFilmReviewers = function(reviewId){
    return new Promise((resolve, reject) => {
        const sql = "SELECT userId FROM reviewers WHERE reviewId = ?";

        db.all(sql, [reviewId], (err, rows) => {
            if(err){
                reject(err);
            }
            else{    
                resolve(rows)
            }
        });
    });
}

/**
 * Retrieve the number of reviews of the film with ID filmId
 * 
 * Input: 
* - filmId: the ID of the film whose reviews need to be retrieved
 * Output:
 * - total number of reviews of the film with ID filmId
 * 
 **/
 exports.getFilmReviewsTotal = function(filmId) {
  return new Promise((resolve, reject) => {
      var sqlNumOfReviews = "SELECT count(*) total FROM reviews WHERE filmId = ? ";
      db.get(sqlNumOfReviews, [filmId], (err, size) => {
          if (err) {
              reject(err);
          } else {
              resolve(size.total);
          }
      });
  });
}



/**
 * Retrieve the review of the film having filmId as ID and issued to user with reviewerId as ID
 *
 * Input: 
 * - filmId: the ID of the film whose review needs to be retrieved
 * - reviewerId: the ID ot the reviewer
 * Output:
 * - the requested review
 * 
 **/
 exports.getSingleReview = function(filmId, reviewId) {
    //Incompleted reviews cant be get, they can be seen by reviewers through /invited api
  return new Promise((resolve, reject) => {
      const sql = "SELECT filmId, id AS reviewId, completed, reviewDate, rating, review, type FROM reviews WHERE reviewId = ? AND filmId = ?";

      db.all(sql, [reviewId, filmId], (err, rows) => {
          if (err)
              reject(uf.getResponseMessage("500"));
          else if (rows.length === 0)
              reject(uf.getResponseMessage("404"));
          else {
              getFilmReviewers(reviewId).then((reviewers) => {
                let complete_review = createReview(rows[0], reviewers);
                let response = uf.getResponseMessage("200");
                response[0]["payload"] = complete_review;

                resolve(response)
              });
          }
      });
  });
}


/**
 * Delete a review invitation
 *
 * Input: 
 * - filmId: ID of the film
 * - reviewerId: ID of the reviewer
 * - owner : ID of user who wants to remove the review
 * Output:
 * - no response expected for this operation
 * 
 **/
 exports.deleteSingleReview = function(filmId, reviewId, userId) {
  return new Promise(async (resolve, reject) => {
    try{
        await uf.beginTransaction()
        
        let result = await exports.deleteReviewers(reviewId);
        await draftsService.deleteDraftsAndVotesOfReview(reviewId);

        if(result){
            const sql1 = "SELECT F.owner AS owner, R.completed AS completed FROM films F, reviews R WHERE F.id = R.filmId AND F.id = ? AND R.id = ?";
            db.all(sql1, [filmId, reviewId], (err, rows) => {
                if (err){
                    reject(uf.getResponseMessage("500"));
                    uf.abortTransaction();
                }
                else if (rows.length === 0){
                    reject(uf.getResponseMessage("404"));
                    uf.abortTransaction();
                }
                else if(userId != rows[0].owner) {
                    reject(uf.getResponseMessage("403a"));
                    uf.abortTransaction();
                }
                else if(rows[0].completed == 1) {
                    reject(uf.getResponseMessage("403b"));
                    uf.abortTransaction();
                }
                else {
                    const sql2 = 'DELETE FROM reviews WHERE filmId = ? AND id = ?';
                    db.run(sql2, [filmId, reviewId], async (err) => {
                        if (err){
                            reject(uf.getResponseMessage("500"));
                            uf.abortTransaction();
                        }
                        else
                            resolve(uf.getResponseMessage("204"));
                            await uf.endTransaction();
                    })
                }
            });
        }
    }
    catch(err){
        try{
            console.log("ca", err);
            await uf.abortTransaction();
            reject(uf.getResponseMessage("500"));
        }
        catch(err){
            console.log("tch", err)
            reject(uf.getResponseMessage("500"));
        }
    }
  });

}

exports.deleteReviewers = function(reviewId){
    return new Promise((resolve, reject) => {
        const sql = "DELETE FROM reviewers WHERE reviewId = ?";
        db.run(sql, [reviewId], (err) => {
            if(err){
                reject(err);
            }
            else {
                resolve(true);
            }
        })
    })
}



/**
 * Issue a film review to a user
 *
 *
 * Input: 
 * - reviewerId : ID of the film reviewer
 * - filmId: ID of the film 
 * - owner: ID of the user who wants to issue the review
 * Output:
 * - no response expected for this operation
 * 
 **/
 exports.issueFilmReview = function(body, filmId, owner) {
  return new Promise((resolve, reject) => {
    try{
        const reviewers = body.reviewers;
        const review_type = body.review_type;

        // if(checkOwnerReviewerConstraints(owner, reviewers, body.review_type)){
        //     reject(uf.getResponseMessage("409m"));
        //     return;
        // }

        const sql1 = "SELECT owner, private FROM films WHERE id = ?";
        db.all(sql1, [filmId], (err, rows) => {
            if (err){
                    reject(uf.getResponseMessage("500"));
            }
            else if (rows.length === 0){
                reject(uf.getResponseMessage("404"));
            }
            else if(owner != rows[0].owner) {
                reject(uf.getResponseMessage("403a"));
            } else if(rows[0].private == 1) {
                reject(uf.getResponseMessage("404"));
            }
            else {
                checkReviewersExistance(reviewers).then((reviewersExist) => {
                    if(reviewersExist){
                        if (review_type === "coop" && reviewers.length > 1){
                            let reviewId;
        
                            uf.beginTransaction().then(() => {
                                issueCooperativeReview(filmId, reviewers).then((result) => {
                                    reviewId = result;
                                    uf.endTransaction().then(() => {
                                        let nullParams = [undefined, undefined, undefined];
                                        let createdReview = new Review(filmId, reviewId, reviewers, false, ...nullParams, "coop");
                                        let response = uf.getResponseMessage("201");
                                        response[0]["payload"] = createdReview;

                                        resolve(response);
                                    }).catch(async () => {
                                        await uf.abortTransaction();
                                        reject(uf.getResponseMessage("500"));
                                    })
                                }).catch(async () => {
                                    await uf.abortTransaction();
                                    reject(uf.getResponseMessage("409c"));
                                })
                            }).catch(() => {
                                reject(uf.getResponseMessage("500"));
                            })
                            
                        }
                        else{
                            //single review, check if user is already reviewing this film
                            let alreadyIssued = [];
                            let toBeIssued = [];
                            let createdReviews = [];
        
                            //Evaluating if some user has already been invited to review this film
                            const promises = [];
                            for(const id of reviewers){
                                promises.push(checkSingleUserReviewing(id, filmId).then((result) => {
                                    if(result){
                                        toBeIssued.push(id);
                                    }
                                    else{
                                        alreadyIssued.push(id);
                                    }
                                }).catch((err) => {
                                    reject(uf.getResponseMessage("500"));
                                }))
                            }
        
                            Promise.all(promises).then(async () => {
                                //add entry in reviewers for each toBeIssued
                                if(toBeIssued.length > 0){
                                    for(const userId of toBeIssued){
                                        try {
                                            await uf.beginTransaction();

                                            const result = await issueSingleReview(filmId);
                                            const reviewId = result;

                                            await addReviewerToReview(reviewId, userId);
                                            
                                            let nullParams = [undefined, undefined, undefined];
                                            createdReviews.push(new Review(filmId, reviewId, [userId], false, ...nullParams, "single"));
                                            await uf.endTransaction();
                                        } catch (err) {
                                            await uf.abortTransaction();
                                            reject(uf.getResponseMessage("500"));
                                        } 
                                    }

                                    let response = uf.getResponseMessage("201");
                                    response[0]["payload"] = createdReviews;
                                    resolve(response);
                                }
                                else{
                                    reject(uf.getResponseMessage("409d"));
                                }
                            })
                        }
                    }
                    else{
                        reject(uf.getResponseMessage("409e"))
                    }
                });    
            }
        });
    } catch(err){
        reject(uf.getResponseMessage("500"));
    }
  });
}

exports.getReviewIdsByFilm = function(filmId){
    return new Promise((resolve, reject) => {
        const sql = "SELECT id FROM reviews WHERE filmId = ?";
        
        db.all(sql, [filmId], (err, rows) => {
            if(err){
                reject(err);
            }
            else{
                resolve(rows);
            }
        })
    })
}



// const checkOwnerReviewerConstraints = function(owner, reviewers, type){
//     // modify
//     if(type === "single"){
//         //owner must not be included among single reviewers
//         return reviewers.indexOf(owner) !== -1 ? true : false;
//     }
//     else{
//         //owner must not be the only cooperative reviewer
//         return (reviewers.length === 1) && (reviewers[0] === owner);
//     }
    
// }

//Checks if a user that was invited to "single review" a film, was already invited to review that film
const checkSingleUserReviewing = function(userId, filmId){
    return new Promise((resolve, reject) => {
        const sql = "SELECT R.id FROM reviews R, reviewers RW WHERE R.filmId = ? AND RW.userId = ? AND R.type = 'single' AND R.id = RW.reviewId";
        db.get(sql, [filmId, userId], (err, rows) => {
            if (err){
              reject(err);
            }
            else if (rows !== undefined){
                // User already associated with single review of this film
                console.log("false");
                resolve(false);
            }
            else{
                resolve(true);
            }
        })
    })
}


//Add entries in reviewers table
const addReviewerToReview = function(reviewId, userId){
    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO reviewers(reviewId, userId) VALUES(?,?);`;

        db.run(sql, [reviewId, userId], (err) => {
            if(err){
                console.log(err);
                reject('500');
            }
            else{
                resolve(true);
            }
        });
    }) 
}

// Issue single review
// It is checked that any of the users specified as reviewers have been already assigned a review for the given film
// If at least one of them was already been assigned, the review invitation will only be sent to the others
// If all of them were already invited, no review invitation is sent
const issueSingleReview = function(filmId){
    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO reviews(filmId, completed, type) VALUES(?,?,?);`;
        db.run(sql, [filmId, false, 'single'], function(err) {
            if (err) {
                reject('500');
            } 
            else {
                db.get("SELECT last_insert_rowid() as lastID", (err, row) => {
                    if(err){
                        console.log(err);
                        reject(err);
                    }
                    else{
                        const lastReviewId = row.lastID;
                        resolve(lastReviewId);
                    }
                });
            }
        });
    });
}



const issueCooperativeReview = function(filmId, reviewers){
    return new Promise(async (resolve, reject) => {
        const sql = `INSERT INTO reviews(filmId, completed, type) VALUES(?,?,?);`;

        try{
            db.run(sql, [filmId, false, 'coop'], async (err) => {
                if(err){
                    reject('500');
                }
                else{
                    db.get("SELECT last_insert_rowid() as lastID", async (err, row) => {
                        if(err){
                            reject(err);
                        }
                        else{
                            const lastReviewId = row.lastID;
                            const sql_reviewers = `INSERT INTO reviewers(reviewId, userId) VALUES(?,?);`;

                            for(const reviewer of reviewers){
                                db.run(sql_reviewers, [lastReviewId, reviewer], (err) => {
                                    if(err){
                                        reject(err);
                                    }
                                });
                            }

                            resolve(lastReviewId);
                        }
                    });
                }
            });
        } catch(err){
             reject(uf.getResponseMessage("500"));
        }
    })
}

const checkReviewersExistance = function(reviewers){
    return new Promise((resolve, reject) => {
        let promises = [];
        let flag = true;

        for(const userId of reviewers){
            promises.push(usersService.getUserById(userId).then((result) => {
                if(result === undefined){
                    flag = false;
                }
            }))
        }
        
        Promise.all(promises).then(() => {
            resolve(flag);
        });
    }) 
}



/**
 * Complete and update a review
 *
 * Input:
 * - review: review object (with only the needed properties)
 * - filmID: the ID of the film to be reviewed
 * - reviewerId: the ID of the reviewer
 * Output:
 * - no response expected for this operation
 * 
 **/
 exports.updateSingleReview = function(review, filmId, reviewId, userId) {
  return new Promise((resolve, reject) => {
    try{
        const sql1 = "SELECT * FROM reviews WHERE filmId = ? AND id = ? AND type = ?";
        db.all(sql1, [filmId, reviewId, "single"], async (err, rows) => {
            if (err)
                reject(uf.getResponseMessage("500"));
            else if (rows.length === 0)
                reject(uf.getResponseMessage("404"));
            else {
                let result = await exports.checkIfUserIsReviewer(reviewId, userId);

                if(result){
                    var sql2 = 'UPDATE reviews SET completed = ?';
                    var parameters = [review.completed];
                    if(review.reviewDate != undefined){
                        sql2 = sql2.concat(', reviewDate = ?');
                        parameters.push(review.reviewDate);
                    } 
                    if(review.rating != undefined){
                        sql2 = sql2.concat(', rating = ?');
                        parameters.push(review.rating);
                    } 
                    if(review.review != undefined){
                        sql2 = sql2.concat(', review = ?');
                        parameters.push(review.review);
                    } 
                    sql2 = sql2.concat(' WHERE filmId = ? AND id = ?');
                    parameters.push(filmId);
                    parameters.push(reviewId);

                    db.run(sql2, parameters, function(err) {
                        if (err) {
                            reject(uf.getResponseMessage("500"));
                        } else {
                            resolve(uf.getResponseMessage("204"));
                        }
                    })
                } 
                else {
                    reject(uf.getResponseMessage("403c"));
                }
            }
        });
    } catch(err){
        reject(uf.getResponseMessage("500"));
    }
  });
}


exports.checkIfUserIsReviewer = function(reviewId, userId){
    return new Promise((resolve, reject) => {
        getFilmReviewers(reviewId).then((reviewers) => {
            let found = reviewers.map((elem) => elem.userId).filter((id) => userId === id);
            found.length === 1 ? resolve(true) : resolve(false);
        })
    })
}

exports.updateReviewWithDraft = function(reviewId, draft){
    return new Promise((resolve, reject) => {
        const sql = "UPDATE reviews SET completed = ?, reviewDate = ?, review = ?, rating = ? WHERE id = ?";
        let today = new Date();
        let date = today.toISOString().slice(0, 10);
        db.run(sql, [true, date, draft.review, draft.rating, reviewId], (err) => {
            if(err){
                reject(err);
            }
            else{
                resolve(true);
            }
        })
    })
}

/**
 * Utility functions
 */
 const getPagination = function(req) {
  var pageNo = parseInt(req.query.pageNo);
  var size = parseInt(constants.OFFSET);
  var limits = [];
  limits.push(req.params.filmId);
  limits.push(req.params.filmId);
  if (req.query.pageNo == null) {
      pageNo = 1;
  }
  limits.push(size * (pageNo - 1));
  limits.push(size);
  return limits;
}


const createReview = function(review, reviewers) {
  var completedReview = (review.completed === 1) ? true : false;
  let reviewers_uri = []

  for(const reviewer of reviewers){
    reviewers_uri.push({"userId": "/api/users/"+reviewer.userId});
  }

  return new Review(review.filmId, review.reviewId, reviewers_uri, completedReview, review.reviewDate, review.rating, review.review, review.type);
}