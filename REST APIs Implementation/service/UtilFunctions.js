'use strict';

const db = require('../components/db');
var constants = require('../utils/constants.js');


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

