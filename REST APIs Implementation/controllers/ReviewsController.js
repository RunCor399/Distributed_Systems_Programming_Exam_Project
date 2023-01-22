'use strict';

var utils = require('../utils/writer.js');
var Reviews = require('../service/ReviewsService');
var constants = require('../utils/constants.js');

module.exports.getFilmReviews = function getFilmReviews (req, res, next) {

    //retrieve a list of reviews
    var numOfReviews = 0;
    var next=0;

    Reviews.getFilmReviewsTotal(req.params.filmId)
        .then(function(response) {
          
            numOfReviews = response;
            Reviews.getFilmReviews(req)
            .then(function(response) {
                if (req.query.pageNo == null) var pageNo = 1;
                else var pageNo = req.query.pageNo;
                var totalPage=Math.ceil(numOfReviews / constants.OFFSET);
                next = Number(pageNo) + 1;
                if (pageNo>totalPage) {
                    utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response[0]["message"]}], }, response[0]["code"]);
                } else if (pageNo == totalPage) {
                    utils.writeJson(res, {
                        totalPages: totalPage,
                        currentPage: pageNo,
                        totalItems: numOfReviews,
                        reviews: response[0]["payload"]
                    });
                } else {
                    utils.writeJson(res, {
                        totalPages: totalPage,
                        currentPage: pageNo,
                        totalItems: numOfReviews,
                        reviews: response[0]["payload"],
                        next: "/api/films/public/"+req.params.filmId+"/reviews?pageNo=" + next
                    });
                }
        })
        .catch(function(response) {
            utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response[0]["message"] }], }, response[0]["code"]);
        });
        })
        .catch(function(response) {
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response[0]["message"] }], }, response[0]["code"]);
      });
  
};


module.exports.getSingleReview = function getSingleReview (req, res, next) {

    Reviews.getSingleReview(req.params.filmId, req.params.reviewId)
        .then(function(response) {
            utils.writeJson(res, response[0]["payload"]);
        })
        .catch(function(response) {
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response[0]["message"] }], }, response[0]["code"]);
        });
};


module.exports.deleteSingleReview = function deleteSingleReview (req, res, next) {

  Reviews.deleteSingleReview(req.params.filmId, req.params.reviewId, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response[0]["message"], response[0]["code"]);
    })
    .catch(function (response) {
      utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response[0]["message"] }], }, response[0]["code"]);
    });
};

module.exports.issueFilmReview = function issueFilmReview (req, res, next) {
  console.log(req.params.filmId, req.body.filmId)
  if(req.params.filmId != req.body.filmId){
    utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The filmId field of the review object is different from the filmdId path parameter.' }], }, 409);
  }
  else {
    Reviews.issueFilmReview(req.body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response[0]["payload"], response[0]["code"]);
    })
    .catch(function (response) {
      utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response[0]["message"] }], }, response[0]["code"]);
    });
  }
};

module.exports.updateSingleReview = function updateSingleReview (req, res, next) {
  if(req.body.completed == undefined) {
    utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The completed property is absent.' }], }, 400);
  }
  else if(req.body.completed == false) {
    utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The completed property is false, but it should be set to true.' }], }, 400);
  }
  else {
    Reviews.updateSingleReview(req.body, req.params.filmId, req.params.reviewId, req.user.id)
    .then(function(response) {
        utils.writeJson(res, response[0]["message"], response[0]["code"]);
    })
    .catch(function(response) {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response[0]["message"] }], }, response[0]["code"]);
    });
  }
};

