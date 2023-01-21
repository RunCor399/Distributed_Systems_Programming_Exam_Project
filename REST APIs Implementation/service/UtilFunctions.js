'use strict';

const db = require('../components/db');
var constants = require('../utils/constants.js');

const errorMessages = [
                        {id:"200", code:200, message:"Successfull Operation"},
                        {id:"201", code:201, message:"Created"},
                        {id:"204", code:204, message:"No Content"},
                        {id:"400", code:400, message:"Bad Request"},
                        {id:"401", code:401, message:"Unauthorized"},
                        {id:"403", code:403, message:"Forbidden"},
                        {id:"404", code:403, message:"Not Found"},
                        {id:"409a", code:409, message:"This film cannot be updated"},
                        {id:"409b", code:409, message:"You are not a reviewer of this specific review"},
                        {id:"409c", code:409, message:""},
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

exports.draftExistAndOpen = function(draftId){
    return new Promise((resolve, reject) => {
        const sql = "SELECT id FROM drafts WHERE id = ? AND status = ?";
        db.get(sql, [draftId, true], (err, rows) => {
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


exports.getErrorMessage = function(code){
    return errorMessages.filter((elem) => elem.id === code)
}

