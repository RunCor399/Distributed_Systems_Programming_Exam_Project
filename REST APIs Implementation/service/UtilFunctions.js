'use strict';

const db = require('../components/db');
var constants = require('../utils/constants.js');

const responseMessages = [
                        {id:"200", code:200, message:"Successfull Operation"},
                        {id:"201", code:201, message:"Created"},
                        {id:"204", code:204, message:"No Content"},
                        {id:"400", code:400, message:"Bad Request"},
                        {id:"401", code:401, message:"Unauthorized"},
                        {id:"403a", code:403, message:"Forbidden, you are not the owner of this film"},
                        {id:"403b", code:403, message:"Forbidden, this review was already completed"},
                        {id:"403c", code:403, message:"Forbidden, you are not a reviewer of this film"},
                        {id:"404", code:404, message:"Not Found"},
                        {id:"409a", code:409, message:"This film cannot be updated"},
                        {id:"409b", code:409, message:"You are not a reviewer of this specific review"},
                        {id:"409c", code:409, message:"Cooperative review invitation couldn't be send"},
                        {id:"409d", code:409, message:"Single review invitation couldn't be send"},
                        {id:"409e", code:409, message:"One or more of the reviewers doesn't exist"},
                        {id:"409f", code:409, message:"This film doesn't exist"},
                        {id:"409g", code:409, message:"This review doesn't exist"},
                        {id:"409h", code:409, message:"This review isn't cooperative or it has already been completed"},
                        {id:"409i", code:409, message:"There is a draft already open for this review"},
                        {id:"409j", code:409, message:"This draft doesn't exist or it has already been closed"},
                        {id:"409k", code:409, message:"You have already voted for this draft"},
                        {id:"409l", code:409, message:"This review is not cooperative"},
                        {id:"500", code:200, message:"Internal Server Error"},
                    ];


exports.getLastInsertId = function(){
    return new Promise((resolve, reject) => {
        db.get("SELECT last_insert_rowid() as lastID", (err, row) => {
            if(err){
                console.log(err);
                reject(err);
            }
            else{
                resolve(row.lastID);
            }
        });
    })
}


exports.filmExists = function(filmId){
    return new Promise((resolve, reject) => {
        const sql = "SELECT id FROM films WHERE id = ?";
        db.get(sql, [filmId], (err, rows) => {
            if(err){
                reject(err);
            }
            else{
                rows !== undefined ? resolve(true) : resolve(false);
            }
        })
    })
}

exports.reviewExist = function(reviewId){
    return new Promise((resolve, reject) => {
        const sql = "SELECT id FROM reviews WHERE id = ?";
        db.get(sql, [reviewId], (err, rows) => {
            if(err){
                reject(err);
            }
            else{
                rows !== undefined ? resolve(true) : resolve(false);
            }
        });
    });
}

exports.draftExistAndOpen = function(draftId, filmId, reviewId){
    return new Promise((resolve, reject) => {
        const sql = `SELECT D.id FROM drafts D, reviews R, films F WHERE D.id = ? AND D.status = ?
                     AND F.id = R.filmId AND R.id = D.reviewId AND F.id = ? AND R.id = ?`;
        db.get(sql, [draftId, true, filmId, reviewId], (err, rows) => {
            if(err){
                reject(err);
            }
            else{
                rows !== undefined ? resolve(true) : resolve(false);
            }
        });
    });
}

exports.getReviewersCount = function(reviewId){
    return new Promise((resolve, reject) => {
        const sql = "SELECT COUNT(*) AS num_reviewers FROM reviewers WHERE reviewId = ?";

        db.get(sql, [reviewId], (err, rows) => {
            if(err){
                reject(err);
            }
            else{
                console.log("Reviewers: ", rows.num_reviewers);
                resolve(rows.num_reviewers);
            }
        });
    })
}

exports.getNumVotesOfDraft = function(draftId){
    return new Promise((resolve, reject) => {
        const sql = "SELECT COUNT(*) AS num_voters FROM votes WHERE draftId = ?";

        db.get(sql, [draftId], (err, rows) => {
            if(err){
                reject(err);
            }
            else{
                console.log("Voters: ", rows.num_voters);
                resolve(rows.num_voters);
            }
        });
    })
}


exports.getResponseMessage = function(code){
    return responseMessages.filter((elem) => elem.id === code)
}

