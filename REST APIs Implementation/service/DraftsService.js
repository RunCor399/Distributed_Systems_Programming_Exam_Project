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

exports.getDrafts = function(filmId, reviewId, userId){
    return new Promise(async (resolve, reject) => {
        let check1 = await uf.filmExists(filmId);
        let check2 = await uf.reviewExist(reviewId);
        let check3 = await checkPermissions(reviewId, userId);

        if(check1 && check2 && check3){
            //can return drafts
            const sql = "SELECT "
        }
    });
}

exports.getSingleDraft = function(filmId, reviewId, userId){
    return new Promise(async (resolve, reject) => {
        let result = await checkPermissions(reviewId, userId);

        if(result){
            //can return draft
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
                    let createdDraft = new Draft(lastID, filmId, reviewId, [], draft.rating, draft.review, 'open', userId);

                    resolve(createdDraft);
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

