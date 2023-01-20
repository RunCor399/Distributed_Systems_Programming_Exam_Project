class Review{    
    constructor(filmId, reviewId, reviewers, completed, reviewDate, rating, review, type) {
        this.filmId = filmId;
        this.reviewId = reviewId;
        this.completed = completed;
        this.reviewers = reviewers;
        this.type = type;

        if(reviewDate)
            this.reviewDate = reviewDate;
        if(rating)
            this.rating = rating;
        if(review)
            this.review = review;
        
        var selfLink = "/api/films/public/" + this.filmId + "/reviews/" + this.reviewId;
        this.self =  selfLink;
        this.filmLink = "/api/films/public/" + this.filmId;

        if(type === "coop")
            this.draftsLink = "/api/films/public/" + this.filmId + "/reviews/" + this.reviewId + "/drafts"
    }
}

module.exports = Review;


