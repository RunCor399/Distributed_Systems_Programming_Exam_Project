class Draft{    
    constructor(draftId, filmId, reviewId, votes, rating, review, status, author) {
        this.draftId = draftId
        this.filmId = filmId;
        this.reviewId = reviewId;
        this.votes = votes;
        this.rating = rating;
        this.review = review;
        this.status = status;
        this.author = "/api/users/" + author;
        var selfLink = "/api/films/public/" + this.filmId + "/reviews/" + this.reviewId + "/drafts/" + this.draftId;
        this.self =  selfLink;
        this.reviewLink = "/api/films/public/" + this.filmId + "/reviews/" + this.reviewId;
    }
}

module.exports = Draft;


