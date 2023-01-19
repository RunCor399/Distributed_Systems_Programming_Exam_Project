'use strict';

const Draft = require('../components/draft');
let reviewsService = require('./ReviewsService');
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
        let result = await checkPermissions(reviewId, userId);

        if(result){
            //can return drafts
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
        let result = await checkPermissions(reviewId, userId);

        if(result){
            //check if draft already open
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

    });
}

