'use strict';

const Draft = require('../components/draft');
let reviewsService = require('./ReviewsService');
let uf = require('./UtilFunctions');
const db = require('../components/db');
let constants = require('../utils/constants.js');

exports.getTotalDrafts = function(filmId, reviewId){
    return new Promise((resolve, reject) => {
        try{
            var sqlNumOfFilms = "SELECT count(*) total FROM drafts D, reviews R, films F WHERE D.reviewId = R.id AND R.filmId = F.id AND F.id = ? AND R.id = ?";
            db.get(sqlNumOfFilms, [filmId, reviewId], (err, size) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(size.total);
                }
            });
        } catch(err){
            reject(err)
        }
    });
}

exports.getDrafts = function(req){
    return new Promise(async (resolve, reject) => {
        try{
            let filmId = req.params.filmId;
            let reviewId = req.params.reviewId;
            let userId = req.user.id;


            let check1 = await uf.filmExists(filmId);
            let check2 = await uf.reviewExist(reviewId);
            let check3 = await checkReviewIsCooperative(reviewId, true);
            let check4 = await checkPermissions(reviewId, userId);
            
            if(check1 && check2 && check3 && check4){
                console.log("checks passed");
                let sql = `SELECT D.id AS draftId, D.reviewId AS reviewId, D.userId AS author, D.rating, D.review, D.status
                        FROM drafts D, reviews R, films F WHERE F.id = R.filmId AND R.id = D.reviewId AND F.id = ? AND R.id = ?`;

                let params = getPagination(req)
                if (params.length == 2) sql = sql + " LIMIT ?,?";
                params.unshift(reviewId);
                params.unshift(filmId);

                db.all(sql, params, async (err, rows) => {
                    if(err){
                        reject(uf.getResponseMessage("500"));
                    }
                    else{
                        let complete_drafts = [];

                        for(const draft of rows){
                            let votes = await getVotesOfDraft(draft.draftId);
                            let complete_draft = createDraft(filmId, draft, votes);
                            complete_drafts.push(complete_draft);
                        }


                        let response = uf.getResponseMessage("200");
                        response[0]["payload"] = complete_drafts;
                        console.log(response);
                        resolve(response);
                    }
                })
            }
            else if(!check1){
                reject(uf.getResponseMessage("409f"));
            }
            else if(!check2){
                reject(uf.getResponseMessage("409g"));
            }
            else if(!check3){
                reject(uf.getResponseMessage("409l"));
            }
            else if(!check4){
                reject(uf.getResponseMessage("409b"));
            }
        } catch(err){
            reject(uf.getResponseMessage("500"));
        }
    });
}

exports.getSingleDraft = function(filmId, reviewId, userId, draftId){
    return new Promise(async (resolve, reject) => {
        try{
            let check1 = await uf.filmExists(filmId);
            let check2 = await uf.reviewExist(reviewId);
            let check3 = await checkReviewIsCooperative(reviewId, true);
            let check4 = await checkPermissions(reviewId, userId);

            console.log(check1, check2, check3, check4);
            if(check1 && check2 && check3 && check4){
                let sql = `SELECT D.id AS draftId, D.reviewId AS reviewId, D.userId AS author, D.rating, D.review, D.status
                        FROM drafts D, reviews R, films F WHERE D.id = ? AND D.reviewId = R.id AND R.filmId = F.id AND F.id = ? AND R.id = ?`;

                db.get(sql, [draftId, filmId, reviewId], async (err, draft) => {
                    if(err){
                        console.log(err);
                        reject(uf.getResponseMessage("500"));
                    }
                    else{
                        console.log(draft);
                        if(draft !== undefined){
                            let votes = await getVotesOfDraft(draftId);
                            let complete_draft = createDraft(filmId, draft, votes);
                        
                            let response = uf.getResponseMessage("200");
                            response[0]["payload"] = complete_draft;

                            resolve(response);
                        }
                        else{
                            reject(uf.getResponseMessage("404"));
                        }
                        
                    }
                })      
            }
            else if(!check1){
                reject(uf.getResponseMessage("409f"))
            }
            else if(!check2){
                reject(uf.getResponseMessage("409g"))
            }
            else if(!check3){
                reject(uf.getResponseMessage("409l"))
            }
            else if(!check4){
                reject(uf.getResponseMessage("409b"))
            }
    } catch(err){
        reject(uf.getResponseMessage("500"));
    }
    });
}

exports.createDraft = function(filmId, reviewId, userId, draft){
    return new Promise(async (resolve, reject) => {
        try{
            let check1 = await uf.filmExists(filmId);
            let check2 = await uf.reviewExist(reviewId);
            let check3 = await checkPermissions(reviewId, userId);
            let check4 = await checkReviewIsCooperative(reviewId);
            let check5 = await checkDraftAlreadyOpen(reviewId);

            if(check1 && check2 && check3 && check4 && check5){
                const sql = "INSERT INTO drafts(reviewId, userId, rating, review, status) VALUES(?,?,?,?,?)";
                    
                db.run(sql, [reviewId, userId, draft.rating, draft.review, 1], async (err) => {
                    if(err){
                        reject(uf.getResponseMessage("500"));
                    }
                    else{
                        let lastID = await uf.getLastInsertId();
                        let voteInsertResult = await insertVote(lastID, userId, {"vote": true})

                        if(voteInsertResult){
                            let implicitVote = {"userId": userId, "vote": true};
                            let createdDraft = new Draft(lastID, filmId, reviewId, [implicitVote], draft.rating, draft.review, 'open', userId);
                            let response = uf.getResponseMessage("201");
                            response[0]["payload"] = createdDraft;

                            resolve(response);
                        }
                        else{
                            reject(uf.getResponseMessage("500"));
                        }
                    }
                })

            //Find a way to isolate and generalize this kind of errors
            }
            else if(!check1){
                reject(uf.getResponseMessage("409f"));
            }
            else if(!check2){
                reject(uf.getResponseMessage("409g"));
            }
            else if(!check3){
                reject(uf.getResponseMessage("409b"))
            }
            else if(!check4){
                reject(uf.getResponseMessage("409h"))
            }
            else if(!check5){
                reject(uf.getResponseMessage("409i"));
            }
        } catch(err){
            reject(uf.getResponseMessage("500"));
        }
    });
}

exports.voteDraft = function voteDraft(req, res, next){
    return new Promise(async (resolve, reject) => {
        try{
            let userId = req.user.id;
            let filmId = req.params.filmId;
            let reviewId = req.params.reviewId;
            let draftId = req.params.draftId;

            let check1 = await uf.filmExists(filmId);
            let check2 = await uf.reviewExist(reviewId);
            let check3 = await uf.draftExistAndOpen(draftId, filmId, reviewId);
            let check4 = await reviewsService.checkIfUserIsReviewer(reviewId, userId);
            let check5 = await checkSingleVote(draftId, userId);

            if(check1 && check2 && check3 && check4 && check5){
                let reason;
                let vote = req.body.vote;

                vote === false ? reason = req.body.reason : null;
    
                await insertVote(draftId, userId, {"vote": vote, "reason": reason});
                await evaluateVoteAction(draftId, reviewId, userId);

                resolve(uf.getResponseMessage("204"));
            }
            else if(!check1){
                reject(uf.getResponseMessage("409f"))
            }
            else if(!check2){
                reject(uf.getResponseMessage("409g"))
            }
            else if(!check3){
                reject(uf.getResponseMessage("409j"))
            }
            else if(!check4){
                reject(uf.getResponseMessage("409b"))
            }
            else if(!check5){
                reject(uf.getResponseMessage("409k"))
            }
        } catch(err){
            reject(uf.getResponseMessage("500"));
        }
    })
}


const checkPermissions = function(reviewId, userId){
    return new Promise(async (resolve, reject) => {
        try{
            let result = await reviewsService.checkIfUserIsReviewer(reviewId, userId);

            resolve(result);
        } catch(err){
            reject(err);
        }
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

const checkReviewIsCooperative = function(reviewId, flag=false){
    return new Promise((resolve, reject) => {
        let sql = "SELECT id FROM reviews WHERE id = ? AND type = ?";
        let parameters = [reviewId, 'coop'];

        console.log(flag);
        if(!flag){
            sql += " AND completed = ?";
            parameters.push(false);
        }

        db.get(sql, parameters, (err, rows) => {
            if(err){
                console.log(err);
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
    return new Promise(async (resolve, reject) => {
        try{
            let reviewers_count = await uf.getReviewersCount(reviewId);
            let voters_count = await uf.getNumVotesOfDraft(draftId);

            if(reviewers_count === voters_count){
                let agree_count = await getAgreeVotes(draftId);

                if(agree_count === voters_count){
                    let closeDraftResult = await closeDraft(draftId);

                    if(closeDraftResult){
                        let draft = await getDraftData(draftId);
                        console.log(draft)
                        if(draft === undefined){
                            reject();
                        }
                        else{
                            let updateReviewResult = await reviewsService.updateReviewWithDraft(reviewId, draft);

                            if(updateReviewResult){
                                resolve(true);
                            }
                            else{
                                reject();
                            }
                        }
                    }
                    else{
                        reject();
                    }
                }
                else{
                    await closeDraft(draftId);
                    resolve(true);
                }
            }
            else{
                resolve(true);
            }
        } catch(err){
            reject(err);
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

const getDraftIdsByReview = function(reviewId){
    return new Promise((resolve, reject) => {
        const sql = "SELECT id FROM drafts WHERE reviewId = ?";

        db.all(sql, [reviewId], (err, rows) => {
            if(err){
                reject(err);
            }
            else{
                resolve(rows);
            }
        })
    })
}


exports.deleteDraftsAndVotesOfReview = function(reviewId){
    return new Promise(async (resolve, reject) => {
        try{
            let draftIds = await getDraftIdsByReview(reviewId);

            for(const draftId of draftIds){
                console.log(draftId.id);
                await deleteVotesOfDraft(draftId.id);
            }
            
            let result = await deleteDraftByReviewId(reviewId);

            if(result){
                resolve(true);
            }
        } catch (err){
            reject(err);
        }
    });
}

const deleteVotesOfDraft = function(draftId){
    return new Promise((resolve, reject) => {
        const sql1 = "DELETE FROM votes WHERE draftId = ?";

        db.run(sql1, [draftId], (err) => {
            if(err){
                reject(err);
            }
            else{
                resolve(true);
            }
        })
    })
}

const deleteDraftByReviewId = function(reviewId){
    return new Promise((resolve, reject) => {
        const sql2 = "DELETE FROM drafts WHERE reviewId = ?"

        db.run(sql2, [reviewId], (err) => {
            if(err){
                reject(err);
            }
            else{
                resolve(true);
            }
        })
    })
}




