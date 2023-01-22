'use strict';

var utils = require('../utils/writer.js');
var Drafts = require('../service/DraftsService');
var constants = require('../utils/constants.js');

module.exports.getDrafts = function getDrafts(req, res, next){
    let numOfDrafts = 0;
    let filmId = req.params.filmId;
    let reviewId = req.params.reviewId;

    //Check if user is a reviewer

    Drafts.getTotalDrafts(filmId, reviewId)
        .then(function(response) {
            numOfDrafts = response;
            Drafts.getDrafts(req)
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
                        drafts: []
                    });
                } else if (pageNo == totalPage) {
                    utils.writeJson(res, {
                        totalPages: totalPage,
                        currentPage: pageNo,
                        totalItems: numOfDrafts,
                        drafts: response[0]["payload"]
                    });
                } else {
                    utils.writeJson(res, {
                        totalPages: totalPage,
                        currentPage: pageNo,
                        totalItems: numOfDrafts,
                        drafts: response[0]["payload"],
                        next: "/api/films/public/"+ filmId +"/reviews/"+ reviewId +"/drafts?pageNo=" + next
                    });
                }
        })
        .catch(function(response) {
            utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response[0]["message"] }], }, 500);
        });
        })
        .catch(function(response) {
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response[0]["message"] }], }, 500);
      });
}

module.exports.getSingleDraft = function getSingleDraft(req, res, next){
    Drafts.getSingleDraft(req.params.filmId, req.params.reviewId, req.user.id, req.params.draftId)
          .then(function(response) {
              utils.writeJson(res, response[0]["payload"]);
          })
          .catch(function(response) {
            utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response[0]["message"] }], }, 403);
          });
}

module.exports.createDraft = function createDraft(req, res, next){
    var draft = req.body;
    var userId = req.user.id;
    var filmId = req.params.filmId;
    var reviewId = req.params.reviewId

    Drafts.createDraft(filmId, reviewId, userId, draft)
        .then(function(response) {
            utils.writeJson(res, response[0]["payload"], response[0]["code"]);
        })
        .catch(function(response) {
            utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response[0]["message"] }], }, 500);
        });
}

module.exports.voteDraft = async function voteDraft(req, res, next){
    let voteResult;

    try{
        voteResult = await Drafts.voteDraft(req);

        if(!res.headersSent){
            utils.writeJson(res, voteResult, 204);
        }
        
    } catch(err){
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': err }], }, 500);
    }

    
}