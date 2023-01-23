'use strict';

var utils = require('../utils/writer.js');
var Films = require('../service/FilmsService');
var constants = require('../utils/constants.js');

module.exports.getPublicFilms = function getPublicFilms (req, res, next) {
    var numOfFilms = 0;
    var next=0;
  
    Films.getPublicFilmsTotal()
        .then(function(response) {
            numOfFilms = response;
            Films.getPublicFilms(req)
            .then(function(response) {
                if (req.query.pageNo == null) var pageNo = 1;
                else var pageNo = req.query.pageNo;
                var totalPage=Math.ceil(numOfFilms / constants.OFFSET);
                next = Number(pageNo) + 1;
                if (pageNo>totalPage) {
                    utils.writeJson(res, {
                        totalPages: totalPage,
                        currentPage: pageNo,
                        totalItems: numOfFilms,
                        films: []
                    });
                } else if (pageNo == totalPage) {
                    utils.writeJson(res, {
                        totalPages: totalPage,
                        currentPage: pageNo,
                        totalItems: numOfFilms,
                        films: response[0]["payload"]
                    });
                } else {
                    utils.writeJson(res, {
                        totalPages: totalPage,
                        currentPage: pageNo,
                        totalItems: numOfFilms,
                        films: response[0]["payload"],
                        next: "/api/films/public?pageNo=" + next
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
  
  
    
  };

  module.exports.getInvitedFilms = function getInvitedFilms (req, res, next) {
    var numOfFilms = 0;
    var next=0;
  
    Films.getInvitedFilmsTotal(req.user.id)
        .then(function(response) {
            numOfFilms = response;
            Films.getInvitedFilms(req)
            .then(function(response) {
                if (req.query.pageNo == null) var pageNo = 1;
                else var pageNo = req.query.pageNo;
                var totalPage=Math.ceil(numOfFilms / constants.OFFSET);
                next = Number(pageNo) + 1;
                if (pageNo>totalPage) {
                    utils.writeJson(res, {
                        totalPages: totalPage,
                        currentPage: pageNo,
                        totalItems: numOfFilms,
                        films: []
                    });
                } else if (pageNo == totalPage) {
                    utils.writeJson(res, {
                        totalPages: totalPage,
                        currentPage: pageNo,
                        totalItems: numOfFilms,
                        films: response[0]["payload"]
                    });
                } else {
                    utils.writeJson(res, {
                        totalPages: totalPage,
                        currentPage: pageNo,
                        totalItems: numOfFilms,
                        films: response[0]["payload"],
                        next: "/api/films/public/invited?pageNo=" + next
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
  
  module.exports.getPrivateFilms = function getPrivateFilms (req, res, next) {
      var numOfFilms = 0;
      var next=0;
    
      Films.getPrivateFilmsTotal(req.user.id)
          .then(function(response) {
              numOfFilms = response;
              Films.getPrivateFilms(req)
              .then(function(response) {
                  if (req.query.pageNo == null) var pageNo = 1;
                  else var pageNo = req.query.pageNo;
                  var totalPage=Math.ceil(numOfFilms / constants.OFFSET);
                  next = Number(pageNo) + 1;
                  if (pageNo>totalPage) {
                    utils.writeJson(res, {
                        totalPages: totalPage,
                        currentPage: pageNo,
                        totalItems: numOfFilms,
                        films: []
                    });
                  } else if (pageNo == totalPage) {
                      utils.writeJson(res, {
                          totalPages: totalPage,
                          currentPage: pageNo,
                          totalItems: numOfFilms,
                          films: response[0]["payload"]
                      });
                  } else {
                      utils.writeJson(res, {
                          totalPages: totalPage,
                          currentPage: pageNo,
                          totalItems: numOfFilms,
                          films: response[0]["payload"],
                          next: "/api/films/private?pageNo=" + next
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
  


module.exports.createFilm = function createFilm (req, res, next) {
    var film = req.body;
    var owner = req.user.id;
    Films.createFilm(film, owner)
        .then(function(response) {
            utils.writeJson(res, {'param': 'Server', 'msg': response[0]["payload"]}, response[0]["code"]);
        })
        .catch(function(response) {
            utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response[0]["message"] }], }, response[0]["code"]);
        });
  };

module.exports.getSinglePrivateFilm = function getSinglePrivateFilm (req, res, next) {
    Films.getSinglePrivateFilm(req.params.filmId, req.user.id)
          .then(function(response) {
              utils.writeJson(res, response[0]["payload"], response[0]["code"]);
          })
          .catch(function(response) {
            utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response[0]["message"] }], }, response[0]["code"]);
          });
  };

module.exports.updateSinglePrivateFilm = function updateSinglePrivateFilm (req, res, next) {
    Films.updateSinglePrivateFilm(req.body, req.params.filmId, req.user.id)
    .then(function(response) {
        utils.writeJson(res, response[0]["message"], response[0]["code"]);
    })
    .catch(function(response) {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response[0]["message"] }], }, response[0]["code"]);
    });
  };

module.exports.deleteSinglePrivateFilm = function deleteSinglePrivateFilm (req, res, next) {
  Films.deleteSinglePrivateFilm(req.params.filmId, req.user.id)
        .then(function(response) {
            utils.writeJson(res, response[0]["message"], response[0]["code"]);
        })
        .catch(function(response) {
            utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response[0]["message"] }], }, response[0]["code"]);
        });
};



module.exports.getSinglePublicFilm = function getSinglePublicFilm (req, res, next) {
    Films.getSinglePublicFilm(req.params.filmId)
    .then(function(response) {
        utils.writeJson(res, response[0]["payload"], response[0]["code"]);
    })
    .catch(function(response) {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response[0]["message"] }], }, response[0]["code"]);
    });
};

module.exports.updateSinglePublicFilm = function updateSinglePublicFilm (req, res, next) {
    Films.updateSinglePublicFilm(req.body, req.params.filmId, req.user.id)
    .then(function(response) {
        utils.writeJson(res, response[0]["message"], response[0]["code"]);
    })
    .catch(function(response) {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response[0]["message"] }], }, response[0]["code"]);
    });
  };

  module.exports.deleteSinglePublicFilm = function deleteSinglePublicFilm (req, res, next) {
    Films.deleteSinglePublicFilm(req.params.filmId, req.user.id)
          .then(function(response) {
            utils.writeJson(res, response[0]["message"], response[0]["code"]);
          })
          .catch(function(response) {
            utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response[0]["message"] }], }, response[0]["code"]);
          });
  };
  
  