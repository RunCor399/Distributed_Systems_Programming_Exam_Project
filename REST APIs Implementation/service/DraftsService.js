'use strict';

const Draft = require('../components/draft');
let reviewsService = require('./ReviewsService');
let uf = require('./UtilFunctions');
const db = require('../components/db');
let constants = require('../utils/constants.js');

exports.getTotalDrafts = function(filmId, reviewId){
    return new Promise((resolve, reject) => {
        var sqlNumOfFilms = "SELECT count(*) total FROM drafts D, reviews R, films F WHERE D.reviewId = R.id AND R.filmId = F.id AND F.id = ? AND R.id = ?";
        db.get(sqlNumOfFilms, [filmId, reviewId], (err, size) => {
            if (err) {
                reject(err);
            } else {
                resolve(size.total);
            }
        });
    });
}

exports.getDrafts = function(req){
    return new Promise(async (resolve, reject) => {
        let filmId = req.params.filmId;
        let reviewId = req.params.reviewId;
        let userId = req.user.id;

        let check1 = await uf.filmExists(filmId);
        let check2 = await uf.reviewExist(reviewId);
        let check3 = await checkPermissions(reviewId, userId);

        if(check1 && check2 && check3){
            //can return drafts

            let sql = `SELECT id AS draftId, reviewId AS reviewId, userId AS author, rating, review, status
                       FROM drafts`;

            let params = getPagination(req)
            if (params.length == 2) sql = sql + " LIMIT ?,?";

            db.all(sql, params, async (err, rows) => {
                if(err){
                    console.log(err);
                    reject(err);
                }
                else{
                    console.log(rows);
                    let complete_drafts = [];

                    for(const draft of rows){
                        let votes = await getVotesOfDraft(draft.draftId);
                        console.log(votes);
                        let complete_draft = createDraft(filmId, draft, votes);
                        complete_drafts.push(complete_draft);
                    }

                    console.log(complete_drafts);
                    resolve(complete_drafts);
                }
            })
        }
    });
}

exports.getSingleDraft = function(filmId, reviewId, userId, draftId){
    return new Promise(async (resolve, reject) => {
        let check1 = await checkPermissions(reviewId, userId);
        let check2 = await uf.reviewExist(reviewId);
        //let check3 = await checkPermissions(reviewId, userId);

        if(check1 && check2){
            let sql = `SELECT id AS draftId, reviewId AS reviewId, userId AS author, rating, review, status
                       FROM drafts WHERE id = ?`;

            db.get(sql, [draftId], async (err, draft) => {
                if(err){
                    console.log(err);
                    reject(err);
                }
                else{
                    console.log(draft);
                    if(draft !== undefined){
                        let votes = await getVotesOfDraft(draftId);
                        let complete_draft = createDraft(filmId, draft, votes);
                    
                        console.log(complete_draft);
                        resolve(complete_draft);
                    }
                    else{
                        reject(404);
                    }
                    
                }
            })      
        }
    });
}

exports.createDraft = function(filmId, reviewId, userId, draft){
    return new Promise(async (resolve, reject) => {
        let check1 = await uf.filmExists(filmId);
        let check2 = await uf.reviewExist(reviewId);
        let check3 = await checkPermissions(reviewId, userId);
        let check4 = await checkReviewIsCooperative(reviewId);
        let check5 = await checkDraftAlreadyOpen(reviewId);

        if(check1 && check2 && check3 && check4 && check5){
            const sql = "INSERT INTO drafts(reviewId, userId, rating, review, status) VALUES(?,?,?,?,?)";
                
            db.run(sql, [reviewId, userId, draft.rating, draft.review, 1], async (err) => {
                if(err){
                    reject(err);
                }
                else{
                    let lastID = await uf.getLastInsertId();
                    let voteInsertResult = await insertVote(lastID, userId, {"vote": true})

                    if(voteInsertResult){
                        let implicitVote = {"userId": userId, "vote": true};
                        let createdDraft = new Draft(lastID, filmId, reviewId, [implicitVote], draft.rating, draft.review, 'open', userId);

                        resolve(createdDraft);
                    }
                    else{
                        reject(err);
                    }
                }
            })

        //Find a way to isolate and generalize this kind of errors
        }
        else if(!check1){
            reject("this film doesn't exist");
        }
        else if(!check2){
            reject("this review doesn't exist");
        }
        else if(!check3){
            reject("no permissions")
        }
        else if(!check4){
            reject("review isn't cooperative or is already completed")
        }
        else if(!check5){
            reject("there is a draft already open");
        }
    });
}

exports.voteDraft = function voteDraft(req, res, next){
    //check film, review, draft existance
    //check draft open
    //check user is reviewer
    //check user first vote
    //insert VOTE
    //call evaluate function

    return new Promise(async (resolve, reject) => {
        let userId = req.user.id;
        let filmId = req.params.filmId;
        let reviewId = req.params.reviewId;
        let draftId = req.params.draftId;

        let check1 = await uf.filmExists(filmId);
        let check2 = await uf.reviewExist(reviewId);
        let check3 = await uf.draftExistAndOpen(draftId);
        let check4 = await reviewsService.checkIfUserIsReviewer(reviewId, userId);
        let check5 = await checkSingleVote(draftId, userId);

        if(check1 && check2 && check3 && check4 && check5){
            let reason;
            let vote = req.body.vote;

            vote === false ? reason = req.params.reason : null;
 
            let result = await insertVote(draftId, userId, {"vote": vote, "reason": reason});

            if(result){
                let evaluateResult = await evaluateVoteAction(draftId, reviewId, userId);

                if(evaluateResult){
                    resolve(null);
                }
                else{
                    reject(evaluateResult)
                }
            }
            else{
                //vote insertion error
                reject(result);
            }
        }
        else{
            console.log(check1, check2, check3, check4, check5);
            reject("check error");
        }
    })
}


const checkPermissions = function(reviewId, userId){
    return new Promise(async (resolve, reject) => {
        let result = await reviewsService.checkIfUserIsReviewer(reviewId, userId);

        resolve(result);
    })
}

const checkDraftAlreadyOpen = function(reviewId){
    return new Promise((resolve, reject) => {
        const sql = "SELECT id FROM drafts WHERE reviewId = ? AND status = 1"

        db.get(sql, [reviewId], (err, rows) => {
            if(err){
                reject(err);
            }
            else{
                rows === undefined ? resolve(true) : resolve(false);
            }
        })
    });
}

const checkReviewIsCooperative = function(reviewId){
    return new Promise((resolve, reject) => {
        const sql = "SELECT id FROM reviews WHERE id = ? AND type = ? AND completed = ?";

        db.get(sql, [reviewId, 'coop', false], (err, rows) => {
            if(err){
                reject(err);
            }
            else{
                rows !== undefined ? resolve(true) : resolve(false);
            }
        })
    })
}

const getVotesOfDraft = function(draftId){
    return new Promise((resolve,reject) => {
        const sql = "SELECT userId, vote, reason FROM votes WHERE draftId = ?";

        db.all(sql, [draftId], (err, votes) => {
            if(err){
                reject(err);
            }
            else{
                votes === undefined ? resolve([]) : resolve(votes);
            }
        })
    })
}

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

const createDraft = function(filmId, draft, votes) {
    var status = (draft.status === 1) ? "open" : "closed";
    let votes_uri = [];

    for(const vote of votes){
        votes_uri.push(vote.reason !== null ? {"userId": "/api/users/"+vote.userId, "vote": vote.vote, "reason": vote.reason} : {"userId": "/api/users/"+vote.userId, "vote": vote.vote});
    }

    return new Draft(draft.draftId, filmId, draft.reviewId, votes_uri, draft.rating, draft.review, status, draft.author);
}


const checkSingleVote = function(draftId, userId){
    return new Promise((resolve, reject) => {
        const sql = "SELECT V.draftId FROM drafts D, votes V WHERE V.draftId = ? AND V.userId = ? AND V.draftId = D.id AND D.status = ?";

        db.get(sql, [draftId, userId, true], (err, rows) => {
            if(err){
                reject(err);
            }
            else{
                rows === undefined ? resolve(true) : resolve(false);
            }
        });
    });
}

const evaluateVoteAction = function(draftId, reviewId, userId){
    // compare reviewers_count and votes_count
    // If EQUAL
        // If All Agree
            // Close Draft
            // Update Review with data from draft
        // If at least one disagree
            //Close draft

    // If BELOW
        //nothing

    return new Promise(async (resolve, reject) => {
        let reviewers_count = await uf.getReviewersCount(reviewId);
        let voters_count = await uf.getNumVotesOfDraft(draftId);

        if(reviewers_count === voters_count){
            let agree_count = await getAgreeVotes(draftId);

            if(agree_count === voters_count){
                //all agree
                let closeDraftResult = await closeDraft(draftId);

                if(closeDraftResult){
                    let draft = await getDraftData(draftId);

                    if(draft === undefined){
                        reject("draft empty");
                    }
                    else{
                        let updateReviewResult = await reviewsService.updateReviewWithDraft(reviewId, draft);

                        if(updateReviewResult){
                            resolve(true);
                        }
                        else{
                            reject("review update failed");
                        }
                    }
                }
                else{
                    reject("err closing draft");
                }
            }
            else{
                //close draft
                let closeDraftResult = await closeDraft(draftId);

                if(closeDraftResult){
                    resolve(true);
                }
                else{
                    reject("err closing draft");
                }
            }
        }
        else{
            //no action

            resolve(true);
        }
    })
}

const closeDraft = function(draftId){
    return new Promise((resolve, reject) => {
        const sql = "UPDATE drafts SET status = ? WHERE id = ?";

        db.run(sql, [false, draftId], (err) => {
            if(err){
                reject(err);
            }
            else{
                resolve(true);
            }
        })
    });
}

const getDraftData = function(draftId){
    return new Promise((resolve, reject) => {
        const sql = "SELECT rating, review FROM drafts WHERE id = ?";

        db.get(sql, [draftId], (err, draft) => {
            if(err){
                reject(err);
            }
            else{
                resolve(draft);
            }
        })
    })
}

const getAgreeVotes = function(draftId){
    return new Promise((resolve, reject) => {
        const sql = "SELECT COUNT(*) AS num_agree FROM votes WHERE draftId = ? AND vote = ?"

        db.get(sql, [draftId, true], (err, rows) => {
            if(err){
                reject(err);
            }
            else{
                console.log("num agree: ", rows.num_agree);
                resolve(rows.num_agree);
            }
        })
    })
}

const insertVote = function(draftId, userId, vote){
    return new Promise((resolve, reject) => {
        const sql = "INSERT INTO votes(draftId, userId, vote, reason) VALUES(?,?,?,?)";
        console.log(vote);
        db.run(sql, [draftId, userId, vote.vote, vote.reason], (err) => {
            if(err){
                reject(err);
            }
            else{
                resolve(true);
            }
        })
    })
}




