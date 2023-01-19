'use strict';

var utils = require('../utils/writer.js');
var Drafts = require('../service/DraftsService');
var constants = require('../utils/constants.js');

module.exports.getDrafts = function getDrafts(req, res, next){
    let numOfDrafts = 0;
    let filmId = req.params.filmId;
    let reviewId = req.params.reviewId;
    let userId = req.user.id;

    //Check if user is a reviewer

    Drafts.getTotalDrafts(filmId, reviewId)
        .then(function(response) {
            numOfDrafts = response;
            Drafts.getDrafts(filmId, reviewId, userId)
            .then(function(response) {
                if (req.query.pageNo == null) var pageNo = 1;
                else var pageNo = req.query.pageNo;
                var totalPage=Math.ceil(numOfDrafts / constants.OFFSET);
                next = Number(pageNo) + 1;
                if (pageNo>totalPage) {
                    utils.writeJson(res, {
                        totalPages: totalPage,
                        currentPage: pageNo,
                        totalItems: numOfDrafts,
                        films: {}
                    });
                } else if (pageNo == totalPage) {
                    utils.writeJson(res, {
                        totalPages: totalPage,
                        currentPage: pageNo,
                        totalItems: numOfDrafts,
                        films: response
                    });
                } else {
                    utils.writeJson(res, {
                        totalPages: totalPage,
                        currentPage: pageNo,
                        totalItems: numOfDrafts,
                        films: response,
                        next: "/api/films/public/"+ filmId +"/reviews/"+ reviewId +"/drafts?pageNo=" + next
                    });
                }
        })
        .catch(function(response) {
            utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
        });
        })
        .catch(function(response) {
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
      });
}

module.exports.getSingleDraft = function getSingleDraft(req, res, next){

    //Check if user is a reviewer
    Drafts.getSingleDraft(req.params.filmId, req.params.reviewId, req.user.id)
          .then(function(response) {
              utils.writeJson(res, response);
          })
          .catch(function(response) {
              if(response == 403){
                  utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The user is not the owner of the film.' }], }, 403);
              }
              else if (response == 404){
                  utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The film does not exist.' }], }, 404);
              }
              else {
                  utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
              }
          });
}

module.exports.createDraft = function createDraft(req, res, next){
    var draft = req.body;
    var userId = req.user.id;
    var filmId = req.params.filmId;
    var reviewId = req.params.reviewId

    Drafts.createDraft(filmId, reviewId, userId, draft)
        .then(function(response) {
            utils.writeJson(res, response, 201);
        })
        .catch(function(response) {
            utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
        });
}

module.exports.voteDraft = function voteDraft(req, res, next){
    //Update of the draft, more specifically of the votes table
}